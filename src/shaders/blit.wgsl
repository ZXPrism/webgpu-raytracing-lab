@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(0) @binding(1) var<storage, read> in_filtered_color_buffer: array<vec4f>;

struct VSOutput {
  @builtin(position) position: vec4f
}

@vertex
fn vertex(@builtin(vertex_index) vertex_index: u32) -> VSOutput {
  var vs_output: VSOutput;

  let pos_x = select(1.0, -1.0, (vertex_index & 1u) == 0u);
  let pos_y = select(1.0, -1.0, ((vertex_index >> 1u) & 1u) == 1u);
  vs_output.position = vec4f(pos_x, pos_y, 0.0, 1.0);

  return vs_output;
}

@fragment
fn fragment(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let width = in_scene_info.width;
  let pixel_offset = u32(position.y) * width + u32(position.x);
  let linear_color = in_filtered_color_buffer[pixel_offset];
  let cutoff = 0.0031308;
  let srgb = select(
    1.055 * pow(linear_color.rgb, vec3<f32>(1.0/2.4)) - 0.055,
    12.92 * linear_color.rgb,
    linear_color.rgb < vec3<f32>(cutoff)
  );

  return vec4<f32>(srgb, linear_color.a);
}
