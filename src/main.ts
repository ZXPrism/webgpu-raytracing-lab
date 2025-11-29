import "./style.css";
import type { BindGroup } from "./bind_group";
import type { Kernel } from "./kernel";
import { KernelBuilder } from "./kernel_builder";
import { BindGroupBuilder } from "./bind_group_builder";

import shader_utils from "./shaders/utils.wgsl?raw";
import shader_render from "./shaders/render.wgsl?raw";
import { createGPUBuffer } from "./kernel_utils";

let g_device!: GPUDevice;
let g_context!: GPUCanvasContext;
let g_render_kernel!: Kernel;
let g_render_kernel_bind_group!: BindGroup;
let g_canvas_width!: number;
let g_canvas_height!: number;

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
            | GPUTextureUsage.STORAGE_BINDING
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
    const screen_info_data = new Uint32Array(2);
    screen_info_data[0] = g_canvas_width;
    screen_info_data[1] = g_canvas_height;
    const screen_info_buffer = createGPUBuffer(g_device, "screen info", GPUBufferUsage.UNIFORM, 8);
    g_device.queue.writeBuffer(screen_info_buffer, 0, screen_info_data);

    const camera_info_data = new Float32Array(10);
    camera_info_data[0] = 0.0; // eye.x
    camera_info_data[1] = 0.5; // eye.y
    camera_info_data[2] = 1.0; // eye.z
    camera_info_data[3] = 0.0; // (padding)
    camera_info_data[4] = 0.0; // center.x
    camera_info_data[5] = 0.0; // center.y
    camera_info_data[6] = 0.0; // center.z
    camera_info_data[7] = 1.0; // focal_length
    camera_info_data[8] = 90.0 / 180.0 * Math.PI; // fov_y, in radians
    camera_info_data[9] = g_canvas_width / g_canvas_height; // aspect_ratio
    const camera_info_buffer = createGPUBuffer(g_device, "camera info", GPUBufferUsage.UNIFORM, 48);
    g_device.queue.writeBuffer(camera_info_buffer, 0, camera_info_data);

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

    g_render_kernel = new KernelBuilder(g_device, "render_kernel", shader_utils + shader_render, "compute")
        .build();
    g_render_kernel_bind_group = new BindGroupBuilder(g_device, "render bind group")
        .add_buffer("in_screen_info", 0, screen_info_buffer)
        .add_buffer("in_camera", 1, camera_info_buffer)
        .create_then_add_buffer("test_buffer", 2, GPUBufferUsage.STORAGE, g_canvas_width * g_canvas_height * 16)
        .add_buffer("in_sphere_array", 3, sphere_array_buffer)
        .build(g_render_kernel);
}

function render() {
    function _render(_time: DOMHighResTimeStamp) {
        const framebuffer_bind_group = new BindGroupBuilder(g_device, "framebuffer bind group")
            .add_buffer("out_framebuffer", 0, g_context.getCurrentTexture().createView())
            .build(g_render_kernel, 1);

        const command_encoder = g_device.createCommandEncoder();
        {
            g_render_kernel.dispatch_multiple_bind_group(command_encoder, [g_render_kernel_bind_group, framebuffer_bind_group],
                Math.ceil(g_canvas_width / 16),
                Math.ceil(g_canvas_height / 16),
                1);

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
