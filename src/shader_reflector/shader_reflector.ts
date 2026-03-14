import { ShaderStructArray, ShaderStructBuilder, type ShaderStruct } from "./shader_struct";
import { MapTypeToShaderDataType } from "./type";

export class ShaderReflector {
    public map_bind_group_index_to_bind_group_layout_entry_list = new Map<number, GPUBindGroupLayoutEntry[]>();
    private map_struct_name_to_shader_struct = new Map<string, ShaderStruct>();

    public constructor(shader_source: string) {
        // ==============================
        //  bind group layout extraction
        // ==============================
        // the reason why I don't use auto deduced layout is..
        // ..if so, we can't share bind groups between pipelines, which is inconvenient
        const bind_group_entry_storage_regexp = /^\s*@group\((\d)\)\s*@binding\((\d+)\)\s*var<([\w,\s]+)>/gm;
        let match: RegExpExecArray | null;
        while ((match = bind_group_entry_storage_regexp.exec(shader_source)) !== null) {
            const bind_group_index = +match[1];
            const binding_point = +match[2];
            const buffer_type_raw = match[3];

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

        // ===================
        //  struct extraction
        // ===================
        // currently can not parse nested structs (e.g. array<struct>, or struct in another struct)
        // for detailed support, please refer to `src\shader_reflector\type.ts`, all types listed there have been supported
        const struct_outline_regexp = /struct\s+(\w+)\s*{([^}]+)}/gm;
        while ((match = struct_outline_regexp.exec(shader_source)) !== null) {
            const struct_name = match[1];
            const struct_content = match[2];

            const shader_struct_builder = new ShaderStructBuilder(struct_name);
            let valid = true;

            const struct_field_regexp = /(\w+)\s*:\s*([\w<>]+)/gm;
            let match_field: RegExpExecArray | null;
            while ((match_field = struct_field_regexp.exec(struct_content)) !== null) {
                const field_name = match_field[1];
                const field_type = MapTypeToShaderDataType.get(match_field[2]);

                if (field_type === undefined) {
                    console.warn(`ShaderReflector: detected unsupported data type "${field_type}" (field: "${field_name}")`);
                    console.warn(`ShaderReflector: struct "${struct_name}" won't be reflected`);
                    valid = false;
                    break;
                }

                if (field_type) {
                    shader_struct_builder.add_field(field_name, field_type);
                } else {
                    throw new Error("You should never see this error..This is just for passing type check. But if you do see this, you are in trouble.");
                }
            }

            if (valid) {
                const shader_struct = shader_struct_builder.build();
                this.map_struct_name_to_shader_struct.set(struct_name, shader_struct);
            }
        }
    }

    public get_struct(struct_name: string): ShaderStruct {
        const shader_struct = this.map_struct_name_to_shader_struct.get(struct_name);
        if (shader_struct === undefined) {
            throw new Error(`ShaderReflector: struct "${struct_name}" not found in shader`);
        }
        return shader_struct.copy();
    }

    public get_struct_array(struct_name: string, array_length: number): ShaderStructArray {
        const shader_struct = this.get_struct(struct_name);
        return new ShaderStructArray(shader_struct, array_length);
    }
}
