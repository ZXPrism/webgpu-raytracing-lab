import type { BindGroup } from "./bind_group";
import type { Kernel } from "./kernel";
import { KernelBuilder } from "./kernel_builder";
import { BindGroupBuilder } from "./bind_group_builder";
import { create_gpu_indirect_buffer, create_gpu_storage_buffer, create_gpu_storage_buffer_u32, create_gpu_uniform_buffer } from "./kernel_utils";
import { config_camera_center, config_camera_eye, config_camera_focal_length, config_camera_fov_y, config_max_bounce } from "./config";

import { get_shader_utils } from "./shaders/utils";
import { get_shader_gen_ray } from "./shaders/gen_ray";
import { get_shader_prep_hit_test } from "./shaders/prep_hit_test";
import { get_shader_hit_test } from "./shaders/hit_test";
import { get_shader_filter } from "./shaders/filter";
import { get_shader_blit } from "./shaders/blit";

import { vec3 } from "gl-matrix";
import { ShaderReflector } from "./shader_reflector/shader_reflector";
import { EventBus } from "./event_bus";

export class Renderer {
    _event_bus!: EventBus;

    _device!: GPUDevice;
    _context!: GPUCanvasContext;
    _presentation_format!: GPUTextureFormat;
    _canvas_width!: number;
    _canvas_height!: number;
    _pixel_cnt!: number;

    _gen_ray_kernel!: Kernel;
    _gen_ray_kernel_bind_group!: BindGroup;

    _prep_hit_test_kernel!: Kernel;
    _prep_hit_test_kernel_bind_group_pingpong!: BindGroup[];

    _hit_test_kernel!: Kernel;
    _hit_test_kernel_bind_group_pingpong!: BindGroup[];
    _hit_test_kernel_bind_group_shared!: BindGroup;

    _filter_kernel!: Kernel;
    _filter_kernel_bind_group!: BindGroup;

    _blit_pipeline!: GPURenderPipeline;
    _blit_bind_group!: BindGroup;

    _utils_shader_reflector!: ShaderReflector;

    public async main() {
        await this.init_webgpu();
        this.init_canvas_size();
        if (this.pre_init()) {
            this.init_kernels();
            this.init_bind_groups();
            this.init_callbacks();
            this.render();
        }
    }

    public async init_webgpu() {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter === null) {
            console.error("failed to initialize WebGPU!");
            return;
        }

        const device = await adapter.requestDevice({
            requiredLimits: {
                maxBufferSize: adapter.limits.maxBufferSize,
                maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
                maxComputeInvocationsPerWorkgroup: adapter.limits.maxComputeInvocationsPerWorkgroup,
                maxComputeWorkgroupSizeX: adapter.limits.maxComputeWorkgroupSizeX,
                maxStorageBuffersPerShaderStage: adapter.limits.maxStorageBuffersPerShaderStage
            },
            requiredFeatures: ["subgroups"] as const,
        });
        if (device === null) {
            console.error("failed to initialize WebGPU!");
            return;
        }
        this._device = device;

        this._presentation_format = navigator.gpu.getPreferredCanvasFormat();

        const canvas = document.querySelector("canvas");
        if (canvas === null) {
            throw new Error("could not find canvas element. please check index.html!");
        }

        const context = canvas.getContext("webgpu");
        if (context === null) {
            console.error("failed to initialize WebGPU!");
            return;
        }

        context.configure({// srgb?? gamma correction??
            device: this._device,
            format: this._presentation_format,
        });
        this._context = context;

