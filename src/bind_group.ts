import { create_gpu_buffer } from "./kernel_utils";

export class BindGroup {
    public bind_group_object: GPUBindGroup | undefined;
    public map_buffer_name_to_buffer_object: Map<string, GPUBuffer> = new Map<string, GPUBuffer>();
    private device: GPUDevice;

    constructor(device: GPUDevice) {
        this.device = device;
    }

    public get_buffer(name: string): GPUBuffer {
        const buffer = this.map_buffer_name_to_buffer_object.get(name);
        if (!buffer) {
            throw new Error(`BindGroup: buffer "${name}" does not exist in this bind group!`);
        }
        return buffer;
    }

    public set_buffer_size(name: string, new_buffer_size_bytes: number) {
        // if the new size is larger than the current size, expand the buffer to the new size
        // otherwise, do nothing
        // TODO: need a smarter algo to manage buffer sizes..
        let buffer = this.get_buffer(name);
        const curr_buffer_size = buffer.size;
        if (new_buffer_size_bytes > curr_buffer_size) {
            const new_buffer = create_gpu_buffer(this.device, buffer.label, buffer.usage, new_buffer_size_bytes);
            buffer.destroy();
            buffer = new_buffer;
        }
    }
}
