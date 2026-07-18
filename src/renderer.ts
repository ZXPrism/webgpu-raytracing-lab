import type { BindGroup } from "./bind_group";
import type { Kernel } from "./kernel";
import { KernelBuilder } from "./kernel_builder";
import { BindGroupBuilder } from "./bind_group_builder";
import { create_gpu_indirect_buffer, create_gpu_storage_buffer, create_gpu_storage_buffer_u32, create_gpu_uniform_buffer, read_gpu_buffer_f32 } from "./kernel_utils";
import { ConfigManager } from "./config";

import { get_shader_utils } from "./shaders/utils";
import { get_shader_gen_ray } from "./shaders/gen_ray";
import { get_shader_prep_hit_test } from "./shaders/prep_hit_test";
import { get_shader_hit_test } from "./shaders/hit_test";
import { filter_kernel_workgroup_size, get_shader_filter } from "./shaders/filter";
import { get_shader_blit } from "./shaders/blit";
import { get_shader_wireframe_rect } from "./shaders/wireframe";

import { vec3, mat4 } from "gl-matrix";
import { ShaderReflector } from "./shader_reflector/shader_reflector";
import { EventBus } from "./event_bus";
import { SceneLoader } from "./scene";
import type { SceneBuffers } from "./scene";
//import { build_bvh, BvhNode } from "./bvh";

export class Renderer {
    private _config_manager: ConfigManager;
    private _scene_loader!: SceneLoader;
    private _scene_buffers!: SceneBuffers;
    //private _bvh_tree: BvhNode | null;

    _event_bus!: EventBus;

    _device!: GPUDevice;
    _context!: GPUCanvasContext;
    _presentation_format!: GPUTextureFormat;
    _canvas_width!: number;
    _canvas_height!: number;
    _pixel_cnt!: number;
    _filter_kernel_dispatch_x!: number;
    _render_diff!: number;

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

    _wireframe_sphere_pipeline!: GPURenderPipeline;
    _wireframe_rect_pipeline!: GPURenderPipeline;
    _wireframe_triangle_pipeline!: GPURenderPipeline;
    _wireframe_bind_group!: BindGroup;

    _utils_shader_reflector!: ShaderReflector;

    constructor(config_manager: ConfigManager) {
        this._config_manager = config_manager;
        //this._bvh_tree = null;
    }

    public async main() {
        await this.init_webgpu();
        this.init_canvas_size();
        if (await this.pre_init()) {
            this.init_kernels();
            this.init_bvh();
            await this.init_bind_groups();
            this.init_callbacks();
            this.render();
        }
    }

    public async init_webgpu() {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter === null) {
            throw new Error("Failed to request WebGPU adapter. Your browser may not support WebGPU.");
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
            throw new Error("Failed to request WebGPU device.");
        }

        // Catch uncaptured WebGPU errors and convert to thrown errors
        device.addEventListener('uncapturederror', (event) => {
            throw new Error(`WebGPU Error: ${event.error.message}`);
        });

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

