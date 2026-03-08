import { vec3 } from "gl-matrix";

export const config_max_bounce = 32;

export const config_camera_fov_y = 90.0 / 180.0 * Math.PI;
export const config_camera_focal_length = 1.0;
export const config_camera_eye = vec3.fromValues(0.0, 2.0, 3.0);
export const config_camera_center = vec3.fromValues(0.0, 0.0, 0.0);
export const config_eps = 0.001;
export const config_sky_color = vec3.fromValues(0.48, 0.82, 1.0);
export const config_ray_near_threshold = config_eps;
export const config_ray_far_threshold = 100.0;

export const constant_pi = Math.PI;
