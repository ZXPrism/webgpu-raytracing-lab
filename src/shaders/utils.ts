import type { Config } from "../config";
import { constant_pi } from "../config";
import { GEOMETRY_TYPE, MATERIAL_TYPE } from "../scene";
import { encoded_to_linear } from "../utils";

export function get_shader_utils(config: Config): string {
  return /* wgsl */`
enable subgroups;

// ===========
//  constants
// ===========

const EPS = ${config.eps};
const PI = ${constant_pi};
// LESSON (260307): always set color in linear space.
// but most tools give us srgb-encoded values.
// so do the conversion first.
// LESSON (260818)
// it's cumbersome to convert manually, let's set a new rule:
// always provide external colors in encoded space
const SKY_COLOR = vec3f(${encoded_to_linear(config.sky_color)});
const RAY_NEAR_THRESHOLD = ${config.ray_near_threshold};
const RAY_FAR_THRESHOLD = ${config.ray_far_threshold};
const GEOMETRY_TYPE_SPHERE = ${GEOMETRY_TYPE.SPHERE}u;
const GEOMETRY_TYPE_TRIANGLE = ${GEOMETRY_TYPE.TRIANGLE}u;
const MATERIAL_TYPE_DIFFUSE = ${MATERIAL_TYPE.DIFFUSE}u;
const MATERIAL_TYPE_METAL = ${MATERIAL_TYPE.METAL}u;
const MATERIAL_TYPE_GLASS = ${MATERIAL_TYPE.GLASS}u;

// =========
//  structs
// =========

// ===== basic

struct SceneInfo {
  intrinsics: mat4x4f,
  extrinsics: mat4x4f,
  inv_intrinsics: mat4x4f,
  inv_extrinsics: mat4x4f,
  eye: vec3f,
  width: u32,
  height: u32,
  object_count: u32,
  sphere_count: u32,
  triangle_count: u32,
}

struct Ray {
  origin: vec3f,
  recursion_depth: u32,
  direction_norm: vec3f,
  pixel_offset: u32,
  weight: vec3f,
  rng_state: u32,
}

struct IndirectArgs {
  dispatch_x: u32,
  dispatch_y: u32,
  dispatch_z: u32,
}

struct Object {
  geometry_type: u32,
  geometry_data_id: u32,
  material_data_id: u32,
}

// ===== geometry

struct Sphere {
  center: vec3f,
  radius: f32,
}

struct Triangle {
  corner: vec3f,
  u: vec3f,
  v: vec3f,
}

// ===== material

struct Material { // see scene.ts for clearer interface
  albedo: vec3f,
  fuzziness: f32,
  emission: vec3f,
  refraction_index: f32,
  _type: u32, // type is a reserved keyword, so have to use _type
}

// ========
//  random
// ========

// Overhauled on 260818

fn rng_init(pixel_offset: u32, frame_index: u32) -> u32 {
  let frame_hash = pcg_hash(frame_index + 0x9e3779b9u);
  return pcg_hash(pixel_offset ^ frame_hash);
}

fn pcg_hash(input: u32) -> u32 {
  let state = input * 747796405u + 2891336453u;
  let word =
    ((state >> ((state >> 28u) + 4u)) ^ state)
    * 277803737u;

  return (word >> 22u) ^ word;
}

fn rng_next_u32(rng_state: ptr<function, u32>) -> u32 {
  let state = (*rng_state) * 747796405u + 2891336453u;
  *rng_state = state;

  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;

  return (word >> 22u) ^ word;
}

fn rng_next_f32(rng_state: ptr<function, u32>) -> f32 {
  // Keep the upper 24 random bits so conversion is exactly representable
  // and the result remains in [0, 1).
  let value = rng_next_u32(rng_state) >> 8u;
  return f32(value) * (1.0 / 16777216.0);
}

// uniform [-0.5, 0.5]^2
fn rand_unit_square(rng_state: ptr<function, u32>) -> vec2f {
  return vec2f(rng_next_f32(rng_state), rng_next_f32(rng_state)) - 0.5;
}

// NOTE: uniform on the unit sphere's shell (not uniform inside the the unit sphere volume)
// That is, the result is always an unit vector
fn rand_unit_sphere_shell(rng_state: ptr<function, u32>) -> vec3f {
  let y = 2.0 * rng_next_f32(rng_state) - 1.0;
  let phi = 2.0 * PI * rng_next_f32(rng_state);
  let r = sqrt(1.0 - y * y);
  return vec3f(r * cos(phi), y, r * sin(phi));
}

// ==========
//  hit test
// ==========

fn hit_test_sphere(ray: Ray, sphere: Sphere) -> f32 {
  let delta = sphere.center - ray.origin;
  let a = dot(ray.direction_norm, ray.direction_norm);
  let b = -2.0 * dot(ray.direction_norm, delta);
  let c = dot(delta, delta) - (sphere.radius * sphere.radius);

  let det = b * b - 4.0 * a * c;
  if det >= 0.0 {
    let det_sqrt = sqrt(det);
    let t1 = (-b - det_sqrt) / (2.0 * a);
    let t2 = (-b + det_sqrt) / (2.0 * a);

    if t1 >= 0.0 {
      return t1;
    } else if t2 >= 0.0 {
      return t2;
    }
  }

  return -1.0; // if miss, return a negative value
}

fn hit_test_triangle(ray: Ray, triangle: Triangle) -> f32 {
  let normal_norm = triangle_get_normal_norm(ray, triangle);
  let t_denominator = dot(normal_norm, ray.direction_norm);
  if abs(t_denominator) < EPS {
    return -1.0;
  }

  let normal = cross(triangle.u, triangle.v);
  let s = dot(normal, normal);
  let w = normal / s;
  let d = dot(normal_norm, triangle.corner);
  let t_numerator = d - dot(normal_norm, ray.origin);
  let t = t_numerator / t_denominator;
  if t <= 0.0 {
    return -1.0;
  }

  let hit_point = get_hit_point(ray, t);
  let hit_point_rel = hit_point - triangle.corner;

  let alpha = dot(cross(hit_point_rel, triangle.v), w);
  let beta = dot(cross(triangle.u, hit_point_rel), w);
  if alpha >= 0.0 && beta >= 0.0 && alpha + beta <= 1.0 {
    return t;
  }

  return -1.0; // if miss, return a negative value
}

fn get_hit_point(ray: Ray, t: f32) -> vec3f {
  return ray.origin + (ray.direction_norm * t);
}

// ============
//  get normal
// ============
// NOTE: all returned normals should be normalized

fn get_facing_normal_norm(ray: Ray, geometric_normal_norm: vec3f) -> vec3f {
  return select(-geometric_normal_norm, geometric_normal_norm, dot(ray.direction_norm, geometric_normal_norm) <= 0.0);
}

fn sphere_get_normal_norm(ray: Ray, sphere: Sphere, hit_point: vec3f) -> vec3f {
  let delta = hit_point - sphere.center;
  return delta / sphere.radius;
}

fn triangle_get_normal_norm(ray: Ray, triangle: Triangle) -> vec3f {
  return normalize(cross(triangle.u, triangle.v));
}

// ===================
//  evaluate material
// ===================
// NOTE: each function returns new ray's direction, which should be normalized (here)
// callers should always expect to get a noramlized ray direction

fn evaluate_diffuse(normal_norm: vec3f, rng_state: ptr<function, u32>) -> vec3f {
  // TODO: check if this is lambertian, need a proof
  let res_ray_direction = normal_norm + rand_unit_sphere_shell(rng_state);
  return normalize(select(-res_ray_direction, res_ray_direction, dot(res_ray_direction, normal_norm) >= 0.0));
}

fn evaluate_metal(normal_norm: vec3f, in_ray_direction: vec3f, fuzziness: f32, rng_state: ptr<function, u32>) -> vec3f {
  let res_ray_direction = reflect(in_ray_direction, normal_norm);
  return normalize(normalize(res_ray_direction) + (fuzziness * rand_unit_sphere_shell(rng_state)));
}

fn evaluate_glass(normal_norm: vec3f, in_ray_direction_norm: vec3f, refraction_index: f32, rng_state: ptr<function, u32>) -> vec3f {
  let entering = dot(in_ray_direction_norm, normal_norm) <= 0.0;
  let co_norm = select(-normal_norm, normal_norm, entering);
  let eta = select(refraction_index, 1.0 / refraction_index, entering);

  let cos_theta = dot(in_ray_direction_norm, co_norm);
  let r0 = ((1.0 - eta) / (1.0 + eta)) * ((1.0 - eta) / (1.0 + eta));
  let fresnel = r0 + (1.0 - r0) * pow(1.0 - abs(cos_theta), 5.0);

  let refracted = refract(in_ray_direction_norm, co_norm, eta);

  if all(refracted == vec3f(0.0)) || fresnel > rng_next_f32(rng_state) {
    return reflect(in_ray_direction_norm, normal_norm);
  } else {
    return refracted;
  }
}
`;
}
