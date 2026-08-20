import type { Config } from "../config";

export function get_shader_hit_test(config: Config): string {
  return /* wgsl */`
@group(0) @binding(0) var<storage, read> in_ray_array_length: u32;
@group(0) @binding(1) var<storage, read> in_ray_array: array<Ray>;
@group(0) @binding(2) var<storage, read_write> out_ray_array_length: atomic<u32>;
@group(0) @binding(3) var<storage, read_write> out_ray_array: array<Ray>;

@group(1) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(1) @binding(1) var<storage, read> in_object_array: array<Object>;
@group(1) @binding(2) var<storage, read> in_sphere_array: array<Sphere>;
@group(1) @binding(3) var<storage, read> in_rect_array: array<Rect>;
@group(1) @binding(4) var<storage, read> in_triangle_array: array<Triangle>;
@group(1) @binding(5) var<storage, read> in_material_array: array<Material>;
@group(1) @binding(6) var<storage, read_write> out_color_buffer: array<vec4f>;

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

    var rng_state = ray.rng_state;

    var min_t = 1e10;
    var hit_object_id = -1;

    let object_array_length = i32(in_scene_info.object_count);

    for (var i = 0; i < object_array_length; i++) {
      let object = in_object_array[i];

      var t = RAY_FAR_THRESHOLD;
      if object.geometry_type == GEOMETRY_TYPE_SPHERE {
        t = hit_test_sphere(ray, in_sphere_array[object.geometry_data_id]);
      } else if object.geometry_type == GEOMETRY_TYPE_RECT {
        t = hit_test_rect(ray, in_rect_array[object.geometry_data_id]);
      } else { // triangle
        t = hit_test_triangle(ray, in_triangle_array[object.geometry_data_id]);
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
      let hit_point = get_hit_point(ray, min_t);
      let object = in_object_array[hit_object_id];

      // ===== determine normal
      var normal_norm = vec3f(0.0);
      if object.geometry_type == GEOMETRY_TYPE_SPHERE {
        normal_norm = sphere_get_normal_norm(ray, in_sphere_array[object.geometry_data_id], hit_point);
      } else if object.geometry_type == GEOMETRY_TYPE_RECT { // rect
        normal_norm = rect_get_normal_norm(ray, in_rect_array[object.geometry_data_id]);
      } else { // triangle
        normal_norm = triangle_get_normal_norm(ray, in_triangle_array[object.geometry_data_id]);
      }

      let material = in_material_array[object.material_data_id];
      let material_type = material._type;

      // ===== emission
      out_color_buffer[ray.pixel_offset] += vec4f(
        ray.weight * material.emission,
        0.0
      );

      // ===== compute new ray
      var next_origin = hit_point;
      var next_weight = ray.weight;

      var next_direction_norm = vec3f(0.0);
      if material_type == MATERIAL_TYPE_DIFFUSE {
        next_direction_norm = evaluate_diffuse(normal_norm, &rng_state);

        next_origin += EPS * normal_norm;
        next_weight *= material.albedo;

      } else if material_type == MATERIAL_TYPE_METAL {
        next_direction_norm = evaluate_metal(normal_norm, ray.direction_norm, material.fuzziness, &rng_state);

        next_origin += EPS * normal_norm;
        next_weight *= material.albedo;

      } else { // glass
        let entering = dot(ray.direction_norm, normal_norm) <= 0.0;
        let offset_dir = select(normal_norm, -normal_norm, entering);
        next_direction_norm = evaluate_glass(normal_norm, ray.direction_norm, material.refraction_index, &rng_state);

        // LESSON (260314) we almost always need some bias to improve numerical stability..
        next_origin += EPS * offset_dir;
      }

      // Russian Roulette

      var survive = true;

      let next_depth = ray.recursion_depth + 1u;
      let importance = max(
            next_weight.r,
            max(next_weight.g, next_weight.b)
      );

      if importance > EPS {
        if next_depth >= ${config.roulette_start_depth} {
          let survival_prob = clamp(importance, 0.05, 1.0);
          if rng_next_f32(&rng_state) >= survival_prob {
            survive = false;
          } else {
            next_weight /= survival_prob;
          }
        }

        if survive {
          let write_idx = atomicAdd(&out_ray_array_length, 1u);
          out_ray_array[write_idx] = Ray(next_origin, next_depth, next_direction_norm, ray.pixel_offset, next_weight, rng_state);
        }
      }
    } else {
      out_color_buffer[ray.pixel_offset] += vec4f(SKY_COLOR * ray.weight, 1.0);
    }
  }
}
`;
}
