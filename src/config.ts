import { vec3 } from "gl-matrix";

export const config_max_bounce = 32;

export const config_camera_fov_y = 90.0 / 180.0 * Math.PI;
export const config_camera_focal_length = 1.0;
export const config_camera_eye = vec3.fromValues(0.0, 2.5, 2.0);
export const config_camera_center = vec3.fromValues(0.0, 0.0, 0.0);

export const config_elem_size_struct_ray = 48;
