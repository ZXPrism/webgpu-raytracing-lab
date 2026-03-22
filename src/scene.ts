export interface Scene {
    name: string,
    date: string,
    version: string,
    objects: SceneObject[]
}

export type Geometry = "sphere" | "rect";
export type Material = "diffuse" | "metal" | "glass";

export interface SceneObject {
    geometry_type: Geometry,
    geometry_data: GeometrySphere | GeometryRect,
    material_type: Material,
    material_data: MaterialDiffuse | MaterialMetal | MaterialGlass
}

export interface GeometrySphere {
    center: [number, number, number],
    radius: number
}

export interface GeometryRect {
    corner: [number, number, number],
    u: [number, number, number],
    v: [number, number, number]
}

export interface MaterialDiffuse {
    albedo: [number, number, number]
}

export interface MaterialMetal {
    albedo: [number, number, number],
    fuzziness: number
}

export interface MaterialGlass {
    albedo: [number, number, number]
    refraction_index: number,
}

// =======================
//  Geometry type mapping
// =======================
export const GEOMETRY_TYPE = {
    SPHERE: 0,
    RECT: 1
} as const;

export type GeometryTypeValue = typeof GEOMETRY_TYPE[keyof typeof GEOMETRY_TYPE];

// =======================
//  Material type mapping
// =======================
export const MATERIAL_TYPE = {
    DIFFUSE: 0,
    METAL: 1,
    GLASS: 2
} as const;

export type MaterialTypeValue = typeof MATERIAL_TYPE[keyof typeof MATERIAL_TYPE];

// =========================
//  Scene buffers interface
// =========================
export interface SceneBuffers {
    object_array_buffer: GPUBuffer;
    sphere_array_buffer: GPUBuffer;
    rect_array_buffer: GPUBuffer;
    material_array_buffer: GPUBuffer;
    object_count: number;
    sphere_count: number;
    rect_count: number;
    material_count: number;
}

// ==========================
//  Material tracking helper
// ==========================
interface MaterialEntry {
    type: Material;
    data: MaterialDiffuse | MaterialMetal | MaterialGlass;
    index: number;
}

import { create_gpu_storage_buffer } from "./kernel_utils";
// ====================
//  Scene loader class
// ====================
import { ShaderReflector } from "./shader_reflector/shader_reflector";

export class SceneLoader {
    private _device: GPUDevice;
    private _shader_reflector: ShaderReflector;

    constructor(device: GPUDevice, shader_reflector: ShaderReflector) {
        this._device = device;
        this._shader_reflector = shader_reflector;
    }

    public async load_from_json(json_path: string): Promise<SceneBuffers> {
        const response = await fetch(json_path);
        if (!response.ok) {
            throw new Error(`Failed to load scene from ${json_path}: ${response.statusText}`);
        }
        const scene_data: Scene = await response.json();
        return this.create_buffers(scene_data);
    }

    public load_from_object(scene_data: Scene): SceneBuffers {
        return this.create_buffers(scene_data);
    }

