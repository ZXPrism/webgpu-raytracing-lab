@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(0) @binding(1) var<storage, read_write> out_ray_array: array<Ray>;
@group(0) @binding(2) var<storage, read_write> out_ray_array_length: u32;

@compute
@workgroup_size(16, 16, 1)
fn compute(
  @builtin(global_invocation_id) global_id : vec3u
) {
  let x = global_id.x;
  let y = global_id.y;

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
  }

  if x < width && y < height {
    let pixel_offset = vec2f(f32(x), f32(y)) + rand_unit_square(f32(ray_array_offset));
    let target_pixel = pixel00 + (viewport_u_base * pixel_offset.x + viewport_v_base * pixel_offset.y);
    let primary_ray = Ray(eye, target_pixel - eye, ray_array_offset);
    out_ray_array[ray_array_offset] = primary_ray;
  }
}
