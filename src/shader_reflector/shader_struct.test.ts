import { describe, it, expect } from 'vitest';
import { ShaderStructBuilder, ShaderStructArray } from './shader_struct';

describe('ShaderStruct', () => {
    describe('ShaderStructBuilder', () => {
        it('should build a simple struct with primitive types', () => {
            const builder = new ShaderStructBuilder('TestStruct');
            builder.add_field('value', 'u32');
            const struct = builder.build();

            expect(struct.name).toBe('TestStruct');
            expect(struct.size_bytes).toBe(4);

            // Access field info through new layout API
            const valueIndex = struct.map_field_name_to_layout_entry_index.get('value');
            expect(valueIndex).toBeDefined();
            if (valueIndex !== undefined) {
                const valueEntry = struct.layout[valueIndex];
                expect(valueEntry.type).toBe('u32');
                expect(valueEntry.offset_bytes).toBe(0);
            }

            // Data is initialized with 0x3F
            const dataView = new Uint8Array(struct.data);
            expect(dataView[0]).toBe(0x3F);
        });

        it('should build a complex struct with multiple fields', () => {
            const builder = new ShaderStructBuilder('ComplexStruct');
            builder.add_field('a', 'u32');
            builder.add_field('b', 'f32');
            builder.add_field('c', 'vec3f');
            const struct = builder.build();

            expect(struct.name).toBe('ComplexStruct');
            expect(struct.size_bytes).toBe(32);
            expect(struct.layout.length).toBe(3);
            expect(struct.map_field_name_to_layout_entry_index.size).toBe(3);
        });

        it('should chain method calls', () => {
            const struct = new ShaderStructBuilder('ChainTest')
                .add_field('x', 'f32')
                .add_field('y', 'f32')
                .add_field('z', 'f32')
                .build();

            expect(struct.name).toBe('ChainTest');
            expect(struct.size_bytes).toBe(12);
        });

        it('should automatically calculate offsets for fields', () => {
            const builder = new ShaderStructBuilder('AutoOffsetTest');

            builder.add_field('a', 'u32');
            builder.add_field('vec', 'vec3f');

            expect(() => builder.build()).not.toThrow();
        });
    });

    describe('ShaderStruct copy()', () => {
        it('should copy the struct name', () => {
            const builder = new ShaderStructBuilder('OriginalStruct');
            builder.add_field('value', 'u32');
            const original = builder.build();

            const copy = original.copy();

            expect(copy.name).toBe('OriginalStruct');
        });

        it('should copy all field types', () => {
            const builder = new ShaderStructBuilder('FieldTest');
            builder.add_field('a', 'u32');
            builder.add_field('b', 'f32');
            builder.add_field('c', 'vec3f');
            const original = builder.build();

            const copy = original.copy();

            const aIndex = copy.map_field_name_to_layout_entry_index.get('a');
            const bIndex = copy.map_field_name_to_layout_entry_index.get('b');
            const cIndex = copy.map_field_name_to_layout_entry_index.get('c');

            expect(aIndex).toBeDefined();
            expect(bIndex).toBeDefined();
            expect(cIndex).toBeDefined();

            if (aIndex !== undefined && bIndex !== undefined && cIndex !== undefined) {
                expect(copy.layout[aIndex].type).toBe('u32');
                expect(copy.layout[bIndex].type).toBe('f32');
                expect(copy.layout[cIndex].type).toBe('vec3f');
            }
            expect(copy.layout.length).toBe(3);
        });

        it('should copy all field offsets', () => {
            const builder = new ShaderStructBuilder('OffsetTest');
            builder.add_field('x', 'f32');
            builder.add_field('y', 'f32');
            builder.add_field('z', 'f32');
            const original = builder.build();

            const copy = original.copy();

            const xIndex = copy.map_field_name_to_layout_entry_index.get('x');
            const yIndex = copy.map_field_name_to_layout_entry_index.get('y');
            const zIndex = copy.map_field_name_to_layout_entry_index.get('z');

            expect(xIndex).toBeDefined();
            expect(yIndex).toBeDefined();
            expect(zIndex).toBeDefined();

            if (xIndex !== undefined && yIndex !== undefined && zIndex !== undefined) {
                expect(copy.layout[xIndex].offset_bytes).toBe(0);
                expect(copy.layout[yIndex].offset_bytes).toBe(4);
                expect(copy.layout[zIndex].offset_bytes).toBe(8);
            }
            expect(copy.layout.length).toBe(3);
        });

        it('should create fresh 0x3F-initialized buffer when use_fresh_data is true', () => {
            const builder = new ShaderStructBuilder('DataTest');
            builder.add_field('value', 'u32');
            const original = builder.build();

            // Set some data in the original (overriding the 0x3F init)
            original.set_field('value', 42);
            const originalDataView = new Uint32Array(original.data);
            expect(originalDataView[0]).toBe(42);

            // Copy with use_fresh_data=true should create a new 0x3F-initialized buffer
            const copy = original.copy(true);
            const copyDataView = new Uint32Array(copy.data);

            expect(copy.data).not.toBe(original.data);
            expect(copyDataView[0]).toBe(0x3F3F3F3F); // New buffer, initialized to 0x3F
        });

        it('should copy original data when use_fresh_data is false', () => {
            const builder = new ShaderStructBuilder('NoDataTest');
            builder.add_field('value', 'u32');
            const original = builder.build();

            // Set some data in the original
            original.set_field('value', 42);

            const copy = original.copy(false);

            // When use_fresh_data is false, data is a copy of original
            expect(copy.data).not.toBe(original.data);
            expect(copy.data.byteLength).toBe(4);

            // Verify the data is actually copied correctly
            const originalView = new Uint8Array(original.data);
            const copyView = new Uint8Array(copy.data);
            expect(copyView).toEqual(originalView);
        });

        it('should preserve 0x3F initialization when copying unmodified struct', () => {
            const builder = new ShaderStructBuilder('InitPreserveTest');
            builder.add_field('value', 'u32');
            const original = builder.build();

            // Don't modify anything - keep the 0x3F initialization
            const copy = original.copy(false);

            // Verify the 0x3F initialization is preserved
            const originalView = new Uint32Array(original.data);
            const copyView = new Uint32Array(copy.data);
            expect(originalView[0]).toBe(0x3F3F3F3F);
            expect(copyView[0]).toBe(0x3F3F3F3F);
        });

        it('should create independent copies', () => {
            const builder = new ShaderStructBuilder('IndependentTest');
            builder.add_field('value', 'u32');
            const original = builder.build();

            const copy1 = original.copy();
            const copy2 = original.copy();

            // Modifying copy1 should not affect copy2
            copy1.set_field('value', 100);
            copy2.set_field('value', 200);

            const copy1DataView = new Uint32Array(copy1.data);
            const copy2DataView = new Uint32Array(copy2.data);

            expect(copy1DataView[0]).toBe(100);
            expect(copy2DataView[0]).toBe(200);
        });

        it('should create independent maps', () => {
            const builder = new ShaderStructBuilder('MapTest');
            builder.add_field('value', 'u32');
            const original = builder.build();

            const copy = original.copy();

            // Check that copies have independent maps (via public API)
            expect(copy.map_field_name_to_layout_entry_index.size).toBe(1);
            expect(original.map_field_name_to_layout_entry_index.size).toBe(1);
            expect(copy.layout.length).toBe(1);
            expect(original.layout.length).toBe(1);

            // Verify they are different objects
            expect(copy.map_field_name_to_layout_entry_index).not.toBe(original.map_field_name_to_layout_entry_index);
            expect(copy.layout).not.toBe(original.layout);
        });
    });

    describe('ShaderStruct set_field()', () => {
        it('should set single scalar value', () => {
            const builder = new ShaderStructBuilder('ScalarTest');
            builder.add_field('value', 'u32');
            const struct = builder.build();

            struct.set_field('value', 42);
            const dataView = new Uint32Array(struct.data);

            expect(dataView[0]).toBe(42);
        });

        it('should set vector values', () => {
            const builder = new ShaderStructBuilder('VectorTest');
            builder.add_field('position', 'vec3f');
            const struct = builder.build();

            struct.set_field('position', [1.0, 2.0, 3.0]);
            const dataView = new Float32Array(struct.data);

            expect(dataView[0]).toBe(1.0);
            expect(dataView[1]).toBe(2.0);
            expect(dataView[2]).toBe(3.0);
        });

        it('should set integer vector values', () => {
            const builder = new ShaderStructBuilder('IntVectorTest');
            builder.add_field('coords', 'vec2u');
            const struct = builder.build();

            struct.set_field('coords', [10, 20]);
            const dataView = new Uint32Array(struct.data);

            expect(dataView[0]).toBe(10);
            expect(dataView[1]).toBe(20);
        });

        it('should handle base offset parameter', () => {
            const builder = new ShaderStructBuilder('OffsetTest');
            builder.add_field('a', 'u32');
            builder.add_field('b', 'u32');
            const struct = builder.build();

            // base_offset is used for array indexing (e.g., in ShaderStructArray)
            // For a single struct, base_offset should be 0
            struct.set_field('a', 100, 0);
            struct.set_field('b', 200, 0);

            const dataView = new Uint32Array(struct.data);
            expect(dataView[0]).toBe(100);
            expect(dataView[1]).toBe(200);
        });

        it('should throw error when field does not exist', () => {
            const builder = new ShaderStructBuilder('NonExistentTest');
            builder.add_field('existing', 'u32');
            const struct = builder.build();

            // Should throw error
            expect(() => struct.set_field('nonExistent', 42)).toThrow();
        });

        it('should throw error when component count mismatches', () => {
            const builder = new ShaderStructBuilder('MismatchTest');
            builder.add_field('vec', 'vec3f');
            const struct = builder.build();

            // Should throw error
            expect(() => struct.set_field('vec', [1.0, 2.0])).toThrow();
        });
    });

    describe('ShaderStruct getters', () => {
        it('should return correct size_bytes', () => {
            const builder = new ShaderStructBuilder('SizeTest');
            builder.add_field('a', 'u32');
            builder.add_field('b', 'u32');
            const struct = builder.build();

            expect(struct.size_bytes).toBe(8);
        });

        it('should return data buffer', () => {
            const builder = new ShaderStructBuilder('DataGetterTest');
            builder.add_field('value', 'u32');
            const struct = builder.build();

            expect(struct.data).toBeInstanceOf(ArrayBuffer);
            expect(struct.data.byteLength).toBe(4);
        });
    });

    describe('ShaderStructArray', () => {
        it('should create array of structs', () => {
            const builder = new ShaderStructBuilder('ArrayElement');
            builder.add_field('value', 'u32');
            const template = builder.build();

            const array = new ShaderStructArray(template, 10);

            expect(array.length).toBe(10);
            expect(array.data.byteLength).toBe(40);
        });

        it('should initialize array data with 0x3F', () => {
            const builder = new ShaderStructBuilder('InitTest');
            builder.add_field('value', 'u32');
            const template = builder.build();

            const array = new ShaderStructArray(template, 5);

            // All elements should be initialized to 0x3F3F3F3F
            const dataView = new Uint32Array(array.data);
            for (let i = 0; i < 5; i++) {
                expect(dataView[i]).toBe(0x3F3F3F3F);
            }
        });

        it('should set field in specific struct', () => {
            const builder = new ShaderStructBuilder('ArrayElement');
            builder.add_field('value', 'u32');
            const template = builder.build();

            const array = new ShaderStructArray(template, 3);
            array.set_field(0, 'value', 100);
            array.set_field(1, 'value', 200);
            array.set_field(2, 'value', 300);

            const dataView = new Uint32Array(array.data);
            expect(dataView[0]).toBe(100);
            expect(dataView[1]).toBe(200);
            expect(dataView[2]).toBe(300);
        });

        it('should throw error when index out of bounds', () => {
            const builder = new ShaderStructBuilder('BoundsTest');
            builder.add_field('value', 'u32');
            const template = builder.build();

            const array = new ShaderStructArray(template, 5);

            // Should throw error
            expect(() => array.set_field(10, 'value', 42)).toThrow();
        });

        it('should calculate correct stride', () => {
            const builder = new ShaderStructBuilder('StrideTest');
            builder.add_field('a', 'vec3f');
            builder.add_field('b', 'f32');
            const template = builder.build();

            const array = new ShaderStructArray(template, 5);

            // Each element should be 16 bytes apart
            array.set_field(0, 'a', [1.0, 2.0, 3.0]);
            array.set_field(1, 'a', [4.0, 5.0, 6.0]);

            const dataView = new Float32Array(array.data);
            expect(dataView[0]).toBe(1.0);
            expect(dataView[1]).toBe(2.0);
            expect(dataView[2]).toBe(3.0);
            expect(dataView[4]).toBe(4.0); // Index 4 is offset by 16 bytes (4 floats)
            expect(dataView[5]).toBe(5.0);
            expect(dataView[6]).toBe(6.0);
        });

        it('should return length and data', () => {
            const builder = new ShaderStructBuilder('GetterTest');
            builder.add_field('value', 'u32');
            const template = builder.build();

            const array = new ShaderStructArray(template, 7);

            expect(array.length).toBe(7);
            expect(array.data).toBeInstanceOf(ArrayBuffer);
            expect(array.data.byteLength).toBe(28);
        });
    });
});
