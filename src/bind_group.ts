export class BindGroup {
    public bind_group_object: GPUBindGroup | undefined;
    public map_buffer_name_to_buffer_object: Map<string, GPUBuffer> = new Map<string, GPUBuffer>();
    private device: GPUDevice;

    constructor(device: GPUDevice) {
        this.device = device;
    }

    public get_buffer(name: string): GPUBuffer {
        if (!this.map_buffer_name_to_buffer_object.has(name)) {
            console.error(`buffer :"${name}" does not exist in this bind group!`);
        }
        return this.map_buffer_name_to_buffer_object.get(name)!;
    }
}
