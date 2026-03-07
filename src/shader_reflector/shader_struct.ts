import { ShaderDataTypeComponentCount, ShaderDataTypePrimitivity, type ShaderDataType } from "./type";

export class ShaderStructBuilder {
    private shader_struct: ShaderStruct = new ShaderStruct();

    public constructor(struct_name: string) {
        this.shader_struct.name = struct_name;
    }

    public add_field(name: string, type: ShaderDataType, offset: number): ShaderStructBuilder {
        this.shader_struct._map_field_name_to_field_type.set(name, type);
        this.shader_struct._map_field_name_to_field_offset.set(name, offset);
        return this;
    }

    public build(total_size_bytes: number): ShaderStruct {
        // all fields are initialized to zero by default for convenience
        this.shader_struct._data = new ArrayBuffer(total_size_bytes);
        return this.shader_struct;
    }
}

export class ShaderStruct {
    public name!: string;

    public _map_field_name_to_field_type = new Map<string, ShaderDataType>();
    public _map_field_name_to_field_offset = new Map<string, number>();
    public _data!: ArrayBuffer;

    public copy(init_data: boolean = true): ShaderStruct {
        const res = new ShaderStruct();
        res.name = this.name;
        res._map_field_name_to_field_type = new Map<string, ShaderDataType>(this._map_field_name_to_field_type);
        res._map_field_name_to_field_offset = new Map<string, number>(this._map_field_name_to_field_offset);
        if (init_data) {
            res._data = new ArrayBuffer(this.size_bytes);
        }
        return res;
    }

    public set_field(name: string, value: number | ArrayLike<number>, base_offset_bytes: number = 0): ShaderStruct {
        const field_type = this._map_field_name_to_field_type.get(name);
        if (!field_type) {
            console.warn(`ShaderStruct: field "${name}" does not exist in shader struct "${this.name}"`);
            return this;
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
                console.warn(`ShaderStruct: field "${name}" has ${component_count} components, but only "${_value.length}" component is given`);
            } else {
                console.warn(`ShaderStruct: field "${name}" has ${component_count} components, but "${_value.length}" components are given`);
            }
            return this;
        }

        const field_offset_4_bytes = (base_offset_bytes + this._map_field_name_to_field_offset.get(name)!) / 4;

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
        this.shader_struct = shader_struct.copy(false);
        this.shader_struct._data = this._data;
    }

    public set_field(struct_index: number, name: string, value: number | ArrayLike<number>): ShaderStructArray {
        if (struct_index >= this.length) {
            console.warn(`ShaderStructArray: struct_index is out of bounds, given ${struct_index}, max allowed is ${this.length}`);
            return this;
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
