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
        if (buffer === undefined) {
            throw new Error(`BindGroup: buffer "${name}" does not exist in this bind group!`);
        }
        return buffer;
    }

    // This function requires the buffer to be already in the bind group
    public set_buffer(name: string, new_buffer: GPUBuffer) {
        if (this.map_buffer_name_to_buffer_object.has(name)) {
            this.map_buffer_name_to_buffer_object.set(name, new_buffer);
        } else {
            throw new Error(`BindGroup: unknown buffer name ${name}. It's forbidden to add buffers that do not relate to the bind group!`);
        }
    }

    public set_buffer_size(name: string, new_buffer_size_bytes: number) {
        // if the new size is larger than the current size, expand the buffer to the new size
        // otherwise, do nothing
        // TODO: need a smarter algo to manage buffer sizes..
        const buffer = this.get_buffer(name);
        const curr_buffer_size = buffer.size;
        if (new_buffer_size_bytes > curr_buffer_size) {
            const new_buffer = create_gpu_buffer(this.device, buffer.label, buffer.usage, new_buffer_size_bytes);
            this.set_buffer(name, new_buffer);
            buffer.destroy();
        }
    }
}
