export function get_shader_hit_test(): string {
  return /* wgsl */`
@group(0) @binding(0) var<storage, read> in_ray_array_length: u32;
@group(0) @binding(1) var<storage, read> in_ray_array: array<Ray>;
@group(0) @binding(2) var<storage, read_write> out_ray_array_length: atomic<u32>;
@group(0) @binding(3) var<storage, read_write> out_ray_array: array<Ray>;

@group(1) @binding(0) var<storage, read> in_object_array: array<Object>;
@group(1) @binding(1) var<storage, read> in_sphere_array: array<Sphere>;
@group(1) @binding(2) var<storage, read> in_diffuse_material_array: array<DiffuseMaterial>;
@group(1) @binding(3) var<storage, read> in_metal_material_array: array<MetalMaterial>;
@group(1) @binding(4) var<storage, read> in_glass_material_array: array<GlassMaterial>;
@group(1) @binding(5) var<storage, read_write> out_color_buffer: array<vec4f>;

const WG_DIM_X = 128u;

@compute
@workgroup_size(WG_DIM_X, 1, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_index) thread_id: u32
) {
  let id = (workgroup_id.x * WG_DIM_X) + thread_id;

  if id < in_ray_array_length {
    let ray = in_ray_array[id];

    var min_t = 1e10;
    var hit_object_id = -1;

    let object_array_length = i32(arrayLength(&in_object_array));

    for (var i = 0; i < object_array_length; i++) {
      let object = in_object_array[i];

      var t = RAY_FAR_THRESHOLD;
      if object.geometry_type == 0u {
        t = hit_test_sphere(ray, in_sphere_array[object.geometry_data_id]);
      }

      if t <= RAY_NEAR_THRESHOLD || t >= RAY_FAR_THRESHOLD {
        continue;
      }

      if t < min_t {
        min_t = t;
        hit_object_id = i;
      }
    }

    if hit_object_id >= 0 {
      let write_idx = atomicAdd(&out_ray_array_length, 1u);
      let hit_point = get_hit_point(ray, min_t);

      let object = in_object_array[hit_object_id];

      let material = in_diffuse_material_array[hit_object_id];

      var normal_norm = vec3f(0.0);
      if object.geometry_type == 0u {
        normal_norm = sphere_get_normal_norm(ray, in_sphere_array[object.geometry_data_id], hit_point);
      }

      var new_ray_direction_norm = vec3f(0.0);
      if object.material_type == 0u {
        let material = in_diffuse_material_array[object.material_data_id];
        new_ray_direction_norm = evaluate_diffuse(normal_norm, f32(write_idx) * min_t);
        out_ray_array[write_idx] = Ray(hit_point + (EPS * normal_norm), new_ray_direction_norm, ray.pixel_offset, ray.weight * material.albedo);
      } else if object.material_type == 1u{
        let material = in_metal_material_array[object.material_data_id];
        new_ray_direction_norm = evaluate_metal(normal_norm, ray.direction_norm, material.fuzziness, f32(write_idx) * min_t);
        out_ray_array[write_idx] = Ray(hit_point + (EPS * normal_norm), new_ray_direction_norm, ray.pixel_offset, ray.weight * material.albedo);
      } else { // object.material_type == 2u --> glass
        let entering = dot(ray.direction_norm, normal_norm) <= 0.0;
        let offset_dir = select(normal_norm, -normal_norm, entering);
        let material = in_glass_material_array[object.material_data_id];
        new_ray_direction_norm = evaluate_glass(normal_norm, ray.direction_norm, material.refraction_index, f32(write_idx) * min_t);
        out_ray_array[write_idx] = Ray(hit_point + (EPS * offset_dir), new_ray_direction_norm, ray.pixel_offset, ray.weight);
        // LESSON (260314) we need some bias to improve numerical stability..
      }
    } else {
      out_color_buffer[ray.pixel_offset] += vec4f(SKY_COLOR * ray.weight, 1.0);
    }
  }
}
`;
}
