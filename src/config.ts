import { vec3 } from "gl-matrix";

export interface Config {
    max_bounce: number;
    camera_fov_y: number;
    camera_focal_length: number;
    camera_eye: vec3;
    camera_center: vec3;
    eps: number;
    sky_color: vec3;
    ray_near_threshold: number;
    ray_far_threshold: number;
    convergence_check: boolean;
    convergence_threshold: number;
    wireframe: boolean;
}

export class ConfigManager {
    public config: Config;

    constructor() {
        this.config = {
            max_bounce: 32,
            camera_fov_y: 0.78540,
            camera_focal_length: 1.0,
            camera_eye: vec3.fromValues(4.97, 4.97, 3.47),
            camera_center: vec3.fromValues(0.0, 0.0, 0.0),
            eps: 0.001,
            sky_color: vec3.fromValues(0.48, 0.82, 1.0),
            ray_near_threshold: 0.001,
            ray_far_threshold: 100.1, // why .1? if it's 100.0, then `${100.0}` will become "100.0", then WGSL will consider it as i32..
            convergence_check: true,
            convergence_threshold: 1.0,
            wireframe: false,
        };
    }
}

export const constant_pi = Math.PI;
