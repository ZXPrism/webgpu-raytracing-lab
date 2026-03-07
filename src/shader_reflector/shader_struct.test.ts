import { describe, it, expect } from 'vitest';
import { ShaderStructBuilder, ShaderStructArray } from './shader_struct';

describe('ShaderStruct', () => {
    describe('ShaderStructBuilder', () => {
        it('should build a simple struct with primitive types', () => {
            const builder = new ShaderStructBuilder('TestStruct');
            builder.add_field('value', 'u32', 0);
            const struct = builder.build(4);

            expect(struct.name).toBe('TestStruct');
            expect(struct.size_bytes).toBe(4);
            expect(struct._map_field_name_to_field_type.get('value')).toBe('u32');
            expect(struct._map_field_name_to_field_offset.get('value')).toBe(0);
        });

        it('should build a complex struct with multiple fields', () => {
            const builder = new ShaderStructBuilder('ComplexStruct');
            builder.add_field('a', 'u32', 0);
            builder.add_field('b', 'f32', 4);
            builder.add_field('c', 'vec3f', 16);
            const struct = builder.build(32);

            expect(struct.name).toBe('ComplexStruct');
            expect(struct.size_bytes).toBe(32);
            expect(struct._map_field_name_to_field_type.size).toBe(3);
            expect(struct._map_field_name_to_field_offset.size).toBe(3);
        });

        it('should chain method calls', () => {
            const struct = new ShaderStructBuilder('ChainTest')
                .add_field('x', 'f32', 0)
                .add_field('y', 'f32', 4)
                .add_field('z', 'f32', 8)
                .build(12);

            expect(struct.name).toBe('ChainTest');
            expect(struct.size_bytes).toBe(12);
        });
    });

    describe('ShaderStruct copy()', () => {
        it('should copy the struct name', () => {
            const builder = new ShaderStructBuilder('OriginalStruct');
            builder.add_field('value', 'u32', 0);
            const original = builder.build(4);

            const copy = original.copy();

            expect(copy.name).toBe('OriginalStruct');
        });

        it('should copy all field types', () => {
            const builder = new ShaderStructBuilder('FieldTest');
            builder.add_field('a', 'u32', 0);
            builder.add_field('b', 'f32', 4);
            builder.add_field('c', 'vec3f', 16);
            const original = builder.build(32);

            const copy = original.copy();

            expect(copy._map_field_name_to_field_type.get('a')).toBe('u32');
            expect(copy._map_field_name_to_field_type.get('b')).toBe('f32');
            expect(copy._map_field_name_to_field_type.get('c')).toBe('vec3f');
            expect(copy._map_field_name_to_field_type.size).toBe(3);
        });

        it('should copy all field offsets', () => {
            const builder = new ShaderStructBuilder('OffsetTest');
            builder.add_field('x', 'f32', 0);
            builder.add_field('y', 'f32', 4);
            builder.add_field('z', 'f32', 8);
            const original = builder.build(12);

            const copy = original.copy();

            expect(copy._map_field_name_to_field_offset.get('x')).toBe(0);
            expect(copy._map_field_name_to_field_offset.get('y')).toBe(4);
            expect(copy._map_field_name_to_field_offset.get('z')).toBe(8);
            expect(copy._map_field_name_to_field_offset.size).toBe(3);
        });

        it('should create a new data buffer when init_data is true', () => {
            const builder = new ShaderStructBuilder('DataTest');
            builder.add_field('value', 'u32', 0);
            const original = builder.build(4);

            // Set some data in the original
            original.set_field('value', 42);
            const originalDataView = new Uint32Array(original._data);
            expect(originalDataView[0]).toBe(42);

            // Copy with init_data=true should create a new buffer
            const copy = original.copy(true);
            const copyDataView = new Uint32Array(copy._data);

            expect(copy._data).not.toBe(original._data);
            expect(copyDataView[0]).toBe(0); // New buffer, initialized to 0
        });

        it('should not create data buffer when init_data is false', () => {
            const builder = new ShaderStructBuilder('NoDataTest');
            builder.add_field('value', 'u32', 0);
            const original = builder.build(4);

            const copy = original.copy(false);

            // When init_data is false, _data is undefined
            expect(copy._data).toBeUndefined();
        });

        it('should create independent copies', () => {
            const builder = new ShaderStructBuilder('IndependentTest');
            builder.add_field('value', 'u32', 0);
            const original = builder.build(4);

            const copy1 = original.copy();
            const copy2 = original.copy();

            // Modifying copy1 should not affect copy2
            copy1.set_field('value', 100);
            copy2.set_field('value', 200);

            const copy1DataView = new Uint32Array(copy1._data);
            const copy2DataView = new Uint32Array(copy2._data);

            expect(copy1DataView[0]).toBe(100);
            expect(copy2DataView[0]).toBe(200);
        });

        it('should create independent maps', () => {
            const builder = new ShaderStructBuilder('MapTest');
            builder.add_field('value', 'u32', 0);
            const original = builder.build(4);

            const copy = original.copy();

            // Modifying copy's map should not affect original
            copy._map_field_name_to_field_type.set('newField', 'f32');

            expect(original._map_field_name_to_field_type.has('newField')).toBe(false);
            expect(copy._map_field_name_to_field_type.has('newField')).toBe(true);
        });
    });

    describe('ShaderStruct set_field()', () => {
        it('should set single scalar value', () => {
            const builder = new ShaderStructBuilder('ScalarTest');
            builder.add_field('value', 'u32', 0);
            const struct = builder.build(4);

            struct.set_field('value', 42);
            const dataView = new Uint32Array(struct._data);

            expect(dataView[0]).toBe(42);
        });

        it('should set vector values', () => {
            const builder = new ShaderStructBuilder('VectorTest');
            builder.add_field('position', 'vec3f', 0);
            const struct = builder.build(16);

            struct.set_field('position', [1.0, 2.0, 3.0]);
            const dataView = new Float32Array(struct._data);

            expect(dataView[0]).toBe(1.0);
            expect(dataView[1]).toBe(2.0);
            expect(dataView[2]).toBe(3.0);
        });

        it('should set integer vector values', () => {
            const builder = new ShaderStructBuilder('IntVectorTest');
            builder.add_field('coords', 'vec2u', 0);
            const struct = builder.build(8);

            struct.set_field('coords', [10, 20]);
            const dataView = new Uint32Array(struct._data);

            expect(dataView[0]).toBe(10);
            expect(dataView[1]).toBe(20);
        });

        it('should handle base offset parameter', () => {
            const builder = new ShaderStructBuilder('OffsetTest');
            builder.add_field('a', 'u32', 0);
            builder.add_field('b', 'u32', 4);
            const struct = builder.build(8);

            // base_offset is used for array indexing (e.g., in ShaderStructArray)
            // For a single struct, base_offset should be 0
            struct.set_field('a', 100, 0);
            struct.set_field('b', 200, 0);

            const dataView = new Uint32Array(struct._data);
            expect(dataView[0]).toBe(100);
            expect(dataView[1]).toBe(200);
        });

        it('should warn when field does not exist', () => {
            const builder = new ShaderStructBuilder('NonExistentTest');
            builder.add_field('existing', 'u32', 0);
            const struct = builder.build(4);

            // Should not throw, just warn
            expect(() => struct.set_field('nonExistent', 42)).not.toThrow();
        });

        it('should warn when component count mismatches', () => {
            const builder = new ShaderStructBuilder('MismatchTest');
            builder.add_field('vec', 'vec3f', 0);
            const struct = builder.build(16);

            // Should not throw, just warn
            expect(() => struct.set_field('vec', [1.0, 2.0])).not.toThrow();
        });
    });

    describe('ShaderStruct getters', () => {
        it('should return correct size_bytes', () => {
            const builder = new ShaderStructBuilder('SizeTest');
            builder.add_field('a', 'u32', 0);
            builder.add_field('b', 'u32', 4);
            const struct = builder.build(8);

            expect(struct.size_bytes).toBe(8);
        });

        it('should return data buffer', () => {
            const builder = new ShaderStructBuilder('DataGetterTest');
            builder.add_field('value', 'u32', 0);
            const struct = builder.build(4);

            expect(struct.data).toBe(struct._data);
        });
    });

    describe('ShaderStructArray', () => {
        it('should create array of structs', () => {
            const builder = new ShaderStructBuilder('ArrayElement');
            builder.add_field('value', 'u32', 0);
            const template = builder.build(4);

            const array = new ShaderStructArray(template, 10);

            expect(array.length).toBe(10);
            expect(array.data.byteLength).toBe(40);
        });

        it('should set field in specific struct', () => {
            const builder = new ShaderStructBuilder('ArrayElement');
            builder.add_field('value', 'u32', 0);
            const template = builder.build(4);

            const array = new ShaderStructArray(template, 3);
            array.set_field(0, 'value', 100);
            array.set_field(1, 'value', 200);
            array.set_field(2, 'value', 300);

            const dataView = new Uint32Array(array.data);
            expect(dataView[0]).toBe(100);
            expect(dataView[1]).toBe(200);
            expect(dataView[2]).toBe(300);
        });

        it('should warn when index out of bounds', () => {
            const builder = new ShaderStructBuilder('BoundsTest');
            builder.add_field('value', 'u32', 0);
            const template = builder.build(4);

            const array = new ShaderStructArray(template, 5);

            // Should not throw, just warn
            expect(() => array.set_field(10, 'value', 42)).not.toThrow();
        });

        it('should calculate correct stride', () => {
            const builder = new ShaderStructBuilder('StrideTest');
            builder.add_field('a', 'vec3f', 0);
            builder.add_field('b', 'f32', 12);
            const template = builder.build(16);

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
            builder.add_field('value', 'u32', 0);
            const template = builder.build(4);

            const array = new ShaderStructArray(template, 7);

            expect(array.length).toBe(7);
            expect(array.data).toBeInstanceOf(ArrayBuffer);
            expect(array.data.byteLength).toBe(28);
        });
    });
});
