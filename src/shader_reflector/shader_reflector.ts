import { ShaderStructArray, ShaderStructBuilder, type ShaderStruct } from "./shader_struct";
import { MapTypeToShaderDataType, ShaderDataTypeAlignment, ShaderDataTypeSize } from "./type";

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
            let current_field_offset = 0;
            let size = 0;
            let max_alignment = 0;
            let alignment = 0;

            const struct_field_regexp = /(\w+)\s*:\s*([\w<>]+)/gm;
            let match_field: RegExpExecArray | null;
            while ((match_field = struct_field_regexp.exec(struct_content)) !== null) {
                const field_name = match_field[1];
                const field_type = MapTypeToShaderDataType.get(match_field[2]);

                switch (field_type) {
                    case "u32": {
                        size = ShaderDataTypeSize.u32;
                        alignment = ShaderDataTypeAlignment.u32;
                        break;
                    }
                    case "f32": {
                        size = ShaderDataTypeSize.f32;
                        alignment = ShaderDataTypeAlignment.f32;
                        break;
                    }
                    case "vec2u": {
                        size = ShaderDataTypeSize.vec2u;
                        alignment = ShaderDataTypeAlignment.vec2u;
                        break;
                    }
                    case "vec2f": {
                        size = ShaderDataTypeSize.vec2f;
                        alignment = ShaderDataTypeAlignment.vec2f;
                        break;
                    }
                    case "vec3f": {
                        size = ShaderDataTypeSize.vec3f;
                        alignment = ShaderDataTypeAlignment.vec3f;
                        break;
                    }
                    case "vec4f": {
                        size = ShaderDataTypeSize.vec4f;
                        alignment = ShaderDataTypeAlignment.vec4f;
                        break;
                    }
                    default: {
                        console.warn(`ShaderReflector: detected unsupported data type "${field_type}" (field: "${field_name}")`);
                        console.warn(`ShaderReflector: struct "${struct_name}" won't be reflected`);
                        valid = false;
                        break;
                    }
                }

                if (valid === false) {
                    break;
                }

                if (alignment > max_alignment) {
                    max_alignment = alignment;
                }

                current_field_offset = Math.ceil(current_field_offset / alignment) * alignment;

                if (field_type) {
                    shader_struct_builder.add_field(field_name, field_type, current_field_offset);
                } else {
                    throw new Error("You should never see this error..This is just for passing type check. But if you do see this, you are in trouble.");
                }
                current_field_offset += size;
            }

            if (valid) {
                // the whole object's address should be aligned too!
                current_field_offset = Math.ceil(current_field_offset / max_alignment) * max_alignment;
                const shader_struct = shader_struct_builder.build(current_field_offset);
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
