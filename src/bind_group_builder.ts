import { BindGroup } from './bind_group';
import { Kernel } from './kernel';
import { create_gpu_buffer, create_gpu_buffer_u32 } from './kernel_utils';

interface BufferEntry {
    name: string;
    binding_point: number;
    buffer: GPUBuffer | GPUTextureView;
}

export class BindGroupBuilder {
    private buffer_entries: BufferEntry[] = [];
    private device: GPUDevice;
    private bind_group_name: string;

    constructor(device: GPUDevice, bind_group_name: string) {
        this.device = device;
        this.bind_group_name = bind_group_name;
    }

    public create_then_add_buffer(buffer_name: string, binding_point: number, extra_buffer_usage: GPUFlagsConstant, n_bytes: number): BindGroupBuilder {
        const buffer = create_gpu_buffer(this.device, buffer_name, extra_buffer_usage, n_bytes);

        this.buffer_entries.push({
            name: buffer_name,
            binding_point,
            buffer
        });

        return this;
    }

    public create_then_add_buffer_init_u32(buffer_name: string, binding_point: number, extra_buffer_usage: GPUFlagsConstant, value_u32: number): BindGroupBuilder {
        const buffer = create_gpu_buffer_u32(this.device, buffer_name, extra_buffer_usage, value_u32);

        this.buffer_entries.push({
            name: buffer_name,
            binding_point,
            buffer
        });

        return this;
    }

    public add_buffer(buffer_name: string, binding_point: number, buffer: GPUBuffer | GPUTextureView): BindGroupBuilder {
        this.buffer_entries.push({
            name: buffer_name,
            binding_point,
            buffer
        });

        return this;
    }

    public build_raw(pipeline: GPURenderPipeline | GPUComputePipeline, bind_group_index?: number): BindGroup {
        const bind_group = new BindGroup(this.device);

        if (this.buffer_entries.length === 0) {
            console.warn(`[BindGroupBuilder (${this.bind_group_name})] no buffer added to current bind group!`);
        }

        // check if there are duplicating binding points
        const binding_point_set = new Set<number>();
        for (const buffer_entry of this.buffer_entries) {
            if (binding_point_set.has(buffer_entry.binding_point)) {
                console.error('duplicate binding point detected!');
            }
            binding_point_set.add(buffer_entry.binding_point);

            if (buffer_entry.buffer instanceof GPUBuffer) {
                bind_group.map_buffer_name_to_buffer_object.set(buffer_entry.name, buffer_entry.buffer);
            }
        }

        const bind_group_entry_list: GPUBindGroupEntry[] = [];
        for (const buffer_entry of this.buffer_entries) {
            if (buffer_entry.buffer instanceof GPUBuffer) {
                bind_group_entry_list.push({
                    binding: buffer_entry.binding_point,
                    // NOTE: legacy chrome (ver. < 139?) requires passing a `GPUBufferBinding` to resource field if you intend to pass a `GPUBuffer`
                    // while in newer versions, we can directly write `resource: buffer_entry.buffer` to pass in the `GPUBuffer`
                    // see https://developer.chrome.com/blog/new-in-webgpu-138
                    resource: { buffer: buffer_entry.buffer }
                });
            } else { // texture view
                bind_group_entry_list.push({
                    binding: buffer_entry.binding_point,
                    resource: buffer_entry.buffer
                });
            }
        }

        bind_group.bind_group_object = this.device.createBindGroup({
            label: this.bind_group_name,
            layout: pipeline.getBindGroupLayout(bind_group_index ?? 0),
            entries: bind_group_entry_list,
        });

        return bind_group;
    }

    public build(kernel: Kernel, bind_group_index?: number): BindGroup {
        return this.build_raw(kernel.pipeline!, bind_group_index);
    }
}
