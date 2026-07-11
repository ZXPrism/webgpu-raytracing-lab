export function get_shader_gen_ray(): string {
  return /* wgsl */`
@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(0) @binding(1) var<storage, read_write> out_ray_array_length: u32;
@group(0) @binding(2) var<storage, read_write> out_ray_array: array<Ray>;
@group(0) @binding(3) var<storage, read_write> out_frame_index: u32;

const WG_DIM_X = 16u;
const WG_DIM_Y = 16u;

@compute
@workgroup_size(WG_DIM_X, WG_DIM_Y, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_id) local_id: vec3u
) {
  let x = (workgroup_id.x * WG_DIM_X) + local_id.x;
  let y = (workgroup_id.y * WG_DIM_Y) + local_id.y;

  let scene_info = in_scene_info;
  let eye = scene_info.eye;
  let width = scene_info.width;
  let height = scene_info.height;

  let ray_array_offset = (y * width) + x;
  if ray_array_offset == 0u {
    out_ray_array_length = width * height;
    out_frame_index++;
  }

  let pixel_offset = rand_unit_square(f32(out_frame_index) * 114514.1919810 + f32(ray_array_offset));
  let pixel_coord_2d = vec2f(f32(x) + 0.5, f32(y) + 0.5) + pixel_offset;
  let pixel_coord = vec4f(pixel_coord_2d, 1.0, 1.0);
  let view_coord = in_scene_info.inv_intrinsics * pixel_coord;
  let world_coord = in_scene_info.inv_extrinsics * view_coord;

  if x < width && y < height {
    let direction_norm = normalize(world_coord.xyz - eye);
    let primary_ray = Ray(eye, direction_norm, ray_array_offset, vec3f(1.0));
    out_ray_array[ray_array_offset] = primary_ray;
  }
}
`;
}
