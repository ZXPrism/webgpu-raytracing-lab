export function get_shader_wireframe_rect(): string {
  return /* wgsl */`
@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(0) @binding(1) var<storage, read> in_sphere_array: array<Sphere>;
@group(0) @binding(2) var<storage, read> in_rect_array: array<Rect>;
@group(0) @binding(3) var<storage, read> in_triangle_array: array<Triangle>;

struct VSOutput {
  @builtin(position) position: vec4f
}

@vertex
fn vertex(
    @builtin(vertex_index) vertex_index: u32,
    @builtin(instance_index) instance_index: u32) -> VSOutput {
  var vs_output: VSOutput;

  let rect = in_rect_array[instance_index];
  let vp = in_scene_info.intrinsics * in_scene_info.extrinsics;
  let width = in_scene_info.width;
  let height = in_scene_info.height;

  if (vertex_index & 3u) == 0u {
    vs_output.position = vec4f(rect.corner, 1.0);
  } else if vertex_index == 1u {
    vs_output.position = vec4f(rect.corner + rect.u, 1.0);
  } else if vertex_index == 2u {
    vs_output.position = vec4f(rect.corner + rect.u + rect.v, 1.0);
  } else {
    vs_output.position = vec4f(rect.corner + rect.v, 1.0);
  }

  let camera_position = in_scene_info.extrinsics * vs_output.position;
  vs_output.position = vp * vs_output.position;

  let z = vs_output.position.z;
  vs_output.position = vec4f(
    -z + (2.0 * vs_output.position.x / f32(width)),
    z - (2.0 * vs_output.position.y / f32(height)),
    0.0,
    z
  );

  return vs_output;
}

@fragment
fn fragment(@builtin(position) position: vec4f) -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 1.0);
}
`;
}