        console.info("WebGPU initialized successfully 😘");
    }

    public async pre_init(): Promise<boolean> {
        // ===============
        //  check configs
        // ===============

        if (this._config_manager.config.max_bounce < 1) {
            console.error(`bad config: "config_max_bounce" should be positive! (given: ${this._config_manager.config.max_bounce})`);
            return false;
        }

        // =============
        //  other inits
        // =============

        this._utils_shader_reflector = new ShaderReflector(get_shader_utils(this._config_manager.config));
        this._event_bus = new EventBus();

        // =============
        //  scene loader
        // =============
        this._scene_loader = new SceneLoader(this._device, this._utils_shader_reflector);
        this._scene_buffers = await this._scene_loader.load_from_json("./demo_scenes/cube_grid_2.json");

        return true;
    }

    public init_bvh() {
        //this._bvh_tree = build_bvh(this._scene_buffers.object_array);
    }

    public prepare_scene_info_data(
        object_count: number,
        sphere_count: number,
        rect_count: number,
        triangle_count: number,
    ): ArrayBuffer {
        // ========
        //  camera
        // ========
        // let camera_gaze_norm = normalize(camera_info.center - camera_info.eye);
        // let camera_right_norm = normalize(cross(camera_gaze_norm, vec3f(0.0, 1.0, 0.0)));
        // let camera_down_norm = cross(camera_gaze_norm, camera_right_norm);

        const config = this._config_manager.config;

        const camera_gaze_norm = vec3.create(); // F
        vec3.sub(camera_gaze_norm, config.camera_center, config.camera_eye);
        vec3.normalize(camera_gaze_norm, camera_gaze_norm);

        const camera_right_norm = vec3.create(); // R
        vec3.cross(camera_right_norm, camera_gaze_norm, vec3.fromValues(0.0, 1.0, 0.0));
        vec3.normalize(camera_right_norm, camera_right_norm);

        const camera_down_norm = vec3.create(); // D
        vec3.cross(camera_down_norm, camera_gaze_norm, camera_right_norm);

        const fy = this._canvas_height / (2.0 * Math.tan(config.camera_fov_y / 2.0));
        const fx = fy;
        const cx = this._canvas_width / 2.0;
        const cy = this._canvas_height / 2.0;
        const intrinsics = mat4.fromValues(
            fx, 0.0, 0.0, 0.0,
            0.0, fy, 0.0, 0.0,
            cx, cy, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        );
        const inv_intrinsics = mat4.create();
        mat4.invert(inv_intrinsics, intrinsics);

        const c2w = mat4.fromValues(
            camera_right_norm[0], camera_right_norm[1], camera_right_norm[2], 0.0,
            camera_down_norm[0], camera_down_norm[1], camera_down_norm[2], 0.0,
            camera_gaze_norm[0], camera_gaze_norm[1], camera_gaze_norm[2], 0.0,
            config.camera_eye[0], config.camera_eye[1], config.camera_eye[2], 1.0,
        );
        const w2c = mat4.create();
        mat4.invert(w2c, c2w);


        // =================
        //  fill scene info
        // =================
        // see `struct SceneInfo` in `utils.wgsl`

        const scene_info_struct = this._utils_shader_reflector.get_struct("SceneInfo");
        scene_info_struct
            .set_field("intrinsics", intrinsics)
            .set_field("extrinsics", w2c)
            .set_field("inv_intrinsics", inv_intrinsics)
            .set_field("inv_extrinsics", c2w)
            .set_field("width", this._canvas_width)
            .set_field("height", this._canvas_height)
            .set_field("eye", config.camera_eye)
            .set_field("object_count", object_count)
            .set_field("sphere_count", sphere_count)
            .set_field("rect_count", rect_count)
            .set_field("triangle_count", triangle_count);

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
        this._filter_kernel_dispatch_x = Math.ceil(this._pixel_cnt / filter_kernel_workgroup_size[0]);
        this._render_diff = Infinity;
    }

    public init_kernels() {
        const config = this._config_manager.config;
        const shader_utils = get_shader_utils(config);

        // =========
        //  kernels
        // =========
        this._gen_ray_kernel = new KernelBuilder(this._device, "gen ray kernel", shader_utils + get_shader_gen_ray(), "compute")
            .build();

        this._prep_hit_test_kernel = new KernelBuilder(this._device, "prep hit test kernel", shader_utils + get_shader_prep_hit_test(), "compute")
            .build();

        this._hit_test_kernel = new KernelBuilder(this._device, "hit test kernel", shader_utils + get_shader_hit_test(), "compute")
            .build();


        this._filter_kernel = new KernelBuilder(this._device, "filter kernel", shader_utils + get_shader_filter(), "compute")
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
            label: "blit pipeline",
            layout: blit_pipeline_layout,
            vertex: {
                module: this._device.createShaderModule({
                    code: shader_utils + get_shader_blit(),
                }),
                entryPoint: "vertex"
            },
            fragment: {
                module: this._device.createShaderModule({
                    code: shader_utils + get_shader_blit(),
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

        const wireframe_bind_group_layout = this._device.createBindGroupLayout({
            entries: [
                { // var<uniform> in_scene_info: SceneInfo
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                { // var<storage, read> in_sphere_array: array<Sphere>
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                { // var<storage, read> in_rect_array: array<Rect>
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "read-only-storage"
                    }
                },
                { // var<storage, read> in_triangle_array: array<Triangle>
                    binding: 3,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "read-only-storage"
                    }
                }
            ]
        });
        const wireframe_pipeline_layout = this._device.createPipelineLayout({
            bindGroupLayouts: [wireframe_bind_group_layout]
        });
        this._wireframe_rect_pipeline = this._device.createRenderPipeline({
            label: "wireframe rect pipeline",
            layout: wireframe_pipeline_layout,
            vertex: {
                module: this._device.createShaderModule({
                    code: shader_utils + get_shader_wireframe_rect(),
                }),
                entryPoint: "vertex"
            },
            fragment: {
                module: this._device.createShaderModule({
                    code: shader_utils + get_shader_wireframe_rect(),
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
                topology: "line-strip"
            },
        });

    }

    public async init_bind_groups() {
        // ===============
        //  scene buffers
        // ===============

        const {
            object_array_buffer,
            sphere_array_buffer,
            rect_array_buffer,
            triangle_array_buffer,
            material_array_buffer,
            object_count,
            sphere_count,
            rect_count,
            triangle_count,
        } = this._scene_buffers;

        // ============
        //  scene info
        // ============

        const scene_info_data = this.prepare_scene_info_data(
            object_count,
            sphere_count,
            rect_count,
            triangle_count,
        );
        const scene_info_buffer = create_gpu_uniform_buffer(this._device, "scene info", scene_info_data.byteLength);
        this._device.queue.writeBuffer(scene_info_buffer, 0, scene_info_data);

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
            .add_buffer("in_scene_info", 0, scene_info_buffer)
            .add_buffer("in_object_array", 1, object_array_buffer)
            .add_buffer("in_sphere_array", 2, sphere_array_buffer)
            .add_buffer("in_rect_array", 3, rect_array_buffer)
            .add_buffer("in_triangle_array", 4, triangle_array_buffer)
            .add_buffer("in_material_array", 5, material_array_buffer)
            .add_buffer("out_color_buffer", 6, color_buffer)
            .build(this._hit_test_kernel, 1);
        this._hit_test_kernel_bind_group_pingpong = [hit_test_kernel_bind_group_ping, hit_test_kernel_bind_group_pong];

        // TODO
        // add BVH

        this._filter_kernel_bind_group = new BindGroupBuilder(this._device, "filter kernel bind group")
            .add_buffer("in_scene_info", 0, scene_info_buffer)
            .add_buffer("in_frame_index", 1, this._gen_ray_kernel_bind_group.get_buffer("out_frame_index"))
            .add_buffer("in_color_buffer", 2, color_buffer)
            .create_then_add_buffer("out_filtered_color_buffer", 3, GPUBufferUsage.STORAGE, 16 * this._canvas_width * this._canvas_height)
            .create_then_add_buffer("out_render_diff_per_workgroup", 4, GPUBufferUsage.STORAGE, 4 * this._filter_kernel_dispatch_x)
            .build(this._filter_kernel);

        this._blit_bind_group = new BindGroupBuilder(this._device, "blit bind group")
            .add_buffer("in_scene_info", 0, scene_info_buffer)
            .add_buffer("in_filtered_color_buffer", 1, this._filter_kernel_bind_group.get_buffer("out_filtered_color_buffer"))
            .build_raw(this._blit_pipeline);

        this._wireframe_bind_group = new BindGroupBuilder(this._device, "wireframe bind group")
            .add_buffer("in_scene_info", 0, scene_info_buffer)
            .add_buffer("in_sphere_array", 1, sphere_array_buffer)
            .add_buffer("in_rect_array", 2, rect_array_buffer)
            .add_buffer("in_triangle_array", 3, triangle_array_buffer)
            .build_raw(this._wireframe_rect_pipeline);
    }

    public init_callbacks() {
        this._event_bus.listen("canvas-size-changed", () => {
            this._render_diff = Infinity;
            this.init_canvas_size();
            this.init_bind_groups();
        });

        this._event_bus.listen("config-changed", () => {
            this._render_diff = Infinity;
            this.init_kernels();
            this.init_bind_groups();
        });

        let resize_callback: number;
        addEventListener("resize", () => {
            if (resize_callback) {
                clearTimeout(resize_callback);
            }
            resize_callback = setTimeout(() => {
                // Wait for the browser to complete layout updates before reading canvas size
                requestAnimationFrame(() => {
                    this._event_bus.emit("canvas-size-changed");
                });
            }, 100);
        });
    }

    public get_event_bus(): EventBus {
        return this._event_bus;
    }

    public render() {
        let last_timestamp: DOMHighResTimeStamp | null = null;
        let time_acc = 0.0;

        const _render = async (time: DOMHighResTimeStamp) => {
            window.requestAnimationFrame(_render);

            this._event_bus.process();

            if (last_timestamp === null) {
                last_timestamp = time;
            }
            const delta_time = time - last_timestamp;
            last_timestamp = time;

            const { convergence_check, convergence_threshold } = this._config_manager.config;
            if (convergence_check) {
                if (this._render_diff >= convergence_threshold) {
                    time_acc += delta_time;
                    if (time_acc > 1000.0) {
                        time_acc = 0.0;

                        const render_diff_per_workgroup = await read_gpu_buffer_f32(this._device, this._filter_kernel_bind_group.get_buffer("out_render_diff_per_workgroup"), this._filter_kernel_dispatch_x);
                        this._render_diff = render_diff_per_workgroup.reduce((prev, curr) => prev + curr, 0.0);
                    }
                } else {
                    return;
                }
            }

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
                        for (let i = 0; i < this._config_manager.config.max_bounce; i++) {
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
                            this._filter_kernel_dispatch_x,
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
                                    loadOp: "clear",
                                    storeOp: "store",
                                },
                            ],
                        });
                        blit_render_pass.setBindGroup(0, this._blit_bind_group.bind_group_object);
                        blit_render_pass.setPipeline(this._blit_pipeline);
                        blit_render_pass.draw(4, 1);
                        blit_render_pass.end();

                        command_encoder.popDebugGroup();
                    }

                    if (this._config_manager.config.wireframe) {
                        command_encoder.pushDebugGroup("wireframe");
                        {
                            const wireframe_rect_render_pass = command_encoder.beginRenderPass({
                                colorAttachments: [
                                    {
                                        view: this._context.getCurrentTexture().createView(),
                                        loadOp: "load",
                                        storeOp: "store",
                                    },
                                ],
                            });
                            wireframe_rect_render_pass.setBindGroup(0, this._wireframe_bind_group.bind_group_object);
                            wireframe_rect_render_pass.setPipeline(this._wireframe_rect_pipeline);
                            wireframe_rect_render_pass.draw(5, this._scene_buffers.rect_count);
                            wireframe_rect_render_pass.end();

                            command_encoder.popDebugGroup();
                        }
                    }

                    command_encoder.popDebugGroup();
                }

                this._device.queue.submit([command_encoder.finish()]);
            }
        };

        window.requestAnimationFrame(_render);
    }
}
