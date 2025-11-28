import "./style.css";
import type { BindGroup } from "./bind_group";
import type { Kernel } from "./kernel";
import { KernelBuilder } from "./kernel_builder";
import { BindGroupBuilder } from "./bind_group_builder";

import shader_render from './shaders/render.wgsl?raw';
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

    const has_bgra8unorm_storage = adapter.features.has('bgra8unorm-storage');
    const device = await adapter.requestDevice({
        requiredLimits: {
            maxBufferSize: adapter.limits.maxBufferSize,
            maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
            maxComputeInvocationsPerWorkgroup: adapter.limits.maxComputeInvocationsPerWorkgroup,
            maxComputeWorkgroupSizeX: adapter.limits.maxComputeWorkgroupSizeX,
            maxStorageBuffersPerShaderStage: adapter.limits.maxStorageBuffersPerShaderStage
        },
        requiredFeatures: has_bgra8unorm_storage
            ? ['bgra8unorm-storage', 'subgroups'] as const
            : ['subgroups'] as const,
    });
    if (!device) {
        console.error("failed to initialize WebGPU!");
        return;
    }
    g_device = device;

    const presentation_format = has_bgra8unorm_storage
        ? navigator.gpu.getPreferredCanvasFormat()
        : 'rgba8unorm';

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
    const screen_info_buffer = createGPUBuffer(g_device, 'screen info', GPUBufferUsage.UNIFORM, 8);
    const screen_info_data = new Uint32Array(2);
    screen_info_data[0] = g_canvas_width;
    screen_info_data[1] = g_canvas_height;
    g_device.queue.writeBuffer(screen_info_buffer, 0, screen_info_data);

    g_render_kernel = new KernelBuilder(g_device, 'render_kernel', shader_render, 'compute')
        .build();
    g_render_kernel_bind_group = new BindGroupBuilder(g_device, 'render bind group')
        .add_buffer('in_screen_info', 0, screen_info_buffer)
        .build(g_render_kernel);
}

function render() {
    function _render(_time: DOMHighResTimeStamp) {
        const framebuffer_bind_group = new BindGroupBuilder(g_device, 'framebuffer bind group')
            .add_buffer('out_framebuffer', 0, g_context.getCurrentTexture().createView())
            .build(g_render_kernel, 1);

        const command_encoder = g_device.createCommandEncoder();
        {
            g_render_kernel.dispatch_multiple_bind_group(command_encoder, [g_render_kernel_bind_group, framebuffer_bind_group],
                Math.ceil(g_canvas_width / 32),
                Math.ceil(g_canvas_height / 32),
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
