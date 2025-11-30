import "./style.css";

import type { BindGroup } from "./bind_group";
import type { Kernel } from "./kernel";
import { KernelBuilder } from "./kernel_builder";
import { BindGroupBuilder } from "./bind_group_builder";
import { createGPUBuffer } from "./kernel_utils";

import shader_utils from "./shaders/utils.wgsl?raw";
import shader_gen_ray from "./shaders/gen_ray.wgsl?raw";
import shader_hit_test from "./shaders/hit_test.wgsl?raw";
import shader_blit from "./shaders/blit.wgsl?raw";

import { vec3 } from "gl-matrix";

let g_device!: GPUDevice;
let g_context!: GPUCanvasContext;
let g_presentation_format!: GPUTextureFormat;
let g_canvas_width!: number;
let g_canvas_height!: number;

let g_gen_ray_kernel!: Kernel;
let g_gen_ray_kernel_bind_group!: BindGroup;
let g_hit_test_kernel!: Kernel;
let g_hit_test_kernel_bind_group!: BindGroup;
let g_blit_pipeline!: GPURenderPipeline;
let g_blit_bind_group!: BindGroup;



async function init_webgpu() {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        console.error("failed to initialize WebGPU!");
        return;
    }

    const has_bgra8unorm_storage = adapter.features.has("bgra8unorm-storage");
    const device = await adapter.requestDevice({
        requiredLimits: {
            maxBufferSize: adapter.limits.maxBufferSize,
            maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
            maxComputeInvocationsPerWorkgroup: adapter.limits.maxComputeInvocationsPerWorkgroup,
            maxComputeWorkgroupSizeX: adapter.limits.maxComputeWorkgroupSizeX,
            maxStorageBuffersPerShaderStage: adapter.limits.maxStorageBuffersPerShaderStage
        },
        requiredFeatures: has_bgra8unorm_storage
            ? ["bgra8unorm-storage", "subgroups"] as const
            : ["subgroups"] as const,
    });
    if (!device) {
        console.error("failed to initialize WebGPU!");
        return;
    }
    g_device = device;

    const presentation_format = has_bgra8unorm_storage
        ? navigator.gpu.getPreferredCanvasFormat()
        : "rgba8unorm";
    g_presentation_format = presentation_format;

    const canvas = document.querySelector("canvas")!;
    const context = canvas.getContext("webgpu");
    if (!context) {
        console.error("failed to initialize WebGPU!");
        return;
    }

    context.configure({
        device: g_device,
        format: presentation_format,
        usage: GPUTextureUsage.TEXTURE_BINDING
            | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    g_context = context;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    g_canvas_width = canvas.width;
    g_canvas_height = canvas.height;

    console.info("successfully initialized WebGPU 🎉");
}

function init_kernels() {
    // ========
    //  camera
    // ========
    // let camera_gaze_norm = normalize(camera_info.center - camera_info.eye);
    // let camera_right_norm = normalize(cross(camera_gaze_norm, vec3f(0.0, 1.0, 0.0)));
    // let camera_down_norm = cross(camera_gaze_norm, camera_right_norm);
    const camera_fov_y = 90.0 / 180.0 * Math.PI;
    const camera_focal_length = 1.0;
    const camera_aspect_ratio = g_canvas_width / g_canvas_height;
    const camera_eye = vec3.fromValues(0.0, 0.0, 1.0);
    const camera_center = vec3.fromValues(0.0, 0.0, 0.0);

    const camera_gaze_norm = vec3.create();
    vec3.sub(camera_gaze_norm, camera_center, camera_eye);
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
    const viewport_height = 2.0 * Math.tan(camera_fov_y / 2.0) * camera_focal_length;
    const viewport_width = viewport_height * camera_aspect_ratio;

    const viewport_u = vec3.create();
    vec3.scale(viewport_u, camera_right_norm, viewport_width);

    const viewport_v = vec3.create();
    vec3.scale(viewport_v, camera_down_norm, viewport_height);

    const viewport_u_base = vec3.create();
    vec3.scale(viewport_u_base, viewport_u, 1.0 / g_canvas_width);

    const viewport_v_base = vec3.create();
    vec3.scale(viewport_v_base, viewport_v, 1.0 / g_canvas_height);

    const viewport_top_left = vec3.create();
    const temp = vec3.create();
    vec3.scale(temp, camera_gaze_norm, camera_focal_length);
    vec3.add(viewport_top_left, camera_eye, temp);
    vec3.add(temp, viewport_u, viewport_v);
    vec3.scale(temp, temp, 0.5);
    vec3.sub(viewport_top_left, viewport_top_left, temp);

    const pixel00 = vec3.create();
    vec3.add(temp, viewport_u_base, viewport_v_base);
    vec3.scale(temp, temp, 0.5);
    vec3.add(pixel00, viewport_top_left, temp);


    // ===================
    //  scene info buffer
    // ===================
    // see `struct SceneInfo` in `utils.wgsl`
    const scene_info_data = new ArrayBuffer(64);
    const scene_info_data_f32_view = new Float32Array(scene_info_data);
    const scene_info_data_u32_view = new Uint32Array(scene_info_data);
    scene_info_data_f32_view.set(pixel00, 0);
    scene_info_data_u32_view[3] = g_canvas_width;
    scene_info_data_f32_view.set(viewport_u_base, 4);
    scene_info_data_u32_view[7] = g_canvas_height;
    scene_info_data_f32_view.set(viewport_v_base, 8);
    scene_info_data_f32_view.set(camera_eye, 12);
    const scene_info_buffer = createGPUBuffer(g_device, "scene info", GPUBufferUsage.UNIFORM, 64);
    g_device.queue.writeBuffer(scene_info_buffer, 0, scene_info_data);


    // ===============
    //  object buffer
    // ===============
    const sphere_cnt = 2;
    const sphere_array_data = new Float32Array(sphere_cnt * 4);
    sphere_array_data[0] = 0.0;
    sphere_array_data[1] = 0.0;
    sphere_array_data[2] = -2.0;
    sphere_array_data[3] = 0.5;

    sphere_array_data[4] = 0.0;
    sphere_array_data[5] = -1000.0;
    sphere_array_data[6] = -2.0;
    sphere_array_data[7] = 1000.0;
    const sphere_array_buffer = createGPUBuffer(g_device, "sphere array", GPUBufferUsage.STORAGE, sphere_cnt * 16);
    g_device.queue.writeBuffer(sphere_array_buffer, 0, sphere_array_data);


    // =========
    //  kernels
    // =========
    g_gen_ray_kernel = new KernelBuilder(g_device, "gen ray kernel", shader_utils + shader_gen_ray, "compute")
        .build();
    g_gen_ray_kernel_bind_group = new BindGroupBuilder(g_device, "gen ray kernel bind group")
        .add_buffer("in_scene_info", 0, scene_info_buffer)
        .create_then_add_buffer("out_ray_array", 1, GPUBufferUsage.STORAGE, 32 * g_canvas_width * g_canvas_height)
        .create_then_add_buffer("out_ray_array_length", 2, GPUBufferUsage.STORAGE, 4)
        .build(g_gen_ray_kernel);

    const ray_array = g_gen_ray_kernel_bind_group.get_buffer("out_ray_array");
    const ray_array_length = g_gen_ray_kernel_bind_group.get_buffer("out_ray_array_length");

    g_hit_test_kernel = new KernelBuilder(g_device, "hit test kernel", shader_utils + shader_hit_test, "compute")
        .build();
    g_hit_test_kernel_bind_group = new BindGroupBuilder(g_device, "hit test kernel bind group")
        .add_buffer("in_ray_array_length", 0, ray_array_length)
        .add_buffer("in_ray_array", 1, ray_array)
        .add_buffer("in_sphere_array", 2, sphere_array_buffer)
        .create_then_add_buffer("out_color_buffer", 3, GPUBufferUsage.STORAGE, 16 * g_canvas_width * g_canvas_height)
        .build(g_hit_test_kernel);

    const color_buffer = g_hit_test_kernel_bind_group.get_buffer("out_color_buffer");

    const blit_bind_group_layout = g_device.createBindGroupLayout({
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
    const blit_pipeline_layout = g_device.createPipelineLayout({
        bindGroupLayouts: [blit_bind_group_layout]
    });
    g_blit_pipeline = g_device.createRenderPipeline({
        layout: blit_pipeline_layout,
        vertex: {
            module: g_device.createShaderModule({
                code: shader_utils + shader_blit,
            }),
            entryPoint: "vertex"
        },
        fragment: {
            module: g_device.createShaderModule({
                code: shader_utils + shader_blit,
            }),
            entryPoint: "fragment",
            targets: [
                {
                    format: g_presentation_format,
                    writeMask: GPUColorWrite.ALL
                }
            ]
        },
        primitive: {
            topology: "triangle-strip"
        },
    });
    g_blit_bind_group = new BindGroupBuilder(g_device, "blit bind group")
        .add_buffer("in_scene_info", 0, scene_info_buffer)
        .add_buffer("in_color_buffer", 1, color_buffer)
        .build_raw(g_blit_pipeline);
}

function render() {
    function _render(_time: DOMHighResTimeStamp) {
        const command_encoder = g_device.createCommandEncoder();
        {
            g_gen_ray_kernel.dispatch(command_encoder, g_gen_ray_kernel_bind_group,
                Math.ceil(g_canvas_width / 16),
                Math.ceil(g_canvas_height / 16),
                1);
            g_hit_test_kernel.dispatch(command_encoder, g_hit_test_kernel_bind_group,
                Math.ceil(g_canvas_width * g_canvas_height / 128),
                1,
                1);

            const blit_render_pass = command_encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: g_context.getCurrentTexture().createView(),
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                        loadOp: 'clear' as GPULoadOp,
                        storeOp: 'store' as GPUStoreOp,
                    },
                ],
            });
            blit_render_pass.setBindGroup(0, g_blit_bind_group.bind_group_object);
            blit_render_pass.setPipeline(g_blit_pipeline);
            blit_render_pass.draw(4, 1);
            blit_render_pass.end();

            g_device.queue.submit([command_encoder.finish()]);
        }

        window.requestAnimationFrame(_render);
    }

    window.requestAnimationFrame(_render);
}

async function main() {
    await init_webgpu();
    init_kernels();
    render();
}

main();
