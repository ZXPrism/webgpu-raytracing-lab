@group(0) @binding(0) var<storage, read> in_ray_array_length: u32;
@group(0) @binding(1) var<storage, read> in_ray_array: array<Ray>;
@group(0) @binding(2) var<storage, read> in_sphere_array: array<Sphere>;
@group(0) @binding(3) var<storage, read> in_diffuse_material_array: array<DiffuseMaterial>;
@group(0) @binding(4) var<storage, read_write> out_color_buffer: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> out_ray_array_length: atomic<u32>;
@group(0) @binding(6) var<storage, read_write> out_ray_array: array<Ray>;

const WG_DIM_X = 128u;

@compute
@workgroup_size(WG_DIM_X, 1, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_index) thread_id: u32
) {
  let id = workgroup_id.x * WG_DIM_X + thread_id;

  if id < in_ray_array_length {
    let ray = in_ray_array[id];

    var min_t = 1e10;
    var hit_object_id = -1;

    let sphere_array_length = i32(arrayLength(&in_sphere_array));
    for(var i = 0; i < sphere_array_length; i++) {
      let t = hit_test_sphere(ray, in_sphere_array[i]);
      if t < RAY_NEAR_THRESHOLD || t > RAY_FAR_THRESHOLD {
        continue;
      }
      if t < min_t {
        min_t = t;
        hit_object_id = i;
      }
    }

    if hit_object_id >= 0 {
      let sphere = in_sphere_array[hit_object_id];
      let material = in_diffuse_material_array[hit_object_id];

      let write_idx = atomicAdd(&out_ray_array_length, 1u);
      let hit_point = get_hit_point(ray, min_t);
      let normal_norm = sphere_get_normal_norm(ray, sphere, hit_point);
      let diffuse_ray_direction_norm = evaluate_diffuse(normal_norm, hit_point, f32(write_idx) * min_t);

      out_ray_array[write_idx] = Ray(hit_point + EPS * normal_norm, diffuse_ray_direction_norm, ray.pixel_offset, ray.weight * material.albedo);
    } else {
      out_color_buffer[ray.pixel_offset] += vec4f(SKY_COLOR * ray.weight, 1.0);
    }
  }
}
