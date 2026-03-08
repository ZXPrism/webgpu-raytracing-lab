import { ShaderDataTypeComponentCount, ShaderDataTypePrimitivity, type ShaderDataType } from "./type";

export interface ShaderStructLayoutEntry {
    type: ShaderDataType,
    offset_bytes: number,
}

export class ShaderStructBuilder {
    private _shader_struct_name: string;
    private _map_field_name_to_layout_entry_index: Map<string, number>;
    private _layout: ShaderStructLayoutEntry[];

    public constructor(shader_struct_name: string) {
        this._shader_struct_name = shader_struct_name;

        this._map_field_name_to_layout_entry_index = new Map<string, number>();
        this._layout = [];
    }

    public add_field(name: string, type: ShaderDataType, offset_bytes: number): ShaderStructBuilder {
        if (this._map_field_name_to_layout_entry_index.has(name)) {
            throw new Error(`ShaderStructBuilder: field ${name} already exists in shader struct ${this._shader_struct_name}!`);
        }

        const field_idx = this._layout.length;
        if (field_idx !== 0) {
            if (offset_bytes <= this._layout[field_idx - 1].offset_bytes) {
                throw new Error(`ShaderStructBuilder: failed to add field ${name} to shader struct ${this._shader_struct_name}: invalid field offset`);
            }
        } else { // first field
            if (offset_bytes !== 0) {
                throw new Error(`ShaderStructBuilder: failed to add field ${name} to shader struct ${this._shader_struct_name}: first field offset nonzero`);
            }
        }

        this._map_field_name_to_layout_entry_index.set(name, field_idx);
        this._layout.push({
            type,
            offset_bytes,
        });

        return this;
    }

    public build(total_size_bytes: number): ShaderStruct {
        // NOTE all fields are initialized to a special value 0x3F
        // NOTE shaders should init data themselves and should not rely on implicit initial values
        const data = new ArrayBuffer(total_size_bytes);
        new Uint8Array(data).fill(0x3F);
        return new ShaderStruct(this._shader_struct_name, data,
            this._map_field_name_to_layout_entry_index, this._layout);
    }
}

export class ShaderStruct {
    private _name: string;
    private _map_field_name_to_layout_entry_index: Map<string, number>;
    private _layout: ShaderStructLayoutEntry[];
    private _data: ArrayBuffer;

    constructor(name: string, data: ArrayBuffer,
        map_field_name_to_layout_entry_index: Map<string, number>,
        layout: ShaderStructLayoutEntry[]) {
        this._name = name;
        this._data = data;
        this._map_field_name_to_layout_entry_index = map_field_name_to_layout_entry_index;
        this._layout = layout;
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
            structuredClone(this._map_field_name_to_layout_entry_index),
            structuredClone(this._layout));
    }

    public set_field(name: string, value: number | ArrayLike<number>, base_offset_bytes: number = 0): ShaderStruct {
        const entry_index = this._map_field_name_to_layout_entry_index.get(name);
        if (entry_index === undefined) {
            throw new Error(`ShaderStruct: field "${name}" does not exist in shader struct "${this.name}"`);
        }
        const entry = this._layout[entry_index];

        const field_type = entry.type;

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

        const field_offset_bytes = entry.offset_bytes;
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

    get name(): string {
        return this._name;
    }

    get size_bytes(): number {
        return this._data.byteLength;
    }

    get data(): ArrayBuffer {
        return this._data;
    }

    get layout(): ReadonlyArray<ShaderStructLayoutEntry> {
        return this._layout;
    }

    get map_field_name_to_layout_entry_index(): ReadonlyMap<string, number> {
        return this._map_field_name_to_layout_entry_index;
    }

    set override_data(new_data: ArrayBuffer) { // should only use this in ShaderStructArray
        this._data = new_data;
    }

    // todo!
    private _is_layout_optimal_impl_brute_force(): boolean {
        return false;
    }

    // todo!
    private _is_layout_optimal_impl_optimized(): boolean {
        return false;
    }

    // todo!
    get is_layout_optimal(): boolean {
        // Find the optimal layout of current struct.
        // Enumerate all permutations should work fine,
        // since normally structs contain <= 5 elements, and 5! = 120
        // Just out of curiosity, let's think about how to solve this for larger Ns?


        return false;
    }
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
        this.shader_struct.override_data = this._data;
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
