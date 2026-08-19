import type { Config } from "../config";

export function get_shader_blit(config: Config): string {
  return /* wgsl */`
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

fn aces(in_color: vec3f) -> vec3f {
  return clamp((in_color.rgb * (2.51 * in_color.rgb + vec3f(0.03)))
    / (in_color.rgb * (2.43 * in_color.rgb + vec3f(0.59)) + vec3f(0.14)),
    vec3f(0.0), vec3f(1.0));
}

@fragment
fn fragment(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let width = in_scene_info.width;
  let pixel_offset = u32(position.y) * width + u32(position.x);
  let linear_color = in_filtered_color_buffer[pixel_offset].rgb;

  let exposed_color = linear_color * exp2(${config.ev_correction});
  let tone_mapped = aces(exposed_color);

  // 260818: after failed attempts for 3 times, I finally get what is gamma correction!
  // Yay!
  let cutoff = 0.0031308;
  let srgb = select(
    1.055 * pow(tone_mapped, vec3f(1.0/2.4)) - 0.055,
    12.92 * tone_mapped,
    tone_mapped < vec3f(cutoff)
  );

  return vec4f(srgb, 1.0);
}
`;
}
