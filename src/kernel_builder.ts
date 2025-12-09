import { Kernel } from './kernel';
import { ShaderReflector } from './shader_reflector/shader_reflector';

export class KernelBuilder {
    private shader_module: GPUShaderModule | undefined;
    private pipeline_layout: GPUPipelineLayout | undefined;
    private bind_group_layout_list: GPUBindGroupLayout[] = [];
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
    }

    private _init_bind_group_layout(): void {
        const bind_group_index_list: number[] = [];

        const shader_reflector = new ShaderReflector(this.shader_source);
        shader_reflector.map_bind_group_index_to_bind_group_layout_entry_list.forEach((bind_group_layout_entry_list, bind_group_index) => {
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
