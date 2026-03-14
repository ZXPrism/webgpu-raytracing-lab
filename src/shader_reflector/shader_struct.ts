import { ShaderDataTypeAlignment, ShaderDataTypeComponentCount, ShaderDataTypePrimitivity, ShaderDataTypeSize, type ShaderDataType } from "./type";

export interface ShaderStructLayoutEntry {
    type: ShaderDataType,
    offset_bytes: number,
}

export class ShaderStructBuilder {
    private _shader_struct_name: string;
    private _field_name_list: string[];
    private _field_type_list: ShaderDataType[];

    public constructor(shader_struct_name: string) {
        this._shader_struct_name = shader_struct_name;

        this._field_name_list = [];
        this._field_type_list = [];
    }

    public add_field(name: string, type: ShaderDataType): ShaderStructBuilder {
        this._field_name_list.push(name);
        this._field_type_list.push(type);

        return this;
    }

    public build(is_dummy: boolean = false): ShaderStruct {
        // compute layout
        const layout: ShaderStructLayoutEntry[] = [];
        const map_field_name_to_layout_entry_index = new Map<string, number>();

        let current_offset_bytes = 0;
        let max_alignment = 0;
        this._field_name_list.forEach((name, index) => {
            const type = this._field_type_list[index];
            const size = ShaderDataTypeSize[type];

            const alignment = ShaderDataTypeAlignment[type];
            if (alignment > max_alignment) {
                max_alignment = alignment;
            }

            current_offset_bytes = Math.ceil(current_offset_bytes / alignment) * alignment;

            map_field_name_to_layout_entry_index.set(name, index);
            layout.push({
                type: type,
                offset_bytes: current_offset_bytes,
            });

            current_offset_bytes += size;
        });

        const total_size_bytes = Math.ceil(current_offset_bytes / max_alignment) * max_alignment;

        // NOTE all fields are initialized to a special value 0x3F
        // NOTE shaders should init data themselves and should not rely on implicit initial values
        const data = new ArrayBuffer(total_size_bytes);
        new Uint8Array(data).fill(0x3F);

        const shader_struct = new ShaderStruct(this._shader_struct_name, data,
            map_field_name_to_layout_entry_index, layout, is_dummy);
        return shader_struct;
    }
}

export class ShaderStruct {
    private _name: string;
    private _map_field_name_to_layout_entry_index: Map<string, number>;
    private _layout: ShaderStructLayoutEntry[];
    private _data: ArrayBuffer;

    constructor(name: string, data: ArrayBuffer,
        map_field_name_to_layout_entry_index: Map<string, number>,
        layout: ShaderStructLayoutEntry[],
        is_dummy: boolean = false) {
        this._name = name;
        this._data = data;
        this._map_field_name_to_layout_entry_index = map_field_name_to_layout_entry_index;
        this._layout = layout;

        if (is_dummy === false) {
            this.check_optimal_layout();
        }
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

    private _get_optimal_layout_impl_brute_force(): [ShaderStructLayoutEntry[], number] {
        // Enumerate all permutations of current layout array
        const entry_cnt = this._layout.length;

        const used = Array.from({ length: entry_cnt }, () => false);
        const entry_index_perm = Array.from({ length: entry_cnt }, () => -1);

        let optimal_entry_index_perm = Array.from({ length: entry_cnt }, () => -1);
        let optimal_size_bytes = 0x3f3f3f3f;

        const dfs = (kth: number) => {
            if (kth === entry_cnt) {
                const shader_struct_builder = new ShaderStructBuilder("(I am a dummy used in the optimal layout algo >_<)");
                for (let i = 0; i < entry_cnt; i++) {
                    shader_struct_builder.add_field(`dummy field #{i}`, this.layout[entry_index_perm[i]].type);
                }

                const current_size_bytes = shader_struct_builder.build(true).size_bytes;
                if (current_size_bytes < optimal_size_bytes) {
                    optimal_size_bytes = current_size_bytes;
                    optimal_entry_index_perm = structuredClone(entry_index_perm);
                }
                return;
            }
            for (let i = 0; i < entry_cnt; i++) {
                if (used[i] === false) {
                    used[i] = true;
                    entry_index_perm[kth] = i;
                    dfs(kth + 1);
                    used[i] = false;
                }
            }
        };
        dfs(0);

        return [
            Array.from({ length: entry_cnt }, (_, index) => {
                return {
                    type: this._layout[optimal_entry_index_perm[index]].type,
                    offset_bytes: - 1
                };
            }),
            optimal_size_bytes
        ];
    }

    // todo!
    // private _get_optimal_layout_impl_dp(): ShaderStructLayoutEntry[] {
    // }

    public check_optimal_layout() {
        // Find the optimal layout of current struct.

        // Enumerate all permutations should work fine,
        // since normally structs contain <= 5 elements, and 5! = 120
        // Just out of curiosity, let's think about how to solve this for larger Ns?
        // Brute force approach: _get_optimal_layout_impl_brute_force()
        // State compression DP approach: _get_optimal_layout_impl_dp()

        // Empty layout is always optimal
        if (this._layout.length === 0) {
            return;
        }

        function validate_layout(ref_layout: ReadonlyArray<ShaderStructLayoutEntry>, layout: ReadonlyArray<ShaderStructLayoutEntry>): boolean {
            if (layout.length !== ref_layout.length) {
                return false;
            }

            const ref_type_cnt = new Map<ShaderDataType, number>();
            ref_layout.forEach((value) => {
                const type = value.type;
                const cnt = ref_type_cnt.get(type) ?? 0;
                ref_type_cnt.set(type, cnt + 1);
            });

            const type_cnt = new Map<ShaderDataType, number>();
            layout.forEach((value) => {
                const type = value.type;
                const cnt = type_cnt.get(type) ?? 0;
                type_cnt.set(type, cnt + 1);
            });

            let is_valid = true;
            ref_type_cnt.forEach((value, key) => {
                const cnt = type_cnt.get(key);
                if (cnt === undefined || cnt !== value) {
                    is_valid = false;
                }
            });

            return is_valid;
        }

        const [optimal_layout, optimal_size_bytes] = this._get_optimal_layout_impl_brute_force();

        if (validate_layout(this._layout, optimal_layout) === false) {
            throw new Error(`ShaderStruct (${this._name}): Bad impl of optimal layout algorithm: layout entry counts mismatch`);
        }

        if (optimal_size_bytes > this.size_bytes) {
            throw new Error(`ShaderStruct (${this._name}): bad impl of optimal layout algorithm: the "optimal" layout is suboptimal`);
        } else if (optimal_size_bytes < this.size_bytes) {
            console.warn(`ShaderStruct (${this._name}): current layout is suboptimal, the suggested layout is:`);
            console.warn(optimal_layout);
            console.warn(`which can save ${this.size_bytes} - ${optimal_size_bytes} = ${this.size_bytes - optimal_size_bytes} bytes`);
        }
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
