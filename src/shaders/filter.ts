export function get_shader_filter(): string {
  return /* wgsl */`
@group(0) @binding(0) var<storage, read> in_frame_index: u32;
@group(0) @binding(1) var<storage, read> in_color_buffer: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> out_filtered_color_buffer: array<vec4f>;

const WG_DIM_X = 128u;

@compute
@workgroup_size(WG_DIM_X, 1, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_index) thread_id: u32
) {
  let id = (workgroup_id.x * WG_DIM_X) + thread_id;
  let n = arrayLength(&in_color_buffer);
  if id < n {
    let curr = in_color_buffer[id];
    let prev = out_filtered_color_buffer[id];
    out_filtered_color_buffer[id] = mix(prev, curr, 1.0 / f32(in_frame_index));
  }
}
`;
}