    private create_buffers(scene_data: Scene): SceneBuffers {
        // ===================
        //  Organize geometry
        // ===================
        const spheres: GeometrySphere[] = [];
        const rects: GeometryRect[] = [];
        const sphere_geometry_to_index = new Map<string, number>();
        const rect_geometry_to_index = new Map<string, number>();

        // ===========================================
        //  Organize materials with explicit tracking
        // ===========================================
        const materials: MaterialEntry[] = [];
        const material_to_index = new Map<string, number>();

        // =====================================================
        //  First pass: collect unique geometries and materials
        // =====================================================
        for (const obj of scene_data.objects) {
            // Collect unique geometries
            if (obj.geometry_type === "sphere") {
                const sphere_data = obj.geometry_data as GeometrySphere;
                const key = JSON.stringify(sphere_data);
                if (!sphere_geometry_to_index.has(key)) {
                    sphere_geometry_to_index.set(key, spheres.length);
                    spheres.push(sphere_data);
                }
            } else if (obj.geometry_type === "rect") {
                const rect_data = obj.geometry_data as GeometryRect;
                const key = JSON.stringify(rect_data);
                if (!rect_geometry_to_index.has(key)) {
                    rect_geometry_to_index.set(key, rects.length);
                    rects.push(rect_data);
                }
            }

            // Collect unique materials with explicit type tracking
            const material_key = JSON.stringify({ type: obj.material_type, data: obj.material_data });
            if (!material_to_index.has(material_key)) {
                const index = materials.length;
                material_to_index.set(material_key, index);
                materials.push({
                    type: obj.material_type,
                    data: obj.material_data,
                    index: index
                });
            }
        }

        // =====================
        //  Create object array
        // =====================
        const object_array = this._shader_reflector.get_struct_array("Object", scene_data.objects.length);

        for (let i = 0; i < scene_data.objects.length; i++) {
            const obj = scene_data.objects[i];

            // Map geometry type to enum using explicit mapping
            let geometry_type_enum: GeometryTypeValue;
            let geometry_data_id: number;
            if (obj.geometry_type === "sphere") {
                geometry_type_enum = GEOMETRY_TYPE.SPHERE;
                const key = JSON.stringify(obj.geometry_data);
                geometry_data_id = sphere_geometry_to_index.get(key)!;
            } else { // rect
                geometry_type_enum = GEOMETRY_TYPE.RECT;
                const key = JSON.stringify(obj.geometry_data);
                geometry_data_id = rect_geometry_to_index.get(key)!;
            }

            // Get material index
            const material_key = JSON.stringify({ type: obj.material_type, data: obj.material_data });
            const material_data_id = material_to_index.get(material_key)!;

            object_array.set_field(i, "geometry_type", geometry_type_enum);
            object_array.set_field(i, "geometry_data_id", geometry_data_id);
            object_array.set_field(i, "material_data_id", material_data_id);
        }

        // =====================
        //  Create sphere array
        // =====================
        const sphere_array = this._shader_reflector.get_struct_array("Sphere", spheres.length);
        for (let i = 0; i < spheres.length; i++) {
            sphere_array.set_field(i, "center", spheres[i].center);
            sphere_array.set_field(i, "radius", spheres[i].radius);
        }

        // ===================
        //  Create rect array
        // ===================
        const rect_array = this._shader_reflector.get_struct_array("Rect", rects.length);
        for (let i = 0; i < rects.length; i++) {
            rect_array.set_field(i, "corner", rects[i].corner);
            rect_array.set_field(i, "u", rects[i].u);
            rect_array.set_field(i, "v", rects[i].v);
        }

        // =======================
        //  Create material array
        // =======================
        const material_array = this._shader_reflector.get_struct_array("Material", materials.length);
        for (let i = 0; i < materials.length; i++) {
            const mat = materials[i];

            // Map material type to enum using explicit mapping
            let material_type_enum: MaterialTypeValue;
            if (mat.type === "diffuse") {
                material_type_enum = MATERIAL_TYPE.DIFFUSE;
                const data = mat.data as MaterialDiffuse;
                material_array.set_field(i, "_type", material_type_enum);
                material_array.set_field(i, "albedo", data.albedo);
            } else if (mat.type === "metal") {
                material_type_enum = MATERIAL_TYPE.METAL;
                const data = mat.data as MaterialMetal;
                material_array.set_field(i, "_type", material_type_enum);
                material_array.set_field(i, "albedo", data.albedo);
                material_array.set_field(i, "fuzziness", data.fuzziness);
            } else { // glass
                material_type_enum = MATERIAL_TYPE.GLASS;
                const data = mat.data as MaterialGlass;
                material_array.set_field(i, "_type", material_type_enum);
                material_array.set_field(i, "albedo", data.albedo);
                material_array.set_field(i, "refraction_index", data.refraction_index);
            }
        }

        // ====================
        //  Create GPU buffers
        // ====================
        const object_array_buffer = create_gpu_storage_buffer(this._device, "object array", object_array.data.byteLength);
        this._device.queue.writeBuffer(object_array_buffer, 0, object_array.data);

        const sphere_array_buffer = create_gpu_storage_buffer(this._device, "sphere array", sphere_array.data.byteLength);
        this._device.queue.writeBuffer(sphere_array_buffer, 0, sphere_array.data);

        const rect_array_buffer = create_gpu_storage_buffer(this._device, "rect array", rect_array.data.byteLength);
        this._device.queue.writeBuffer(rect_array_buffer, 0, rect_array.data);

        const material_array_buffer = create_gpu_storage_buffer(this._device, "material array", material_array.data.byteLength);
        this._device.queue.writeBuffer(material_array_buffer, 0, material_array.data);

        return {
            object_array_buffer,
            sphere_array_buffer,
            rect_array_buffer,
            material_array_buffer,
            object_count: scene_data.objects.length,
            sphere_count: spheres.length,
            rect_count: rects.length,
            material_count: materials.length
        };
    }
}
