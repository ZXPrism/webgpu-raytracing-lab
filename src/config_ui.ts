import { EventBus } from "./event_bus";
import { ConfigManager } from "./config";
import * as Tweakpane from "tweakpane";

export class ConfigUI {
    private pane: any;
    private event_bus: EventBus;
    private config_manager: ConfigManager;

    // Store config values as mutable objects for tweakpane
    private params = {
        max_bounce: 0,
        camera_fov_y: 0,
        camera_focal_length: 0,
        camera_eye: { x: 0, y: 0, z: 0 },
        camera_center: { x: 0, y: 0, z: 0 },
        eps: 0,
        sky_color: { r: 0, g: 0, b: 0 },
        ray_near_threshold: 0,
        ray_far_threshold: 0,
    };

    constructor(config_manager: ConfigManager, event_bus: EventBus) {
        this.config_manager = config_manager;
        this.event_bus = event_bus;
        this.pane = new Tweakpane.Pane({ title: "Config" });

        // Initialize params from config
        this.sync_params_from_config();

        this.setup_inputs();
        this.setup_event_listeners();
    }

    private sync_params_from_config() {
        const config = this.config_manager.config;
        this.params.max_bounce = config.max_bounce;
        this.params.camera_fov_y = config.camera_fov_y;
        this.params.camera_focal_length = config.camera_focal_length;
        this.params.camera_eye = { x: config.camera_eye[0], y: config.camera_eye[1], z: config.camera_eye[2] };
        this.params.camera_center = { x: config.camera_center[0], y: config.camera_center[1], z: config.camera_center[2] };
        this.params.eps = config.eps;
        this.params.sky_color = { r: config.sky_color[0], g: config.sky_color[1], b: config.sky_color[2] };
        this.params.ray_near_threshold = config.ray_near_threshold;
        this.params.ray_far_threshold = config.ray_far_threshold;
    }

    private setup_inputs() {
        try {
            // Camera folder
            const camera_folder = this.pane.addFolder({ title: "Camera" });

            camera_folder.addBinding(this.params, "camera_fov_y", {
                min: 0,
                max: Math.PI,
                label: "FOV Y"
            });
            camera_folder.addBinding(this.params, "camera_focal_length", {
                min: 0.1,
                max: 10,
                label: "Focal Length"
            });

            // Use Point3d for camera position (combined XYZ control)
            camera_folder.addBinding(this.params, "camera_eye", {
                x: { min: -10, max: 10 },
                y: { min: -10, max: 10 },
                z: { min: -10, max: 10 },
                label: "Eye Position"
            });

            camera_folder.addBinding(this.params, "camera_center", {
                x: { min: -10, max: 10 },
                y: { min: -10, max: 10 },
                z: { min: -10, max: 10 },
                label: "Center Position"
            });

            // Rendering folder
            const rendering_folder = this.pane.addFolder({ title: "Rendering" });

            rendering_folder.addBinding(this.params, "max_bounce", {
                min: 1,
                max: 64,
                step: 1,
                label: "Max Bounce"
            });
            rendering_folder.addBinding(this.params, "eps", {
                min: 0.0001,
                max: 0.01,
                label: "EPS"
            });
            rendering_folder.addBinding(this.params, "ray_near_threshold", {
                min: 0.0001,
                max: 0.1,
                label: "Near Threshold"
            });
            rendering_folder.addBinding(this.params, "ray_far_threshold", {
                min: 10,
                max: 1000,
                label: "Far Threshold"
            });

            // Scene folder
            const scene_folder = this.pane.addFolder({ title: "Scene" });

            // Use color picker for sky color
            scene_folder.addBinding(this.params, "sky_color", {
                color: { type: 'float' }, // Use float RGB (0-1 range)
                label: "Sky Color"
            });
        } catch (error) {
            console.error("ConfigUI: Error setting up inputs:", error);
        }
    }

    private setup_event_listeners() {
        let debounce_timer: number | null = null;

        this.pane.on("change", () => {
            this.update_config_values();

            if (debounce_timer !== null) {
                clearTimeout(debounce_timer);
            }

            debounce_timer = setTimeout(() => {
                this.event_bus.emit("config-changed");
                debounce_timer = null;
            }, 50);
        });
    }

    private update_config_values() {
        const config = this.config_manager.config;

        // Update scalar values
        config.max_bounce = this.params.max_bounce;
        config.camera_fov_y = this.params.camera_fov_y;
        config.camera_focal_length = this.params.camera_focal_length;
        config.eps = this.params.eps;
        config.ray_near_threshold = this.params.ray_near_threshold;
        config.ray_far_threshold = this.params.ray_far_threshold;

        // Update vec3 values from Point3d/Color controllers
        config.camera_eye[0] = this.params.camera_eye.x;
        config.camera_eye[1] = this.params.camera_eye.y;
        config.camera_eye[2] = this.params.camera_eye.z;
        config.camera_center[0] = this.params.camera_center.x;
        config.camera_center[1] = this.params.camera_center.y;
        config.camera_center[2] = this.params.camera_center.z;
        config.sky_color[0] = this.params.sky_color.r;
        config.sky_color[1] = this.params.sky_color.g;
        config.sky_color[2] = this.params.sky_color.b;
    }

    public cleanup() {
        this.pane.dispose();
    }
}
