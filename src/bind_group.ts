import { readGPUBuffer } from './kernel_utils';

export class BindGroup {
    public bind_group_object: GPUBindGroup | undefined;
    public map_buffer_name_to_buffer_object: Map<string, GPUBuffer> = new Map<string, GPUBuffer>();
    private device: GPUDevice;

    constructor(device: GPUDevice) {
        this.device = device;
    }

    public get_buffer(name: string): GPUBuffer {
        return this.map_buffer_name_to_buffer_object.get(name)!;
    }

    public async print_buffer_custom(buffer_name: string, callback: (name: string, u8arr: ArrayBufferLike) => void) {
        const buffer = this.map_buffer_name_to_buffer_object.get(buffer_name)!;
        const raw = await readGPUBuffer<Uint8Array>(this.device, buffer, buffer.size, Uint8Array);
        callback(buffer_name, raw.buffer);
    }

    public async print_buffer_uint32(buffer_name: string) {
        const buffer = this.map_buffer_name_to_buffer_object.get(buffer_name)!;
        const raw = await readGPUBuffer<Uint32Array>(this.device, buffer, buffer.size, Uint32Array);

        console.log(`[${buffer_name}]: `, raw);
    }
}
