export const filter_kernel_workgroup_size = [128, 1, 1];

export function get_shader_filter(): string {
  return /* wgsl */`
@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(0) @binding(1) var<storage, read> in_frame_index: u32;
@group(0) @binding(2) var<storage, read> in_color_buffer: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> out_filtered_color_buffer: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> out_render_diff_per_workgroup: array<f32>;

const WG_DIM_X = ${filter_kernel_workgroup_size[0]}u;

var<workgroup> shared_render_diff: array<f32, WG_DIM_X>;

@compute
@workgroup_size(WG_DIM_X, 1, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_index) thread_id: u32,
  @builtin(subgroup_size) subgroup_size: u32,
  @builtin(subgroup_id) subgroup_id: u32,
) {
  let id = (workgroup_id.x * WG_DIM_X) + thread_id;
  let n = in_scene_info.width * in_scene_info.height;
  if id < n {
    let curr = in_color_buffer[id];
    let prev = out_filtered_color_buffer[id];
    let filtered = mix(prev, curr, 1.0 / f32(in_frame_index));
    let diff = filtered - out_filtered_color_buffer[id];
    shared_render_diff[thread_id] = dot(diff, diff);
    out_filtered_color_buffer[id] = filtered;
  }

  workgroupBarrier();

  let is_first_lane = (thread_id % subgroup_size) == 0u;

  for (var segment_cnt = WG_DIM_X; segment_cnt > 1u; segment_cnt = (segment_cnt + subgroup_size - 1) / subgroup_size) {
    let value = select(0.0, shared_render_diff[thread_id], thread_id < segment_cnt);
    let curr_warp_res = subgroupAdd(value);
    if is_first_lane {
      shared_render_diff[subgroup_id] = curr_warp_res;
    }

    workgroupBarrier();
  }

  out_render_diff_per_workgroup[workgroup_id.x] = shared_render_diff[0];
}
`;
}
