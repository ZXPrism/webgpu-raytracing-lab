struct ScreenInfo {
  width: u32,
  height: u32
}

@group(0) @binding(0) var<uniform> in_screen_info: ScreenInfo;

// todo: should set format according to actual presentation format acquired from canvas..
@group(1) @binding(0) var out_framebuffer : texture_storage_2d<bgra8unorm, write>;

@compute
@workgroup_size(32, 32, 1)
fn compute(
  @builtin(global_invocation_id) global_id : vec3u
) {
  let x = global_id.x;
  let y = global_id.y;
  let pixel_out = vec3f(0.3);

  if x < in_screen_info.width && y < in_screen_info.height {
    textureStore(out_framebuffer, global_id.xy, vec4f(pixel_out, 1.0));
  }
}
