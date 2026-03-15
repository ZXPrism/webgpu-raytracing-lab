import { config_eps, config_ray_far_threshold, config_ray_near_threshold, config_sky_color, constant_pi } from "../config";

export function get_shader_utils(): string {
  return /* wgsl */`
// ===========
//  constants
// ===========

const EPS = ${config_eps};
const PI = ${constant_pi};
// LESSON (260307): always set color in linear space.
// but most tools give us srgb-encoded values.
// so do the conversion first.
const SKY_COLOR = vec3f(${config_sky_color});
const RAY_NEAR_THRESHOLD = ${config_ray_near_threshold};
const RAY_FAR_THRESHOLD = ${config_ray_far_threshold};

// =========
//  structs
// =========

// ===== basic

struct SceneInfo {
  pixel00: vec3f,
  width: u32,
  viewport_u_base: vec3f,
  height: u32,
  viewport_v_base: vec3f,
  eye: vec3f,
}

struct Ray {
  origin: vec3f,
  direction_norm: vec3f,
  pixel_offset: u32,
  weight: vec3f,
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

struct Sphere { // type = 0
  center: vec3f,
  radius: f32,
}

// both faces should have normal point outwards
struct Rect { // type = 1
  corner: vec3f,
  u: vec3f,
  v: vec3f,
}

struct Parallelepiped { // type = 2
  corner: vec3f,
  u: vec3f,
  v: vec3f,
  w: vec3f,
}

struct Triangle { // type = 3
  corner: vec3f,
  u: vec3f,
  v: vec3f,
}

// ===== material

struct Material {
  albedo: vec3f, // for diffuse & metal material (type = 0 & 1)
  fuzziness: f32, // for metal material (type = 1)
  refraction_index: f32, // for glass material (type = 2)
  _type: u32, // type is a reserved keyword, so have to use _type
}

// ========
//  random
// ========

var<private> seed_bias = 0.0;

// from: https://marktension.nl/blog/my_favorite_wgsl_random_func_so_far/
fn rand(seed: f32) -> f32 {
  var x = bitcast<u32>(seed_bias * 233.33 + seed);

  // A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm for u32.
  x += (x << 10u);
  x ^= (x >> 6u);
  x += (x << 3u);
  x ^= (x >> 11u);
  x += (x << 15u);

  // Construct a float with half-open range [0:1] using low 23 bits.
  let ieee_mantissa = 0x007FFFFFu;   // binary32 mantissa bitmask
  let ieee_one = 0x3F800000u;        // 1.0 in IEEE binary32
  x &= ieee_mantissa;                // Keep only mantissa bits (fractional part)
  x |= ieee_one;                     // Add fractional part to 1.0

  let res = bitcast<f32>(x);         // Range [1:2]
  seed_bias = res - 1.0;             // Range [0:1]
  return seed_bias;
}

// uniform [-0.5, 0.5]^2
fn rand_unit_square(seed: f32) -> vec2f {
  let x = rand(seed);
  return vec2f(x, rand(x)) - 0.5;
}

// NOTE: uniform on the unit sphere's shell (not uniform inside the the unit sphere volume)
// That is, the result is always an unit vector
fn rand_unit_sphere_shell(seed: f32) -> vec3f {
  let y = 2.0 * rand(seed) - 1.0;
  let phi = 2.0 * PI * rand(seed + 1.0);
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

fn hit_test_rect(ray: Ray, rect: Rect) -> f32 {
  let normal_norm = rect_get_normal_norm(ray, rect);
  let t_denominator = dot(normal_norm, ray.direction_norm);
  if abs(t_denominator) < EPS {
    return -1.0;
  }

  let normal = cross(rect.u, rect.v);
  let s = dot(normal, normal);
  let w = normal / s;
  let d = dot(normal_norm, rect.corner);
  let t_numerator = d - dot(normal_norm, ray.origin);
  let t = t_numerator / t_denominator;
  if t <= 0.0 {
    return -1.0;
  }

  let hit_point = get_hit_point(ray, t);
  let hit_point_rel = hit_point - rect.corner;

  let alpha = dot(cross(hit_point_rel, rect.v), w);
  let beta = dot(cross(rect.u, hit_point_rel), w);
  if 0.0 <= alpha && alpha <= 1.0 && 0.0 <= beta && beta <= 1.0 {
    return t;
  }
  return -1.0; // if miss, return a negative value
}

// hack: just to temporarily render a checkerboard
// will be removed in the future
fn hit_test_rect_alpha_beta(ray: Ray, rect: Rect) -> vec2f {
  let normal_norm = rect_get_normal_norm(ray, rect);
  let t_denominator = dot(normal_norm, ray.direction_norm);

  let normal = cross(rect.u, rect.v);
  let s = dot(normal, normal);
  let w = normal / s;
  let d = dot(normal_norm, rect.corner);
  let t_numerator = d - dot(normal_norm, ray.origin);
  let t = t_numerator / t_denominator;

  let hit_point = get_hit_point(ray, t);
  let hit_point_rel = hit_point - rect.corner;

  let alpha = dot(cross(hit_point_rel, rect.v), w);
  let beta = dot(cross(rect.u, hit_point_rel), w);
  return vec2f(alpha, beta);
}

fn get_hit_point(ray: Ray, t: f32) -> vec3f {
  return ray.origin + (ray.direction_norm * t);
}

// ============
//  get normal
// ============
// NOTE: all returned normals should be normalized

fn sphere_get_normal_norm(ray: Ray, sphere: Sphere, hit_point: vec3f) -> vec3f {
  let delta = hit_point - sphere.center;
  return delta / sphere.radius;
}

fn rect_get_normal_norm(ray: Ray, rect: Rect) -> vec3f {
  let normal = normalize(cross(rect.u, rect.v));
  return select(-normal, normal, dot(ray.direction_norm, normal) <= 0.0);
}

// ===================
//  evaluate material
// ===================
// NOTE: each function returns new ray's direction, which should be normalized (here)
// callers should always expect to get a noramlized ray direction

fn evaluate_diffuse(normal_norm: vec3f, seed: f32) -> vec3f {
  // TODO: check if this is lambertian, need a proof
  let res_ray_direction = normal_norm + rand_unit_sphere_shell(seed);
  return normalize(select(-res_ray_direction, res_ray_direction, dot(res_ray_direction, normal_norm) >= 0.0));
}

fn evaluate_metal(normal_norm: vec3f, in_ray_direction: vec3f, fuzziness: f32, seed: f32) -> vec3f {
  let res_ray_direction = reflect(in_ray_direction, normal_norm);
  return normalize(normalize(res_ray_direction) + (fuzziness * rand_unit_sphere_shell(seed)));
}

fn evaluate_glass(normal_norm: vec3f, in_ray_direction_norm: vec3f, refraction_index: f32, seed: f32) -> vec3f {
  let entering = dot(in_ray_direction_norm, normal_norm) <= 0.0;
  let co_norm = select(-normal_norm, normal_norm, entering);
  let eta = select(refraction_index, 1.0 / refraction_index, entering);

  let cos_theta = dot(in_ray_direction_norm, co_norm);
  let r0 = ((1.0 - eta) / (1.0 + eta)) * ((1.0 - eta) / (1.0 + eta));
  let fresnel = r0 + (1.0 - r0) * pow(1.0 - abs(cos_theta), 5.0);

  let refracted = refract(in_ray_direction_norm, co_norm, eta);

  if all(refracted == vec3f(0.0)) || fresnel > rand(seed) {
    return reflect(in_ray_direction_norm, normal_norm);
  } else {
    return refracted;
  }
}
`;
}