        console.info("successfully initialized WebGPU 🎉");
    }

    public pre_init(): boolean {
        // ===============
        //  check configs
        // ===============

        if (config_max_bounce < 1) {
            console.error(`bad config: "config_max_bounce" should be positive! (given: ${config_max_bounce})`);
            return false;
        }

        // =============
        //  other inits
        // =============

        this._utils_shader_reflector = new ShaderReflector(get_shader_utils());
        this._event_bus = new EventBus();

        return true;
    }

    public prepare_scene_info_data(): ArrayBuffer {
        // ========
        //  camera
        // ========
        // let camera_gaze_norm = normalize(camera_info.center - camera_info.eye);
        // let camera_right_norm = normalize(cross(camera_gaze_norm, vec3f(0.0, 1.0, 0.0)));
        // let camera_down_norm = cross(camera_gaze_norm, camera_right_norm);

        const camera_aspect_ratio = this._canvas_width / this._canvas_height;

        const camera_gaze_norm = vec3.create();
        vec3.sub(camera_gaze_norm, config_camera_center, config_camera_eye);
        vec3.normalize(camera_gaze_norm, camera_gaze_norm);

        const camera_right_norm = vec3.create();
        vec3.cross(camera_right_norm, camera_gaze_norm, vec3.fromValues(0.0, 1.0, 0.0));
        vec3.normalize(camera_right_norm, camera_right_norm);

        const camera_down_norm = vec3.create();
        vec3.cross(camera_down_norm, camera_gaze_norm, camera_right_norm);


        // =============================
        //  viewport (origin: top left)
        // =============================
        // let viewport_height = 2.0 * tan(camera_info.fov_y / 2.0) * camera_info.focal_length;
        // let viewport_width = viewport_height * camera_info.aspect_ratio;
        // let viewport_u = camera_right_norm * viewport_width;
        // let viewport_v = camera_down_norm * viewport_height;
        // let viewport_u_base = viewport_u / f32(width);
        // let viewport_v_base = viewport_v / f32(height);
        // let viewport_top_left = camera_info.eye + (camera_gaze_norm * camera_info.focal_length) - (viewport_u + viewport_v) / 2.0;
        // let pixel00 = viewport_top_left + (0.5 * (viewport_u_base + viewport_v_base)); // default sample point is the center of each pixel

        const viewport_height = 2.0 * Math.tan(config_camera_fov_y / 2.0) * config_camera_focal_length;
        const viewport_width = viewport_height * camera_aspect_ratio;

        const viewport_u = vec3.create();
        vec3.scale(viewport_u, camera_right_norm, viewport_width);

        const viewport_v = vec3.create();
        vec3.scale(viewport_v, camera_down_norm, viewport_height);

        const viewport_u_base = vec3.create();
        vec3.scale(viewport_u_base, viewport_u, 1.0 / this._canvas_width);

        const viewport_v_base = vec3.create();
        vec3.scale(viewport_v_base, viewport_v, 1.0 / this._canvas_height);

        const viewport_top_left = vec3.create();
        const temp = vec3.create();
        vec3.scale(temp, camera_gaze_norm, config_camera_focal_length);
        vec3.add(viewport_top_left, config_camera_eye, temp);
        vec3.add(temp, viewport_u, viewport_v);
        vec3.scale(temp, temp, 0.5);
        vec3.sub(viewport_top_left, viewport_top_left, temp);

        const pixel00 = vec3.create();
        vec3.add(temp, viewport_u_base, viewport_v_base);
        vec3.scale(temp, temp, 0.5);
        vec3.add(pixel00, viewport_top_left, temp);


        // =================
        //  fill scene info
        // =================
        // see `struct SceneInfo` in `utils.wgsl`

        const scene_info_struct = this._utils_shader_reflector.get_struct("SceneInfo");
        scene_info_struct
            .set_field("pixel00", pixel00)
            .set_field("width", this._canvas_width)
            .set_field("height", this._canvas_height)
            .set_field("viewport_u_base", viewport_u_base)
            .set_field("viewport_v_base", viewport_v_base)
            .set_field("eye", config_camera_eye);

        return scene_info_struct.data;
    }

    public init_canvas_size() {
        const canvas = document.querySelector("canvas");
        if (canvas === null) {
            throw new Error("could not find canvas element. please check index.html!");
        }

        const dpr = window.devicePixelRatio;
        canvas.width = Math.floor(dpr * canvas.clientWidth);
        canvas.height = Math.floor(dpr * canvas.clientHeight);
        this._canvas_width = canvas.width;
        this._canvas_height = canvas.height;
        this._pixel_cnt = this._canvas_width * this._canvas_height;
    }

    public init_kernels() {
        // =========
        //  kernels
        // =========
        this._gen_ray_kernel = new KernelBuilder(this._device, "gen ray kernel", get_shader_utils() + get_shader_gen_ray(), "compute")
            .build();

        this._prep_hit_test_kernel = new KernelBuilder(this._device, "prep hit test kernel", get_shader_utils() + get_shader_prep_hit_test(), "compute")
            .build();

        this._hit_test_kernel = new KernelBuilder(this._device, "hit test kernel", get_shader_utils() + get_shader_hit_test(), "compute")
            .build();


        this._filter_kernel = new KernelBuilder(this._device, "filter kernel", get_shader_utils() + get_shader_filter(), "compute")
            .build();

        const blit_bind_group_layout = this._device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "read-only-storage"
                    }
                }
            ]
        });
        const blit_pipeline_layout = this._device.createPipelineLayout({
            bindGroupLayouts: [blit_bind_group_layout]
        });
        this._blit_pipeline = this._device.createRenderPipeline({
            layout: blit_pipeline_layout,
            vertex: {
                module: this._device.createShaderModule({
                    code: get_shader_utils() + get_shader_blit(),
                }),
                entryPoint: "vertex"
            },
            fragment: {
                module: this._device.createShaderModule({
                    code: get_shader_utils() + get_shader_blit(),
                }),
                entryPoint: "fragment",
                targets: [
                    {
                        format: this._presentation_format,
                        writeMask: GPUColorWrite.ALL
                    }
                ]
            },
            primitive: {
                topology: "triangle-strip"
            },
        });

    }

    public init_bind_groups() {
        // ============
        //  scene info
        // ============

        const scene_info_data = this.prepare_scene_info_data();
        const scene_info_buffer = create_gpu_uniform_buffer(this._device, "scene info", scene_info_data.byteLength);
        this._device.queue.writeBuffer(scene_info_buffer, 0, scene_info_data);


        // ===============
        //  object buffer
        // ===============

        const object_cnt = 4;
        const object_array = this._utils_shader_reflector.get_struct_array("Object", object_cnt)
            .set_field(0, "geometry_type", 0)
            .set_field(0, "geometry_data_id", 0)
            .set_field(0, "material_type", 1)
            .set_field(0, "material_data_id", 0)

            .set_field(1, "geometry_type", 0)
            .set_field(1, "geometry_data_id", 1)
            .set_field(1, "material_type", 0)
            .set_field(1, "material_data_id", 1)

            .set_field(2, "geometry_type", 0)
            .set_field(2, "geometry_data_id", 2)
            .set_field(2, "material_type", 0)
            .set_field(2, "material_data_id", 2)

            .set_field(3, "geometry_type", 0)
            .set_field(3, "geometry_data_id", 3)
            .set_field(3, "material_type", 0)
            .set_field(3, "material_data_id", 3);
        const object_array_data = object_array.data;
        const object_array_buffer = create_gpu_storage_buffer(this._device, "object array", object_array_data.byteLength);
        this._device.queue.writeBuffer(object_array_buffer, 0, object_array_data);

        const sphere_cnt = object_cnt; // FIX THIS AFTER WE HAVE NEW GEOMETRY!
        const sphere_array = this._utils_shader_reflector.get_struct_array("Sphere", sphere_cnt)
            .set_field(0, "center", [0.0, 0.5, 1.0 - 1.0 * Math.sqrt(3)])
            .set_field(0, "radius", 0.5)
            .set_field(1, "center", [0.0, -10000.0, 0.0])
            .set_field(1, "radius", 10000.0)
            .set_field(2, "center", [1.0, 0.75, 1.0])
            .set_field(2, "radius", 0.75)
            .set_field(3, "center", [-1.0, 0.3, 1.0])
            .set_field(3, "radius", 0.3);
        const sphere_array_data = sphere_array.data;
        const sphere_array_buffer = create_gpu_storage_buffer(this._device, "sphere array", sphere_array_data.byteLength);
        this._device.queue.writeBuffer(sphere_array_buffer, 0, sphere_array_data);


        // =================
        //  material buffer
        // =================

        const diffuse_material_array = this._utils_shader_reflector.get_struct_array("DiffuseMaterial", sphere_cnt)
            .set_field(0, "albedo", [0.8, 0.0, 0.0])
            .set_field(1, "albedo", [0.5, 0.5, 0.5])
            .set_field(2, "albedo", [0.0, 0.8, 0.0])
            .set_field(3, "albedo", [0.0, 0.0, 0.8]);
        const diffuse_material_array_data = diffuse_material_array.data;
        const diffuse_material_array_buffer = create_gpu_storage_buffer(this._device, "diffuse material array", diffuse_material_array_data.byteLength);
        this._device.queue.writeBuffer(diffuse_material_array_buffer, 0, diffuse_material_array_data);

        const metal_material_array = this._utils_shader_reflector.get_struct_array("MetalMaterial", sphere_cnt)
            .set_field(0, "albedo", [0.8, 0.0, 0.0])
            .set_field(0, "fuzziness", 0.0)
            .set_field(1, "albedo", [0.5, 0.5, 0.5])
            .set_field(1, "fuzziness", 0.0)
            .set_field(2, "albedo", [0.0, 0.8, 0.0])
            .set_field(2, "fuzziness", 0.0)
            .set_field(3, "albedo", [0.0, 0.0, 0.8])
            .set_field(3, "fuzziness", 0.0);
        const metal_material_array_data = metal_material_array.data;
        const metal_material_array_buffer = create_gpu_storage_buffer(this._device, "metal material array", metal_material_array_data.byteLength);
        this._device.queue.writeBuffer(metal_material_array_buffer, 0, metal_material_array_data);

        const color_buffer = create_gpu_storage_buffer(this._device, "color buffer", 16 * this._canvas_width * this._canvas_height);
        const hit_test_indirect_arg = create_gpu_indirect_buffer(this._device, "hit test indirect arg", 12);

        const elem_size_struct_ray = this._utils_shader_reflector.get_struct("Ray").size_bytes;
        const ray_array_length_ping = create_gpu_storage_buffer(this._device, "ray array length ping", 4);
        const ray_array_ping = create_gpu_storage_buffer(this._device, "ray array ping", elem_size_struct_ray * this._canvas_width * this._canvas_height);
        const ray_array_length_pong = create_gpu_storage_buffer(this._device, "ray array length pong", 4);
        const ray_array_pong = create_gpu_storage_buffer(this._device, "ray array pong", elem_size_struct_ray * this._canvas_width * this._canvas_height);

        const frame_index_buffer = create_gpu_storage_buffer_u32(this._device, "frame index", 0);
        this._gen_ray_kernel_bind_group = new BindGroupBuilder(this._device, "gen ray kernel bind group")
            .add_buffer("in_scene_info", 0, scene_info_buffer)
            .add_buffer("out_ray_array_length", 1, ray_array_length_ping)
            .add_buffer("out_ray_array", 2, ray_array_ping)
            .add_buffer("out_frame_index", 3, frame_index_buffer)
            .build(this._gen_ray_kernel);

        const prep_hit_test_kernel_bind_group_ping = new BindGroupBuilder(this._device, "prep hit test kernel bind group ping")
            .add_buffer("in_next_ray_array_length", 0, ray_array_length_ping)
            .add_buffer("out_prev_ray_array_length", 1, ray_array_length_pong)
            .add_buffer("out_indirect_args", 2, hit_test_indirect_arg)
            .build(this._prep_hit_test_kernel);
        const prep_hit_test_kernel_bind_group_pong = new BindGroupBuilder(this._device, "prep hit test kernel bind group pong")
            .add_buffer("in_next_ray_array_length", 0, ray_array_length_pong)
            .add_buffer("out_prev_ray_array_length", 1, ray_array_length_ping)
            .add_buffer("out_indirect_args", 2, hit_test_indirect_arg)
            .build(this._prep_hit_test_kernel);
        this._prep_hit_test_kernel_bind_group_pingpong = [prep_hit_test_kernel_bind_group_ping, prep_hit_test_kernel_bind_group_pong];

        const hit_test_kernel_bind_group_ping = new BindGroupBuilder(this._device, "hit test kernel bind group ping")
            .add_buffer("in_ray_array_length", 0, ray_array_length_ping)
            .add_buffer("in_ray_array", 1, ray_array_ping)
            .add_buffer("out_ray_array_length", 2, ray_array_length_pong)
            .add_buffer("out_ray_array", 3, ray_array_pong)
            .build(this._hit_test_kernel, 0);
        const hit_test_kernel_bind_group_pong = new BindGroupBuilder(this._device, "hit test kernel bind group pong")
            .add_buffer("in_ray_array_length", 0, ray_array_length_pong)
            .add_buffer("in_ray_array", 1, ray_array_pong)
            .add_buffer("out_ray_array_length", 2, ray_array_length_ping)
            .add_buffer("out_ray_array", 3, ray_array_ping)
            .build(this._hit_test_kernel, 0);
        this._hit_test_kernel_bind_group_shared = new BindGroupBuilder(this._device, "hit test kernel bind group shared")
            .add_buffer("in_object_array", 0, object_array_buffer)
            .add_buffer("in_sphere_array", 1, sphere_array_buffer)
            .add_buffer("in_diffuse_material_array", 2, diffuse_material_array_buffer)
            .add_buffer("in_metal_material_array", 3, metal_material_array_buffer)
            .add_buffer("out_color_buffer", 4, color_buffer)
            .build(this._hit_test_kernel, 1);
        this._hit_test_kernel_bind_group_pingpong = [hit_test_kernel_bind_group_ping, hit_test_kernel_bind_group_pong];

        this._filter_kernel_bind_group = new BindGroupBuilder(this._device, "filter kernel bind group")
            .add_buffer("in_frame_index", 0, this._gen_ray_kernel_bind_group.get_buffer("out_frame_index"))
            .add_buffer("in_color_buffer", 1, color_buffer)
            .create_then_add_buffer("out_filtered_color_buffer", 2, GPUBufferUsage.STORAGE, 16 * this._canvas_width * this._canvas_height)
            .build(this._filter_kernel);

        this._blit_bind_group = new BindGroupBuilder(this._device, "blit bind group")
            .add_buffer("in_scene_info", 0, scene_info_buffer)
            .add_buffer("in_filtered_color_buffer", 1, this._filter_kernel_bind_group.get_buffer("out_filtered_color_buffer"))
            .build_raw(this._blit_pipeline);
    }

    public init_callbacks() {
        this._event_bus.listen("canvas-size-changed", () => {
            this.init_canvas_size();
            this.init_bind_groups();
        });

        let resize_callback: number;
        addEventListener("resize", () => {
            if (resize_callback) {
                clearTimeout(resize_callback);
            }
            resize_callback = setTimeout(() => {
                this._event_bus.emit("canvas-size-changed");
            }, 100);
        });
    }

    public render() {
        // let last_timestamp: DOMHighResTimeStamp = 0;
        const _render = (_time: DOMHighResTimeStamp) => {
            // const _delta_time = time - last_timestamp;
            // last_timestamp = time;

            this._event_bus.process();

            const hit_test_indirect_arg = this._prep_hit_test_kernel_bind_group_pingpong[0].get_buffer("out_indirect_args");

            const command_encoder = this._device.createCommandEncoder();
            {
                command_encoder.clearBuffer(this._filter_kernel_bind_group.get_buffer("in_color_buffer"));

                command_encoder.pushDebugGroup("frame");
                {
                    command_encoder.pushDebugGroup("ray generation");
                    {
                        this._gen_ray_kernel.dispatch(command_encoder, this._gen_ray_kernel_bind_group,
                            Math.ceil(this._canvas_width / 16),
                            Math.ceil(this._canvas_height / 16),
                            1
                        );

                        command_encoder.popDebugGroup();
                    }

                    command_encoder.pushDebugGroup("hit test");
                    {
                        for (let i = 0; i < config_max_bounce; i++) {
                            this._prep_hit_test_kernel.dispatch(command_encoder, this._prep_hit_test_kernel_bind_group_pingpong[i & 1],
                                1,
                                1,
                                1
                            );
                            this._hit_test_kernel.dispatch_multiple_bind_group_indirect(command_encoder, [this._hit_test_kernel_bind_group_pingpong[i & 1], this._hit_test_kernel_bind_group_shared], hit_test_indirect_arg);
                        }

                        command_encoder.popDebugGroup();
                    }

                    command_encoder.pushDebugGroup("filtering");
                    {
                        this._filter_kernel.dispatch(command_encoder, this._filter_kernel_bind_group,
                            Math.ceil(this._pixel_cnt / 128),
                            1,
                            1
                        );

                        command_encoder.popDebugGroup();
                    }

                    command_encoder.pushDebugGroup("blit");
                    {
                        const blit_render_pass = command_encoder.beginRenderPass({
                            colorAttachments: [
                                {
                                    view: this._context.getCurrentTexture().createView(),
                                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                                    loadOp: 'clear' as GPULoadOp,
                                    storeOp: 'store' as GPUStoreOp,
                                },
                            ],
                        });
                        blit_render_pass.setBindGroup(0, this._blit_bind_group.bind_group_object);
                        blit_render_pass.setPipeline(this._blit_pipeline);
                        blit_render_pass.draw(4, 1);
                        blit_render_pass.end();

                        command_encoder.popDebugGroup();
                    }

                    command_encoder.popDebugGroup();
                }

                this._device.queue.submit([command_encoder.finish()]);
            }

            window.requestAnimationFrame(_render);
        };

        window.requestAnimationFrame(_render);
    }
}
