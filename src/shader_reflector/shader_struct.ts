import { ShaderDataTypeComponentCount, ShaderDataTypePrimitivity, type ShaderDataType } from "./type";

export class ShaderStructBuilder {
    private _shader_struct_name: string;
    private _map_field_name_to_field_type = new Map<string, ShaderDataType>();
    private _map_field_name_to_field_offset = new Map<string, number>();

    public constructor(shader_struct_name: string) {
        this._shader_struct_name = shader_struct_name;
    }

    public add_field(name: string, type: ShaderDataType, offset: number): ShaderStructBuilder {
        this._map_field_name_to_field_type.set(name, type);
        this._map_field_name_to_field_offset.set(name, offset);
        return this;
    }

    public build(total_size_bytes: number): ShaderStruct {
        // NOTE all fields are initialized to a special value 0x3F
        // NOTE shaders should init data themselves and should not rely on implicit initial values
        const data = new ArrayBuffer(total_size_bytes);
        new Uint8Array(data).fill(0x3F);
        return new ShaderStruct(this._shader_struct_name, data,
            this._map_field_name_to_field_type, this._map_field_name_to_field_offset);
    }
}

export class ShaderStruct {
    public name: string;

    public _map_field_name_to_field_type: Map<string, ShaderDataType>;
    public _map_field_name_to_field_offset: Map<string, number>;
    public _data: ArrayBuffer;

    constructor(name: string, data: ArrayBuffer,
        map_field_name_to_field_type: Map<string, ShaderDataType>,
        map_field_name_to_field_offset: Map<string, number>) {
        this.name = name;
        this._data = data;
        this._map_field_name_to_field_type = map_field_name_to_field_type;
        this._map_field_name_to_field_offset = map_field_name_to_field_offset;
    }

    public copy(use_fresh_data: boolean = true): ShaderStruct {
        let data: ArrayBuffer;
        if (use_fresh_data) {
            data = new ArrayBuffer(this.size_bytes);
            new Uint8Array(data).fill(0x3F);
        } else {
            data = this._data.slice(0);
        }
        return new ShaderStruct(this.name, data,
            structuredClone(this._map_field_name_to_field_type),
            structuredClone(this._map_field_name_to_field_offset));
    }

    public set_field(name: string, value: number | ArrayLike<number>, base_offset_bytes: number = 0): ShaderStruct {
        const field_type = this._map_field_name_to_field_type.get(name);
        if (field_type === undefined) {
            throw new Error(`ShaderStruct: field "${name}" does not exist in shader struct "${this.name}"`);
        }

        let _value: ArrayLike<number>;
        if (typeof value === "number") {
            _value = [value];
        } else {
            _value = value;
        }

        const component_count = ShaderDataTypeComponentCount[field_type];
        if (component_count !== _value.length) {
            if (_value.length === 1) {
                throw new Error(`ShaderStruct: field "${name}" has ${component_count} components, but only "${_value.length}" component is given`);
            } else {
                throw new Error(`ShaderStruct: field "${name}" has ${component_count} components, but "${_value.length}" components are given`);
            }
        }

        const field_offset_bytes = this._map_field_name_to_field_offset.get(name);
        if (field_offset_bytes === undefined) {
            throw new Error(`ShaderStruct: could not find field offset for field ${name} of type ${field_type}. possibly the reflector logic is broken.`);
        }
        const field_offset_4_bytes = (base_offset_bytes + field_offset_bytes) / 4;

        const field_primitive_type = ShaderDataTypePrimitivity[field_type];
        if (field_primitive_type === "integer") {
            const data_view = new Uint32Array(this._data);
            data_view.set(_value, field_offset_4_bytes);
        } else { // "float"
            const data_view = new Float32Array(this._data);
            data_view.set(_value, field_offset_4_bytes);
        }

        return this;
    }

    get size_bytes(): number {
        return this._data.byteLength;
    }

    get data(): ArrayBuffer {
        return this._data;
    }

    // todo: auto check if current layout is optimal (has smallest size)
    // get is_optimal(): boolean {
    //     return false;
    // }
}

export class ShaderStructArray {
    private shader_struct: ShaderStruct;
    private _data: ArrayBuffer;
    private _length: number;
    private _stride: number;

    public constructor(shader_struct: ShaderStruct, count: number) {
        this._length = count;
        this._stride = shader_struct.size_bytes;

        this._data = new ArrayBuffer(count * this._stride);
        new Uint8Array(this._data).fill(0x3F);
        this.shader_struct = shader_struct.copy(false);
        this.shader_struct._data = this._data;
    }

    public set_field(struct_index: number, name: string, value: number | ArrayLike<number>): ShaderStructArray {
        if (struct_index >= this.length) {
            throw new Error(`ShaderStructArray: struct_index is out of bounds, given ${struct_index}, max allowed is ${this.length}`);
        }
        this.shader_struct.set_field(name, value, struct_index * this._stride);
        return this;
    }

    get length(): number {
        return this._length;
    }

    get data(): ArrayBuffer {
        return this._data;
    }
}
