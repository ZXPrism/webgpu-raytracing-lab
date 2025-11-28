import { Kernel } from './kernel';

export class KernelBuilder {
    private shader_module: GPUShaderModule | undefined;
    private pipeline_layout: GPUPipelineLayout | undefined;
    private bind_group_layout_list: GPUBindGroupLayout[] = [];
    private map_bind_group_index_to_bind_group_layout_entry_list = new Map<number, GPUBindGroupLayoutEntry[]>();
    private map_constant_name_to_value = new Map<string, number>();

    private device: GPUDevice;
    private kernel_name: string;
    private shader_source: string;
    private shader_entry_point: string;

    constructor(device: GPUDevice, kernel_name: string, shader_source: string, shader_entry_point: string) {
        this.device = device;
        this.kernel_name = kernel_name;
        this.shader_source = shader_source;
        this.shader_entry_point = shader_entry_point;
    }

    public add_constant(constant_name: string, constant: number): KernelBuilder {
        this.map_constant_name_to_value.set(constant_name, constant);
        return this;
    }

    public build(): Kernel {
        this._init_shader_module();
        this._init_bind_group_layout();
        this._init_pipeline_layout();

        return new Kernel(this._init_pipeline());
    }

    private _init_shader_module(): void {
        // init shader
        this.shader_module = this.device.createShaderModule({
            label: `${this.kernel_name}ShaderModule`,
            code: this.shader_source,
        });

        // extract bind group layout from shader source
        // the reason why I don't use auto deduced layout is that if so we can't share bind groups between pipelines, which is inconvenient

        // 1. extract storage buffer bindings
        const bind_group_entry_storage_regexp = /^\s*@group\((\d)\)\s*@binding\((\d+)\)\s*var<([\w,\s]+)>/gm;
        let match: RegExpExecArray | null;
        while ((match = bind_group_entry_storage_regexp.exec(this.shader_source)) !== null) {
            const bind_group_index = +match[1];
            const binding_point = +match[2];
            const buffer_type_raw = match[3];

            // determine buffer type
            let buffer_type: GPUBufferBindingType;
            if (buffer_type_raw.includes('uniform')) {
                buffer_type = 'uniform';
            } else if (buffer_type_raw.includes('read_write')) {
                buffer_type = 'storage';
            } else {
                buffer_type = 'read-only-storage';
            }

            const bind_group_layout_entry_list = this.map_bind_group_index_to_bind_group_layout_entry_list.get(bind_group_index) ?? [];
            bind_group_layout_entry_list.push({
                binding: binding_point,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: buffer_type
                }
            });
            this.map_bind_group_index_to_bind_group_layout_entry_list.set(bind_group_index, bind_group_layout_entry_list);
        }

        // 2. extract storage texture bindings
        const bind_group_entry_storage_texture_regexp = /@group\((\d)\)\s*@binding\((\d+)\)\s*var\s+\w+\s*:\s*texture_storage_2d<(\w+)\s*,\s*[\w+]+>/gm;
        while ((match = bind_group_entry_storage_texture_regexp.exec(this.shader_source)) !== null) {
            const bind_group_index = +match[1];
            const binding_point = +match[2];
            const texture_format_raw = match[3];

            // determine buffer type
            let texture_format: GPUTextureFormat;
            if (texture_format_raw.includes('bgra8unorm')) {
                texture_format = 'bgra8unorm';
            } else {
                texture_format = 'rgba8unorm'; // otherwise use rgba8uorm --- just for simplicity, may cause problems..
            }

            const bind_group_layout_entry_list = this.map_bind_group_index_to_bind_group_layout_entry_list.get(bind_group_index) ?? [];
            bind_group_layout_entry_list.push({
                binding: binding_point,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {
                    format: texture_format,
                    access: 'write-only', // for simplicity, force the texture to be write-only
                    viewDimension: '2d'
                }
            });
            this.map_bind_group_index_to_bind_group_layout_entry_list.set(bind_group_index, bind_group_layout_entry_list);
        }
    }

    private _init_bind_group_layout(): void {
        const bind_group_index_list: number[] = [];

        this.map_bind_group_index_to_bind_group_layout_entry_list.forEach((bind_group_layout_entry_list, bind_group_index) => {
            bind_group_index_list.push(bind_group_index);

            this.bind_group_layout_list.push(
                this.device.createBindGroupLayout({
                    label: `${this.kernel_name}_BindGroupLayout_${bind_group_index}`,
                    entries: bind_group_layout_entry_list
                }));
        });

        // reorder `bind_group_layout_list` so that the index is in ascending order
        // just assume we don't use discontinous indexes...
        const indices = Array.from({ length: bind_group_index_list.length }, (_, i) => i);
        indices.sort((lhs, rhs) => {
            return bind_group_index_list[lhs] - bind_group_index_list[rhs];
        });

        const bind_group_layout_list_reordered: GPUBindGroupLayout[] = [];
        indices.forEach((orig_idx, i) => {
            bind_group_layout_list_reordered[i] = this.bind_group_layout_list[orig_idx];
        });

        this.bind_group_layout_list = bind_group_layout_list_reordered;
    }

    private _init_pipeline_layout(): void {
        this.pipeline_layout = this.device.createPipelineLayout({
            label: `${this.kernel_name}_PipelineLayout`,
            bindGroupLayouts: this.bind_group_layout_list
        });
    }

    private _init_pipeline(): GPUComputePipeline {
        return this.device.createComputePipeline({
            label: `${this.kernel_name}_Pipeline`,
            layout: this.pipeline_layout!,
            compute: {
                module: this.shader_module!,
                entryPoint: this.shader_entry_point,
                constants: Object.fromEntries(this.map_constant_name_to_value)
            },
        });
    }
}
