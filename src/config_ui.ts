import { EventBus } from "./event_bus";
import { ConfigManager } from "./config";
import { vec3 } from "gl-matrix";
import * as Tweakpane from "tweakpane";

type WidgetType = "slider" | "int-slider" | "toggle" | "position" | "color";

interface FieldDef {
    key: string;
    folder: string;
    label: string;
    widget: WidgetType;
    min?: number;
    max?: number;
    step?: number;
}

/** Shape the params object uses for vec3-as-position bindings. */
type Vec3Params = { x: number; y: number; z: number };
/** Shape the params object uses for color-picker bindings. */
type ColorParams = { r: number; g: number; b: number };
/** All possible value types in the Tweakpane params object. */
type ParamValue = number | boolean | Vec3Params | ColorParams;

const FIELD_DEFS: FieldDef[] = [
    // Camera ────────────────────────────────────────────────────────────────
    { key: "camera_fov_y", folder: "Camera", label: "FOV Y", widget: "slider", min: 0, max: Math.PI },
    { key: "camera_focal_length", folder: "Camera", label: "Focal Length", widget: "slider", min: 0.1, max: 10 },
    { key: "camera_eye", folder: "Camera", label: "Eye Position", widget: "position", min: -10, max: 10 },
    { key: "camera_center", folder: "Camera", label: "Center Position", widget: "position", min: -10, max: 10 },

    // Rendering ─────────────────────────────────────────────────────────────
    { key: "max_bounce", folder: "Rendering", label: "Max Bounce", widget: "int-slider", min: 1, max: 64 },
    { key: "eps", folder: "Rendering", label: "EPS", widget: "slider", min: 0.0001, max: 0.01 },
    { key: "ray_near_threshold", folder: "Rendering", label: "Near Threshold", widget: "slider", min: 0.0001, max: 0.1 },
    { key: "ray_far_threshold", folder: "Rendering", label: "Far Threshold", widget: "slider", min: 10, max: 1000 },
    { key: "convergence_check", folder: "Rendering", label: "Convergence Check", widget: "toggle" },
    { key: "convergence_threshold", folder: "Rendering", label: "Convergence Threshold", widget: "slider", min: 0.0, max: 1000.0 },
    { key: "wireframe", folder: "Rendering", label: "Wireframe", widget: "toggle" },

    // Scene ─────────────────────────────────────────────────────────────────
    { key: "sky_color", folder: "Scene", label: "Sky Color", widget: "color" },
];

// ---------------------------------------------------------------------------
// ConfigUI
// ---------------------------------------------------------------------------

export class ConfigUI {
    private pane: Tweakpane.Pane;
    private event_bus: EventBus;
    private config_manager: ConfigManager;
    private params: Record<string, ParamValue>;

    constructor(config_manager: ConfigManager, event_bus: EventBus) {
        this.config_manager = config_manager;
        this.event_bus = event_bus;
        this.pane = new Tweakpane.Pane({ title: "Config" });
        this.params = this.buildParams();
        this.setupInputs();
        this.setupEventListeners();
    }

    /** Build the params object that Tweakpane binds to, seeded from config. */
    private buildParams(): Record<string, ParamValue> {
        const config = this.config_manager.config as unknown as Record<string, unknown>;
        const p: Record<string, ParamValue> = {};
        for (const def of FIELD_DEFS) {
            switch (def.widget) {
                case "position": {
                    const v = config[def.key] as vec3;
                    p[def.key] = { x: v[0], y: v[1], z: v[2] };
                    break;
                }
                case "color": {
                    const v = config[def.key] as vec3;
                    p[def.key] = { r: v[0], g: v[1], b: v[2] };
                    break;
                }
                default:
                    p[def.key] = config[def.key] as number | boolean;
                    break;
            }
        }
        return p;
    }

    /** Create Tweakpane folders and bindings from the field schema. */
    private setupInputs() {
        try {
            const folderMap = new Map<string, Tweakpane.FolderApi>();
            for (const def of FIELD_DEFS) {
                let folder = folderMap.get(def.folder);
                if (!folder) {
                    folder = this.pane.addFolder({ title: def.folder });
                    folderMap.set(def.folder, folder);
                }
                this.addBinding(folder, def);
            }
        } catch (error) {
            console.error("ConfigUI: Error setting up inputs:", error);
        }
    }

    /** Create a single Tweakpane binding according to the widget type. */
    private addBinding(folder: Tweakpane.FolderApi, def: FieldDef) {
        switch (def.widget) {
            case "slider":
                folder.addBinding(this.params, def.key, {
                    min: def.min,
                    max: def.max,
                    step: def.step,
                    label: def.label,
                });
                break;
            case "int-slider":
                folder.addBinding(this.params, def.key, {
                    min: def.min,
                    max: def.max,
                    step: def.step ?? 1,
                    label: def.label,
                });
                break;
            case "toggle":
                folder.addBinding(this.params, def.key, { label: def.label });
                break;
            case "position":
                folder.addBinding(this.params, def.key, {
                    x: { min: def.min, max: def.max },
                    y: { min: def.min, max: def.max },
                    z: { min: def.min, max: def.max },
                    label: def.label,
                });
                break;
            case "color":
                folder.addBinding(this.params, def.key, {
                    color: { type: "float" },
                    label: def.label,
                });
                break;
        }
    }

    /** Debounced change listener — writes params back to config and emits. */
    private setupEventListeners() {
        let debounceTimer: number | null = null;

        this.pane.on("change", () => {
            this.updateConfigValues();

            if (debounceTimer !== null) {
                clearTimeout(debounceTimer);
            }

            debounceTimer = setTimeout(() => {
                this.event_bus.emit("config-changed");
                debounceTimer = null;
            }, 50);
        });
    }

    /** Copy every field from the Tweakpane params object back to Config. */
    private updateConfigValues() {
        const config = this.config_manager.config as unknown as Record<string, unknown>;
        for (const def of FIELD_DEFS) {
            const val = this.params[def.key] as ParamValue;
            switch (def.widget) {
                case "position": {
                    const v = val as Vec3Params;
                    config[def.key] = vec3.fromValues(v.x, v.y, v.z);
                    break;
                }
                case "color": {
                    const v = val as ColorParams;
                    config[def.key] = vec3.fromValues(v.r, v.g, v.b);
                    break;
                }
                default:
                    config[def.key] = val;
                    break;
            }
        }
    }

    public cleanup() {
        this.pane.dispose();
    }
}
