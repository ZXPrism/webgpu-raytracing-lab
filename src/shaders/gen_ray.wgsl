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
  let pixel00 = scene_info.pixel00;
  let viewport_u_base = scene_info.viewport_u_base;
  let viewport_v_base = scene_info.viewport_v_base;
  let eye = scene_info.eye;
  let width = scene_info.width;
  let height = scene_info.height;

  let ray_array_offset = y * width + x;
  if ray_array_offset == 0u {
    out_ray_array_length = width * height;
    out_frame_index++;
  }

  if x < width && y < height {
    let pixel_offset = vec2f(f32(x), f32(y)) + rand_unit_square(f32(out_frame_index) * 114514.1919810 + f32(ray_array_offset));
    let target_pixel = pixel00 + (viewport_u_base * pixel_offset.x + viewport_v_base * pixel_offset.y);
    let primary_ray = Ray(eye, target_pixel - eye, ray_array_offset, vec3f(1.0));
    out_ray_array[ray_array_offset] = primary_ray;
  }
}
