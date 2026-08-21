import { create_gpu_storage_buffer } from "./kernel_utils";
import { ShaderReflector } from "./shader_reflector/shader_reflector";

export interface Scene {
    name: string,
    date: string,
    version: string,
    objects: SceneObject[]
}

export type Geometry = "sphere" | "rect" | "triangle";
export type Material = "diffuse" | "metal" | "glass";

export interface SceneObject {
    geometry_type: Geometry,
    geometry_data: GeometrySphere | GeometryRect | GeometryTriangle,
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

export interface GeometryTriangle {
    corner: [number, number, number],
    u: [number, number, number],
    v: [number, number, number]
}

export interface EmissionProps {
    emission?: {
        color: [number, number, number],
        strength: number,
    }
}

export interface MaterialDiffuse extends EmissionProps {
    albedo: [number, number, number]
}

export interface MaterialMetal extends EmissionProps {
    albedo: [number, number, number],
    fuzziness: number
}

export interface MaterialGlass extends EmissionProps {
    albedo: [number, number, number]
    refraction_index: number,
}

// =======================
//  Geometry type mapping
// =======================
export const GEOMETRY_TYPE = {
    SPHERE: 0,
    TRIANGLE: 1,
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
    triangle_array_buffer: GPUBuffer;
    material_array_buffer: GPUBuffer;
    object_count: number;
    sphere_count: number;
    triangle_count: number;
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

// ====================
//  Scene loader class
// ====================

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
        const triangles: GeometryTriangle[] = [];
        const object_id_to_geometry_id: number[] = [];

        // ===========================================
        //  Organize materials with explicit tracking
        // ===========================================
        const materials: MaterialEntry[] = [];
        const material_to_index = new Map<string, number>();

        // =====================================================
        //  First pass: collect unique geometries and materials
        // =====================================================
        let object_count = 0;
        for (const obj of scene_data.objects) {
            // Collect geometries, no need to de-dup, since uniqueness is inherent
            if (obj.geometry_type === "sphere") {
                const sphere_data = obj.geometry_data as GeometrySphere;
                object_id_to_geometry_id.push(spheres.length);
                spheres.push(sphere_data);
                object_count++;
            } else if (obj.geometry_type === "rect") {
                // one rect -> two triangles
                // object_id_to_geometry_id stores the first triangle's index
                object_id_to_geometry_id.push(triangles.length);
                const first_triangle_data = obj.geometry_data as GeometryTriangle;
                const second_triangle_data: GeometryTriangle = {
                    corner: [
                        first_triangle_data.corner[0] + first_triangle_data.u[0] + first_triangle_data.v[0],
                        first_triangle_data.corner[1] + first_triangle_data.u[1] + first_triangle_data.v[1],
                        first_triangle_data.corner[2] + first_triangle_data.u[2] + first_triangle_data.v[2],
                    ],
                    u: [-first_triangle_data.u[0], -first_triangle_data.u[1], -first_triangle_data.u[2]],
                    v: [-first_triangle_data.v[0], -first_triangle_data.v[1], -first_triangle_data.v[2]]
                };
                triangles.push(first_triangle_data);
                triangles.push(second_triangle_data);
                object_count += 2;
            } else if (obj.geometry_type === "triangle") {
                const triangle_data = obj.geometry_data as GeometryTriangle;
                object_id_to_geometry_id.push(triangles.length);
                triangles.push(triangle_data);
                object_count++;
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
        const object_array = this._shader_reflector.get_struct_array("Object", object_count);

        for (let i = 0, write_idx = 0; i < scene_data.objects.length; i++) {
            const obj = scene_data.objects[i];

            // Map geometry type to enum using explicit mapping
            let geometry_type_enum: GeometryTypeValue | null = null;
            if (obj.geometry_type === "sphere") {
                geometry_type_enum = GEOMETRY_TYPE.SPHERE;
            } else if (obj.geometry_type === "triangle" || obj.geometry_type === "rect") {
                geometry_type_enum = GEOMETRY_TYPE.TRIANGLE;
            }

            const geometry_data_id = object_id_to_geometry_id[i];

            // Get material index
            const material_key = JSON.stringify({ type: obj.material_type, data: obj.material_data });
            const material_data_id = material_to_index.get(material_key) as number;

            if (obj.geometry_type === "rect") {
                object_array.set_field(write_idx, "geometry_type", geometry_type_enum as number);
                object_array.set_field(write_idx, "geometry_data_id", geometry_data_id);
                object_array.set_field(write_idx, "material_data_id", material_data_id);
                write_idx++;

                object_array.set_field(write_idx, "geometry_type", geometry_type_enum as number);
                object_array.set_field(write_idx, "geometry_data_id", geometry_data_id + 1);
                object_array.set_field(write_idx, "material_data_id", material_data_id);
                write_idx++;
            } else {
                object_array.set_field(write_idx, "geometry_type", geometry_type_enum as number);
                object_array.set_field(write_idx, "geometry_data_id", geometry_data_id);
                object_array.set_field(write_idx, "material_data_id", material_data_id);
                write_idx++;
            }
        }

        // =====================
        //  Create sphere array
        // =====================
        const sphere_array = this._shader_reflector.get_struct_array("Sphere", spheres.length);
        for (let i = 0; i < spheres.length; i++) {
            sphere_array.set_field(i, "center", spheres[i].center);
            sphere_array.set_field(i, "radius", spheres[i].radius);
        }

        // =======================
        //  Create triangle array
        // =======================
        const triangle_array = this._shader_reflector.get_struct_array("Triangle", triangles.length);
        for (let i = 0; i < triangles.length; i++) {
            triangle_array.set_field(i, "corner", triangles[i].corner);
            triangle_array.set_field(i, "u", triangles[i].u);
            triangle_array.set_field(i, "v", triangles[i].v);
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

            const emission_data = mat.data.emission;
            if (emission_data) {
                material_array.set_field(i, "emission", [
                    emission_data.color[0] * emission_data.strength,
                    emission_data.color[1] * emission_data.strength,
                    emission_data.color[2] * emission_data.strength,
                ]);
            } else {
                material_array.set_field(i, "emission", [0.0, 0.0, 0.0]);
            }
        }

        // ====================
        //  Create GPU buffers
        // ====================
        const object_array_buffer = create_gpu_storage_buffer(this._device, "object array", object_array.data.byteLength);
        this._device.queue.writeBuffer(object_array_buffer, 0, object_array.data);

        const sphere_array_buffer = create_gpu_storage_buffer(this._device, "sphere array", sphere_array.data.byteLength);
        this._device.queue.writeBuffer(sphere_array_buffer, 0, sphere_array.data);

        const triangle_array_buffer = create_gpu_storage_buffer(this._device, "triangle array", triangle_array.data.byteLength);
        this._device.queue.writeBuffer(triangle_array_buffer, 0, triangle_array.data);

        const material_array_buffer = create_gpu_storage_buffer(this._device, "material array", material_array.data.byteLength);
        this._device.queue.writeBuffer(material_array_buffer, 0, material_array.data);

        return {
            object_array_buffer,
            sphere_array_buffer,
            triangle_array_buffer,
            material_array_buffer,
            object_count: object_count,
            sphere_count: spheres.length,
            triangle_count: triangles.length,
            material_count: materials.length
        };
    }
}
