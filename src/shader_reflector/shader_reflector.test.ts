/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from 'vitest';
import { ShaderReflector } from './shader_reflector';
import { ShaderDataTypeSize, ShaderDataTypeAlignment } from './type';

describe('ShaderReflector', () => {
    describe('Bind Group Layout Extraction', () => {
        it('should extract uniform buffer bindings', () => {
            const shader_source = `
                @group(0) @binding(0) var<uniform> my_buffer: MyStruct;
`;

            const reflector = new ShaderReflector(shader_source);
            const layouts = reflector.map_bind_group_index_to_bind_group_layout_entry_list;

            expect(layouts.has(0)).toBe(true);
            const entries = layouts.get(0);
            expect(entries).toBeDefined();
            expect(entries).toHaveLength(1);
            if (entries) {
                expect(entries[0].binding).toBe(0);
                expect(entries[0].visibility).toBe(GPUShaderStage.COMPUTE);
                expect(entries[0].buffer?.type).toBe('uniform');
            }
        });

        it('should extract read-write storage buffer bindings', () => {
            const shader_source = `
                @group(0) @binding(1) var<storage, read_write> my_buffer: MyStruct;
`;

            const reflector = new ShaderReflector(shader_source);
            const layouts = reflector.map_bind_group_index_to_bind_group_layout_entry_list;

            const entries = layouts.get(0);
            expect(entries).toBeDefined();
            if (entries) {
                expect(entries[0].buffer?.type).toBe('storage');
            }
        });

        it('should extract read-only storage buffer bindings', () => {
            const shader_source = `
                @group(0) @binding(2) var<storage, read> my_buffer: MyStruct;
`;

            const reflector = new ShaderReflector(shader_source);
            const layouts = reflector.map_bind_group_index_to_bind_group_layout_entry_list;

            const entries = layouts.get(0);
            expect(entries).toBeDefined();
            if (entries) {
                expect(entries[0].buffer?.type).toBe('read-only-storage');
            }
        });

        it('should extract multiple bindings from the same group', () => {
            const shader_source = `
                @group(0) @binding(0) var<uniform> buffer1: MyStruct;
                @group(0) @binding(1) var<storage, read_write> buffer2: MyStruct;
                @group(0) @binding(2) var<storage, read> buffer3: MyStruct;
`;

            const reflector = new ShaderReflector(shader_source);
            const layouts = reflector.map_bind_group_index_to_bind_group_layout_entry_list;

            const entries = layouts.get(0);
            expect(entries).toBeDefined();
            if (entries) {
                expect(entries).toHaveLength(3);
                expect(entries[0].binding).toBe(0);
                expect(entries[1].binding).toBe(1);
                expect(entries[2].binding).toBe(2);
            }
        });

        it('should extract bindings from different groups', () => {
            const shader_source = `
                @group(0) @binding(0) var<uniform> buffer1: MyStruct;
                @group(1) @binding(0) var<storage, read_write> buffer2: MyStruct;
                @group(2) @binding(0) var<uniform> buffer3: MyStruct;
`;

            const reflector = new ShaderReflector(shader_source);
            const layouts = reflector.map_bind_group_index_to_bind_group_layout_entry_list;

            expect(layouts.has(0)).toBe(true);
            expect(layouts.has(1)).toBe(true);
            expect(layouts.has(2)).toBe(true);
            expect(layouts.get(0)).toHaveLength(1);
            expect(layouts.get(1)).toHaveLength(1);
            expect(layouts.get(2)).toHaveLength(1);
        });

        it('should handle whitespace in binding declarations', () => {
            const shader_source = `
                @group(0) @binding(0) var<uniform> buffer1: MyStruct;
                @group(0)  @binding(1)  var<storage, read_write>  buffer2: MyStruct;
`;

            const reflector = new ShaderReflector(shader_source);
            const layouts = reflector.map_bind_group_index_to_bind_group_layout_entry_list;

            const entries = layouts.get(0);
            expect(entries).toBeDefined();
            if (entries) {
                expect(entries).toHaveLength(2);
            }
        });
    });

    describe('Struct Extraction', () => {
        it('should extract simple struct with primitive types', () => {
            const shader_source = `
                struct MyStruct {
                    value: u32,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');
            expect(struct.name).toBe('MyStruct');
            expect(struct.size_bytes).toBe(4);
        });

        it('should extract struct with multiple fields', () => {
            const shader_source = `
                struct MyStruct {
                    a: u32,
                    b: f32,
                    c: vec2f,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');
            const cIndex = struct.map_field_name_to_layout_entry_index.get('c');

            expect(struct.layout[aIndex!].type).toBe('u32');
            expect(struct.layout[bIndex!].type).toBe('f32');
            expect(struct.layout[cIndex!].type).toBe('vec2f');
        });

        it('should calculate correct field offsets', () => {
            const shader_source = `
                struct MyStruct {
                    a: u32,
                    b: f32,
                    c: vec2f,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');
            const cIndex = struct.map_field_name_to_layout_entry_index.get('c');

            // u32 at offset 0, size 4
            expect(struct.layout[aIndex!].offset_bytes).toBe(0);
            // f32 at offset 4, size 4 (aligned to 4)
            expect(struct.layout[bIndex!].offset_bytes).toBe(4);
            // vec2f at offset 8, size 8 (aligned to 8)
            expect(struct.layout[cIndex!].offset_bytes).toBe(8);
        });

        it('should handle vec3f alignment (16 bytes)', () => {
            const shader_source = `
                struct MyStruct {
                    a: vec3f,
                    b: f32,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');

            // vec3f at offset 0
            expect(struct.layout[aIndex!].offset_bytes).toBe(0);
            // f32 at offset 12 (after vec3f's 12 bytes, but vec3f has 16-byte alignment)
            expect(struct.layout[bIndex!].offset_bytes).toBe(12);
            // Total size: 16 (vec3f is 16-byte aligned)
            expect(struct.size_bytes).toBe(16);
        });

        it('should handle mixed types with proper alignment', () => {
            const shader_source = `
                struct MyStruct {
                    a: u32,
                    b: vec3f,
                    c: f32,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');
            const cIndex = struct.map_field_name_to_layout_entry_index.get('c');

            // u32 at offset 0, size 4
            expect(struct.layout[aIndex!].offset_bytes).toBe(0);
            // vec3f at offset 16 (aligned to 16, after u32)
            expect(struct.layout[bIndex!].offset_bytes).toBe(16);
            // f32 at offset 28 (after vec3f's 12 bytes)
            expect(struct.layout[cIndex!].offset_bytes).toBe(28);
            // Total size: 32 (rounded up to max alignment of 16)
            expect(struct.size_bytes).toBe(32);
        });

        it('should handle vec2f alignment (8 bytes)', () => {
            const shader_source = `
                struct MyStruct {
                    a: u32,
                    b: vec2f,
                    c: f32,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');
            const cIndex = struct.map_field_name_to_layout_entry_index.get('c');

            // u32 at offset 0, size 4
            expect(struct.layout[aIndex!].offset_bytes).toBe(0);
            // vec2f at offset 8 (aligned to 8)
            expect(struct.layout[bIndex!].offset_bytes).toBe(8);
            // f32 at offset 16 (after vec2f)
            expect(struct.layout[cIndex!].offset_bytes).toBe(16);
            // Total size: 20 (rounded up to alignment 8 = 24, then max alignment 8 = 24)
            expect(struct.size_bytes).toBe(24);
        });

        it('should parse both vec2f and vec2<f32> syntax', () => {
            const shader_source = `
                struct MyStruct {
                    a: vec2f,
                    b: vec2<f32>,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');

            expect(struct.layout[aIndex!].type).toBe('vec2f');
            expect(struct.layout[bIndex!].type).toBe('vec2f');
        });

        it('should parse both vec3f and vec3<f32> syntax', () => {
            const shader_source = `
                struct MyStruct {
                    a: vec3f,
                    b: vec3<f32>,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');

            expect(struct.layout[aIndex!].type).toBe('vec3f');
            expect(struct.layout[bIndex!].type).toBe('vec3f');
        });

        it('should parse both vec4f and vec4<f32> syntax', () => {
            const shader_source = `
                struct MyStruct {
                    a: vec4f,
                    b: vec4<f32>,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');

            expect(struct.layout[aIndex!].type).toBe('vec4f');
            expect(struct.layout[bIndex!].type).toBe('vec4f');
        });

        it('should parse vec2u and vec2<u32> syntax', () => {
            const shader_source = `
                struct MyStruct {
                    a: vec2u,
                    b: vec2<u32>,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            const aIndex = struct.map_field_name_to_layout_entry_index.get('a');
            const bIndex = struct.map_field_name_to_layout_entry_index.get('b');

            expect(struct.layout[aIndex!].type).toBe('vec2u');
            expect(struct.layout[bIndex!].type).toBe('vec2u');
        });
    });

    describe('Error Handling', () => {
        it('should not add struct with unsupported type', () => {
            const shader_source = `
                struct MyStruct {
                    a: u32,
                    b: unsupported_type,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            expect(() => reflector.get_struct('MyStruct')).toThrow();
        });

        it('should handle get_struct for non-existent struct', () => {
            const shader_source = `
                struct MyStruct {
                    a: u32,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            expect(() => reflector.get_struct('NonExistentStruct')).toThrow();
        });

        it('should handle struct with no fields', () => {
            const shader_source = `
                struct MyStruct {
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('MyStruct');

            // Empty struct should have 0 size
            expect(struct?.size_bytes).toBe(0);
        });
    });

    describe('Complex Real-World Structs', () => {
        it('should handle SceneInfo-like struct', () => {
            const shader_source = `
                struct SceneInfo {
                    pixel00: vec3f,
                    width: u32,
                    viewport_u_base: vec3f,
                    height: u32,
                    viewport_v_base: vec3f,
                    eye: vec3f,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('SceneInfo');

            expect(struct).toBeDefined();
            if (struct) {
                expect(struct.size_bytes).toBe(64);

                // Check field offsets
                const pixel00Index = struct.map_field_name_to_layout_entry_index.get('pixel00');
                const widthIndex = struct.map_field_name_to_layout_entry_index.get('width');
                const viewportUBaseIndex = struct.map_field_name_to_layout_entry_index.get('viewport_u_base');
                const heightIndex = struct.map_field_name_to_layout_entry_index.get('height');
                const viewportVBaseIndex = struct.map_field_name_to_layout_entry_index.get('viewport_v_base');
                const eyeIndex = struct.map_field_name_to_layout_entry_index.get('eye');

                expect(struct.layout[pixel00Index!].offset_bytes).toBe(0);
                expect(struct.layout[widthIndex!].offset_bytes).toBe(12);
                expect(struct.layout[viewportUBaseIndex!].offset_bytes).toBe(16);
                expect(struct.layout[heightIndex!].offset_bytes).toBe(28);
                expect(struct.layout[viewportVBaseIndex!].offset_bytes).toBe(32);
                expect(struct.layout[eyeIndex!].offset_bytes).toBe(48);
            }
        });

        it('should handle Ray-like struct', () => {
            const shader_source = `
                struct Ray {
                    origin: vec3f,
                    direction_norm: vec3f,
                    pixel_offset: u32,
                    weight: vec3f,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('Ray');

            expect(struct).toBeDefined();
            if (struct) {
                expect(struct.size_bytes).toBe(48);

                // Check field offsets
                const originIndex = struct.map_field_name_to_layout_entry_index.get('origin');
                const directionNormIndex = struct.map_field_name_to_layout_entry_index.get('direction_norm');
                const pixelOffsetIndex = struct.map_field_name_to_layout_entry_index.get('pixel_offset');
                const weightIndex = struct.map_field_name_to_layout_entry_index.get('weight');

                expect(struct.layout[originIndex!].offset_bytes).toBe(0);
                expect(struct.layout[directionNormIndex!].offset_bytes).toBe(16);
                expect(struct.layout[pixelOffsetIndex!].offset_bytes).toBe(28);
                expect(struct.layout[weightIndex!].offset_bytes).toBe(32);
            }
        });

        it('should handle Sphere-like struct', () => {
            const shader_source = `
                struct Sphere {
                    center: vec3f,
                    radius: f32,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('Sphere');

            expect(struct).toBeDefined();
            if (struct) {
                expect(struct.size_bytes).toBe(16);
                const centerIndex = struct.map_field_name_to_layout_entry_index.get('center');
                const radiusIndex = struct.map_field_name_to_layout_entry_index.get('radius');
                expect(struct.layout[centerIndex!].offset_bytes).toBe(0);
                expect(struct.layout[radiusIndex!].offset_bytes).toBe(12);
            }
        });

        it('should handle IndirectArgs-like struct', () => {
            const shader_source = `
                struct IndirectArgs {
                    dispatch_x: u32,
                    dispatch_y: u32,
                    dispatch_z: u32,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct = reflector.get_struct('IndirectArgs');

            expect(struct).toBeDefined();
            if (struct) {
                expect(struct.size_bytes).toBe(12);
                const dispatchXIndex = struct.map_field_name_to_layout_entry_index.get('dispatch_x');
                const dispatchYIndex = struct.map_field_name_to_layout_entry_index.get('dispatch_y');
                const dispatchZIndex = struct.map_field_name_to_layout_entry_index.get('dispatch_z');
                expect(struct.layout[dispatchXIndex!].offset_bytes).toBe(0);
                expect(struct.layout[dispatchYIndex!].offset_bytes).toBe(4);
                expect(struct.layout[dispatchZIndex!].offset_bytes).toBe(8);
            }
        });
    });

    describe('Struct Array Operations', () => {
        it('should create struct array', () => {
            const shader_source = `
                struct MyStruct {
                    value: u32,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct_array = reflector.get_struct_array('MyStruct', 10);

            expect(struct_array.length).toBe(10);
            expect(struct_array.data.byteLength).toBe(10 * 4); // 10 structs * 4 bytes each
        });

        it('should create struct array for complex struct', () => {
            const shader_source = `
                struct Ray {
                    origin: vec3f,
                    direction_norm: vec3f,
                    pixel_offset: u32,
                    weight: vec3f,
                }
`;

            const reflector = new ShaderReflector(shader_source);
            const struct_array = reflector.get_struct_array('Ray', 100);

            expect(struct_array.length).toBe(100);
            expect(struct_array.data.byteLength).toBe(100 * 48); // 100 * 48 bytes
        });
    });

    describe('Integration Tests', () => {
        it('should extract both bindings and structs from shader', () => {
            const shader_source = `
                @group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
                @group(0) @binding(1) var<storage, read_write> out_ray_array_length: u32;
                @group(0) @binding(2) var<storage, read_write> out_ray_array: array<Ray>;

                struct SceneInfo {
                    pixel00: vec3f,
                    width: u32,
                    viewport_u_base: vec3f,
                    height: u32,
                    viewport_v_base: vec3f,
                    eye: vec3f,
                }

                struct Ray {
                    origin: vec3f,
                    direction_norm: vec3f,
                    pixel_offset: u32,
                    weight: vec3f,
                }

                @compute
                @workgroup_size(16, 16, 1)
                fn compute(@builtin(workgroup_id) workgroup_id : vec3u) {
                }
`;

            const reflector = new ShaderReflector(shader_source);

            // Check bindings
            const layouts = reflector.map_bind_group_index_to_bind_group_layout_entry_list;
            expect(layouts.has(0)).toBe(true);
            const entries = layouts.get(0);
            expect(entries).toBeDefined();
            if (entries) {
                expect(entries).toHaveLength(3);
                expect(entries[0].buffer?.type).toBe('uniform');
                expect(entries[1].buffer?.type).toBe('storage');
                expect(entries[2].buffer?.type).toBe('storage');
            }

            // Check structs
            const scene_info = reflector.get_struct('SceneInfo');
            expect(scene_info).toBeDefined();
            if (scene_info) {
                expect(scene_info.size_bytes).toBe(64);
            }

            const ray = reflector.get_struct('Ray');
            expect(ray).toBeDefined();
            if (ray) {
                expect(ray.size_bytes).toBe(48);
            }
        });
    });

    describe('Field Size and Alignment Constants', () => {
        it('should have correct sizes for all types', () => {
            expect(ShaderDataTypeSize.u32).toBe(4);
            expect(ShaderDataTypeSize.f32).toBe(4);
            expect(ShaderDataTypeSize.vec2u).toBe(8);
            expect(ShaderDataTypeSize.vec2f).toBe(8);
            expect(ShaderDataTypeSize.vec3f).toBe(12);
            expect(ShaderDataTypeSize.vec4f).toBe(16);
        });

        it('should have correct alignments for all types', () => {
            expect(ShaderDataTypeAlignment.u32).toBe(4);
            expect(ShaderDataTypeAlignment.f32).toBe(4);
            expect(ShaderDataTypeAlignment.vec2u).toBe(8);
            expect(ShaderDataTypeAlignment.vec2f).toBe(8);
            expect(ShaderDataTypeAlignment.vec3f).toBe(16);
            expect(ShaderDataTypeAlignment.vec4f).toBe(16);
        });
    });
});
