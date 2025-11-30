@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(0) @binding(1) var<storage, read_write> out_test_buffer: array<vec4f>;
@group(0) @binding(2) var<storage, read> in_sphere_array: array<Sphere>;

// todo: should set format according to actual presentation format acquired from canvas..
@group(1) @binding(0) var out_framebuffer : texture_storage_2d<bgra8unorm, write>;

@compute
@workgroup_size(16, 16, 1)
fn compute(
  @builtin(global_invocation_id) global_id : vec3u
) {
  let x = global_id.x;
  let y = global_id.y;

  let width = in_scene_info.width;
  let height = in_scene_info.height;
  let pixel00 = in_scene_info.pixel00;
  let viewport_u_base = in_scene_info.viewport_u_base;
  let viewport_v_base = in_scene_info.viewport_v_base;
  let eye = in_scene_info.eye;

  // ================
  //  ray generation
  // ================
  let primary_ray = Ray(eye, pixel00 + (viewport_u_base * f32(x) + viewport_v_base * f32(y)) - eye);

  // ==========
  //  hit test
  // ==========
  var pixel_out = vec3f(143.0, 233.0, 255.0) / 255.0;
  let sphere_array_length = i32(arrayLength(&in_sphere_array));
  for(var i = 0; i < sphere_array_length; i++) {
    let t = hit_test_sphere(primary_ray, in_sphere_array[i]);
    if t <= 0.0 {
      continue;
    }
    pixel_out = vec3f(0.3);
  }

  if x < width && y < height {
    textureStore(out_framebuffer, global_id.xy, vec4f(pixel_out, 1.0));
  }
}
