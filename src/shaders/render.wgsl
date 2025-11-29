struct ScreenInfo { // 8
  width: u32, // 0 -> 4
  height: u32 // 4 -> 4
}

struct CameraInfo { // 40
  eye: vec3f, // 0 -> 16 (12 + 4)
  center: vec3f, // 16 -> 12
  focal_length: f32, // 28 -> 4
  fov_y: f32, // 32 -> 4
  aspect_ratio: f32 // 36 -> 4
}

struct Ray { // 28
  source: vec3f, // 0 -> 16
  direction: vec3f, // 16 -> 12; not necessarily normalized
}

@group(0) @binding(0) var<uniform> in_screen_info: ScreenInfo;
@group(0) @binding(1) var<uniform> in_camera_info: CameraInfo;
@group(0) @binding(2) var<storage, read_write> out_test_buffer: array<vec4f>;

// todo: should set format according to actual presentation format acquired from canvas..
@group(1) @binding(0) var out_framebuffer : texture_storage_2d<bgra8unorm, write>;

@compute
@workgroup_size(16, 16, 1)
fn compute(
  @builtin(global_invocation_id) global_id : vec3u
) {
  let x = global_id.x;
  let y = global_id.y;

  let width = in_screen_info.width;
  let height = in_screen_info.height;
  let offset = y * width + x;

  // ========
  //  camera
  // ========
  let camera_info = in_camera_info;
  let camera_gaze_norm = normalize(camera_info.center - camera_info.eye);
  let camera_right_norm = normalize(cross(camera_gaze_norm, vec3f(0.0, 1.0, 0.0)));
  let camera_down_norm = cross(camera_gaze_norm, camera_right_norm);

  // =============================
  //  viewport (origin: top left)
  // =============================
  let viewport_height = 2 * tan(camera_info.fov_y / 2.0) * camera_info.focal_length;
  let viewport_width = viewport_height * camera_info.aspect_ratio;
  let viewport_u = camera_right_norm * viewport_width;
  let viewport_v = camera_down_norm * viewport_height;
  let viewport_u_base = viewport_u / f32(width);
  let viewport_v_base = viewport_v / f32(height);
  let viewport_upper_left = camera_info.eye + camera_gaze_norm * camera_info.focal_length - (viewport_u + viewport_v) / 2.0;
  let pixel00 = viewport_upper_left + 0.5 * (viewport_u_base + viewport_v_base); // default sample point is the center of each pixel

  // ================
  //  ray generation
  // ================
  let ray = Ray(camera_info.eye, pixel00 + viewport_u_base * f32(x) + viewport_v_base * f32(y) - camera_info.eye);
  let ray_direction_norm = normalize(ray.direction);

  let pixel_out = abs(ray_direction_norm);
  if x < width && y < height {
    textureStore(out_framebuffer, global_id.xy, vec4f(pixel_out, 1.0));
  }
}
