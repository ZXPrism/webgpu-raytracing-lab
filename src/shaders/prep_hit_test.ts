export function get_shader_prep_hit_test(): string {
  return /* wgsl */`
@group(0) @binding(0) var<storage, read> in_next_ray_array_length: u32;
@group(0) @binding(1) var<storage, read_write> out_prev_ray_array_length: u32;
@group(0) @binding(2) var<storage, read_write> out_indirect_args: IndirectArgs;

@compute
@workgroup_size(1, 1, 1)
fn compute() {
    out_prev_ray_array_length = 0u;
    out_indirect_args = IndirectArgs((in_next_ray_array_length + 127u) / 128u, 1u, 1u);
}
`;
}
