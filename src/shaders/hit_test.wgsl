@group(0) @binding(0) var<storage, read> in_ray_array_length: u32;
@group(0) @binding(1) var<storage, read> in_ray_array: array<Ray>;
@group(0) @binding(2) var<storage, read> in_sphere_array: array<Sphere>;
@group(0) @binding(3) var<storage, read_write> out_color_buffer: array<vec4f>;

@compute
@workgroup_size(128, 1, 1)
fn compute(
  @builtin(global_invocation_id) global_id : vec3u
) {
  if global_id.x >= in_ray_array_length {
    return;
  }

  let ray = in_ray_array[global_id.x];

  var pixel_out = vec3f(143.0, 233.0, 255.0) / 255.0;
  let sphere_array_length = i32(arrayLength(&in_sphere_array));
  for(var i = 0; i < sphere_array_length; i++) {
    let t = hit_test_sphere(ray, in_sphere_array[i]);
    if t <= 0.0 {
      continue;
    }
    pixel_out = vec3f(0.3);
  }

  out_color_buffer[ray.pixel_offset] = vec4f(pixel_out, 1.0);
}
