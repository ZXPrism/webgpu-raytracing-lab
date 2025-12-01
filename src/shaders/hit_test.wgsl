@group(0) @binding(0) var<storage, read> in_ray_array_length: u32;
@group(0) @binding(1) var<storage, read> in_ray_array: array<Ray>;
@group(0) @binding(2) var<storage, read> in_sphere_array: array<Sphere>;
@group(0) @binding(3) var<storage, read> in_diffuse_material_array: array<DiffuseMaterial>;
@group(0) @binding(4) var<storage, read_write> out_color_buffer: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> out_ray_array_length: atomic<u32>;
@group(0) @binding(6) var<storage, read_write> out_ray_array: array<Ray>;
@group(0) @binding(7) var<storage, read_write> out_indirect_args: IndirectArgs;

const WG_DIM_X = 128u;

@compute
@workgroup_size(WG_DIM_X, 1, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_id) local_id: vec3u
) {
  let id = workgroup_id.x * WG_DIM_X + local_id.x;

  if id < in_ray_array_length {
    let ray = in_ray_array[id];

    var pixel_out = vec3f(143.0, 233.0, 255.0) / 255.0;
    var min_t = 1e10;
    var hit_object_id = -1;

    let sphere_array_length = i32(arrayLength(&in_sphere_array));
    for(var i = 0; i < sphere_array_length; i++) {
      let t = hit_test_sphere(ray, in_sphere_array[i]);
      if t <= 0.0 {
        continue;
      }
      if t < min_t {
        min_t = t;
        hit_object_id = i;
      }
    }

    if hit_object_id >= 0 {
      let material = in_diffuse_material_array[hit_object_id];
      pixel_out = ray.weight * material.albedo;
    }

    out_color_buffer[ray.pixel_offset] += vec4f(pixel_out, 1.0);
  }

  workgroupBarrier();

  if id == 0u {
    out_indirect_args = IndirectArgs(atomicLoad(&out_ray_array_length), 1u, 1u);
  }
}
