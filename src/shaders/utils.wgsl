// ===========
//  constants
// ===========
const EPS = 0.001;
const PI = 3.141592653;
const SKY_COLOR = vec3f(143.0, 233.0, 255.0) / 255.0;
const RAY_NEAR_THRESHOLD = EPS;
const RAY_FAR_THRESHOLD = 100.0;

// =========
//  structs
// =========
struct SceneInfo { // 64
  pixel00: vec3f, // 0 -> 12
  width: u32, // 12 -> 4
  viewport_u_base: vec3f, // 16 -> 12
  height: u32, // 28 -> 4
  viewport_v_base: vec3f, // 32 -> 16 (12 + 4)
  eye: vec3f // 48 -> 16 (12 + 4)
}

struct Ray { // 48
  origin: vec3f, // 0 -> 16 (12 + 4)
  direction_norm: vec3f, // 16 -> 12;
  pixel_offset: u32, // 28 -> 4
  weight: vec3f, // 32 -> 16 (12 + 4)
}

struct Sphere { // 16
  center: vec3f, // 0 -> 12
  radius: f32, // 12 -> 4
}

struct IndirectArgs { // 12
  dispatch_x: u32, // 0 -> 4
  dispatch_y: u32, // 4 -> 8
  dispatch_z: u32, // 8 -> 12
}

struct DiffuseMaterial { // 16
  albedo: vec3f // 0 -> 16 (12 + 4)
}

// ========
//  random
// ========

var<private> seed_bias = 0.0;

// from: https://marktension.nl/blog/my_favorite_wgsl_random_func_so_far/
fn rand(seed: f32) -> f32 {
  var x = bitcast<u32>(seed_bias + seed);

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

fn get_hit_point(ray: Ray, t: f32) -> vec3f {
  return ray.origin + (ray.direction_norm * t);
}

// ============
//  get normal
// ============
// NOTE: all returned normals should be normalized

fn sphere_get_normal_norm(ray: Ray, sphere: Sphere, hit_point: vec3f) -> vec3f {
  let delta = hit_point - sphere.center;
  return select(-delta, delta, dot(delta, ray.direction_norm) <= 0.0) / sphere.radius;
}

// ===================
//  evaluate material
// ===================
// NOTE: each function returns new ray's direction, which should be normalized

fn evaluate_diffuse(normal: vec3f, hit_point: vec3f, seed: f32) -> vec3f {
  let res_ray_direction = rand_unit_sphere_shell(seed);
  return select(-res_ray_direction, res_ray_direction, dot(res_ray_direction, normal) >= 0.0);
}

// fn evaluate_metal(in_ray_dirction: vec3f, normal_norm: vec3f, hit_point: vec3f) -> vec3f {
//   let res_ray_direction = reflect(in_ray_dirction, normal_norm);
//   return normalize(res_ray_direction);
// }
