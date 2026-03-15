(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const _ of i)if(_.type==="childList")for(const a of _.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const _={};return i.integrity&&(_.integrity=i.integrity),i.referrerPolicy&&(_.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?_.credentials="include":i.crossOrigin==="anonymous"?_.credentials="omit":_.credentials="same-origin",_}function r(i){if(i.ep)return;i.ep=!0;const _=t(i);fetch(i.href,_)}})();function B(n,e,t,r){let i=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST;return i|=t,n.createBuffer({label:e,size:r,usage:i})}function K(n,e,t){const r=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM;return n.createBuffer({label:e,size:t,usage:r})}function p(n,e,t){const r=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE;return n.createBuffer({label:e,size:t,usage:r})}function V(n,e,t){const r=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE|GPUBufferUsage.INDIRECT;return n.createBuffer({label:e,size:t,usage:r})}function J(n,e,t,r){const i=B(n,e,t,4),_=new Uint32Array(1);return _[0]=r,n.queue.writeBuffer(i,0,_.buffer),i}function Q(n,e,t){const r=p(n,e,4),i=new Uint32Array(1);return i[0]=t,n.queue.writeBuffer(r,0,i.buffer),r}class Z{bind_group_object;map_buffer_name_to_buffer_object=new Map;device;constructor(e){this.device=e}get_buffer(e){const t=this.map_buffer_name_to_buffer_object.get(e);if(t===void 0)throw new Error(`BindGroup: buffer "${e}" does not exist in this bind group!`);return t}set_buffer(e,t){if(this.map_buffer_name_to_buffer_object.has(e))this.map_buffer_name_to_buffer_object.set(e,t);else throw new Error(`BindGroup: unknown buffer name ${e}. It's forbidden to add buffers that do not relate to the bind group!`)}set_buffer_size(e,t){const r=this.get_buffer(e),i=r.size;if(t>i){const _=B(this.device,r.label,r.usage,t);this.set_buffer(e,_),r.destroy()}}}class ee{pipeline;constructor(e){this.pipeline=e}get_bind_group_layout(e){return this.pipeline.getBindGroupLayout(e)}dispatch_no_barrier(e,t,r,i,_){e.setPipeline(this.pipeline),e.setBindGroup(0,t.bind_group_object),e.dispatchWorkgroups(r,i,_)}dispatch_no_barrier_indirect(e,t,r,i){e.setPipeline(this.pipeline),e.setBindGroup(0,t.bind_group_object),e.dispatchWorkgroupsIndirect(r,i??0)}dispatch_no_barrier_multiple_bind_group(e,t,r,i,_){e.setPipeline(this.pipeline),t.forEach((a,o)=>{e.setBindGroup(o,a.bind_group_object)}),e.dispatchWorkgroups(r,i,_)}dispatch_no_barrier_multiple_bind_group_indirect(e,t,r,i){e.setPipeline(this.pipeline),t.forEach((_,a)=>{e.setBindGroup(a,_.bind_group_object)}),e.dispatchWorkgroupsIndirect(r,i??0)}dispatch(e,t,r,i,_){const a=e.beginComputePass();this.dispatch_no_barrier(a,t,r,i,_),a.end()}dispatch_indirect(e,t,r,i){const _=e.beginComputePass();this.dispatch_no_barrier_indirect(_,t,r,i),_.end()}dispatch_multiple_bind_group(e,t,r,i,_){const a=e.beginComputePass();this.dispatch_no_barrier_multiple_bind_group(a,t,r,i,_),a.end()}dispatch_multiple_bind_group_indirect(e,t,r,i){const _=e.beginComputePass();this.dispatch_no_barrier_multiple_bind_group_indirect(_,t,r,i),_.end()}}const te={u32:4,f32:4,vec2u:8,vec2f:8,vec3f:12,vec4f:16},re={u32:4,f32:4,vec2u:8,vec2f:8,vec3f:16,vec4f:16},ie={u32:1,f32:1,vec2u:2,vec2f:2,vec3f:3,vec4f:4},_e={u32:"integer",f32:"float",vec2u:"integer",vec2f:"float",vec3f:"float",vec4f:"float"},ne=new Map([["u32","u32"],["f32","f32"],["vec2u","vec2u"],["vec2<u32>","vec2u"],["vec2f","vec2f"],["vec2<f32>","vec2f"],["vec3f","vec3f"],["vec3<f32>","vec3f"],["vec4f","vec4f"],["vec4<f32>","vec4f"]]);class ${_shader_struct_name;_field_name_list;_field_type_list;constructor(e){this._shader_struct_name=e,this._field_name_list=[],this._field_type_list=[]}add_field(e,t){return this._field_name_list.push(e),this._field_type_list.push(t),this}build(e=!1){const t=[],r=new Map;let i=0,_=0;this._field_name_list.forEach((u,l)=>{const c=this._field_type_list[l],d=te[c],h=re[c];h>_&&(_=h),i=Math.ceil(i/h)*h,r.set(u,l),t.push({type:c,offset_bytes:i}),i+=d});const a=Math.ceil(i/_)*_,o=new ArrayBuffer(a);return new Uint8Array(o).fill(63),new R(this._shader_struct_name,o,r,t,e)}}class R{_name;_map_field_name_to_layout_entry_index;_layout;_data;constructor(e,t,r,i,_=!1){this._name=e,this._data=t,this._map_field_name_to_layout_entry_index=r,this._layout=i,_===!1&&this.check_optimal_layout()}copy(e=!0){let t;return e?(t=new ArrayBuffer(this.size_bytes),new Uint8Array(t).fill(63)):t=this._data.slice(0),new R(this.name,t,structuredClone(this._map_field_name_to_layout_entry_index),structuredClone(this._layout))}set_field(e,t,r=0){const i=this._map_field_name_to_layout_entry_index.get(e);if(i===void 0)throw new Error(`ShaderStruct: field "${e}" does not exist in shader struct "${this.name}"`);const _=this._layout[i],a=_.type;let o;typeof t=="number"?o=[t]:o=t;const s=ie[a];if(s!==o.length)throw o.length===1?new Error(`ShaderStruct: field "${e}" has ${s} components, but only "${o.length}" component is given`):new Error(`ShaderStruct: field "${e}" has ${s} components, but "${o.length}" components are given`);const u=_.offset_bytes,l=(r+u)/4;return _e[a]==="integer"?new Uint32Array(this._data).set(o,l):new Float32Array(this._data).set(o,l),this}_get_optimal_layout_impl_brute_force(){const e=this._layout.length,t=Array.from({length:e},()=>!1),r=Array.from({length:e},()=>-1);let i=Array.from({length:e},()=>-1),_=1061109567;const a=o=>{if(o===e){const s=new $("(I am a dummy used in the optimal layout algo >_<)");for(let l=0;l<e;l++)s.add_field("dummy field #{i}",this.layout[r[l]].type);const u=s.build(!0).size_bytes;u<_&&(_=u,i=structuredClone(r));return}for(let s=0;s<e;s++)t[s]===!1&&(t[s]=!0,r[o]=s,a(o+1),t[s]=!1)};return a(0),[Array.from({length:e},(o,s)=>({type:this._layout[i[s]].type,offset_bytes:-1})),_]}check_optimal_layout(){if(this._layout.length===0)return;function e(i,_){if(_.length!==i.length)return!1;const a=new Map;i.forEach(u=>{const l=u.type,c=a.get(l)??0;a.set(l,c+1)});const o=new Map;_.forEach(u=>{const l=u.type,c=o.get(l)??0;o.set(l,c+1)});let s=!0;return a.forEach((u,l)=>{const c=o.get(l);(c===void 0||c!==u)&&(s=!1)}),s}const[t,r]=this._get_optimal_layout_impl_brute_force();if(e(this._layout,t)===!1)throw new Error(`ShaderStruct (${this._name}): Bad impl of optimal layout algorithm: layout entry counts mismatch`);if(r>this.size_bytes)throw new Error(`ShaderStruct (${this._name}): bad impl of optimal layout algorithm: the "optimal" layout is suboptimal`);r<this.size_bytes&&(console.warn(`ShaderStruct (${this._name}): current layout is suboptimal, the suggested layout is:`),console.warn(t),console.warn(`which can save ${this.size_bytes} - ${r} = ${this.size_bytes-r} bytes`))}get name(){return this._name}get size_bytes(){return this._data.byteLength}get data(){return this._data}get layout(){return this._layout}get map_field_name_to_layout_entry_index(){return this._map_field_name_to_layout_entry_index}set override_data(e){this._data=e}}class ae{shader_struct;_data;_length;_stride;constructor(e,t){this._length=t,this._stride=e.size_bytes,this._data=new ArrayBuffer(t*this._stride),new Uint8Array(this._data).fill(63),this.shader_struct=e.copy(!1),this.shader_struct.override_data=this._data}set_field(e,t,r){if(e>=this.length)throw new Error(`ShaderStructArray: struct_index is out of bounds, given ${e}, max allowed is ${this.length}`);return this.shader_struct.set_field(t,r,e*this._stride),this}get length(){return this._length}get data(){return this._data}}class W{map_bind_group_index_to_bind_group_layout_entry_list=new Map;map_struct_name_to_shader_struct=new Map;constructor(e){const t=/^\s*@group\((\d)\)\s*@binding\((\d+)\)\s*var<([\w,\s]+)>/gm;let r;for(;(r=t.exec(e))!==null;){const _=+r[1],a=+r[2],o=r[3];let s;o.includes("uniform")?s="uniform":o.includes("read_write")?s="storage":s="read-only-storage";const u=this.map_bind_group_index_to_bind_group_layout_entry_list.get(_)??[];u.push({binding:a,visibility:GPUShaderStage.COMPUTE,buffer:{type:s}}),this.map_bind_group_index_to_bind_group_layout_entry_list.set(_,u)}const i=/struct\s+(\w+)\s*{([^}]+)}/gm;for(;(r=i.exec(e))!==null;){const _=r[1],a=r[2],o=new $(_);let s=!0;const u=/(\w+)\s*:\s*([\w<>]+)/gm;let l;for(;(l=u.exec(a))!==null;){const c=l[1],d=ne.get(l[2]);if(d===void 0){console.warn(`ShaderReflector: detected unsupported data type "${d}" (field: "${c}")`),console.warn(`ShaderReflector: struct "${_}" won't be reflected`),s=!1;break}if(d)o.add_field(c,d);else throw new Error("You should never see this error..This is just for passing type check. But if you do see this, you are in trouble.")}if(s){const c=o.build();this.map_struct_name_to_shader_struct.set(_,c)}}}get_struct(e){const t=this.map_struct_name_to_shader_struct.get(e);if(t===void 0)throw new Error(`ShaderReflector: struct "${e}" not found in shader`);return t.copy()}get_struct_array(e,t){const r=this.get_struct(e);return new ae(r,t)}}class w{shader_module;pipeline_layout;bind_group_layout_list=[];map_constant_name_to_value=new Map;device;kernel_name;shader_source;shader_entry_point;constructor(e,t,r,i){this.device=e,this.kernel_name=t,this.shader_source=r,this.shader_entry_point=i}add_constant(e,t){return this.map_constant_name_to_value.set(e,t),this}build(){return this._init_shader_module(),this._init_bind_group_layout(),this._init_pipeline_layout(),new ee(this._init_pipeline())}_init_shader_module(){this.shader_module=this.device.createShaderModule({label:`${this.kernel_name}ShaderModule`,code:this.shader_source})}_init_bind_group_layout(){const e=[];new W(this.shader_source).map_bind_group_index_to_bind_group_layout_entry_list.forEach((_,a)=>{e.push(a),this.bind_group_layout_list.push(this.device.createBindGroupLayout({label:`${this.kernel_name}_BindGroupLayout_${a}`,entries:_}))});const r=Array.from({length:e.length},(_,a)=>a);r.sort((_,a)=>e[_]-e[a]);const i=[];r.forEach((_,a)=>{i[a]=this.bind_group_layout_list[_]}),this.bind_group_layout_list=i}_init_pipeline_layout(){this.pipeline_layout=this.device.createPipelineLayout({label:`${this.kernel_name}_PipelineLayout`,bindGroupLayouts:this.bind_group_layout_list})}_init_pipeline(){if(this.pipeline_layout===void 0)throw new Error("KernelBuilder: undefined pipeline layout. have you called `this._init_pipeline_layout()` first?");if(this.shader_module===void 0)throw new Error("KernelBuilder: undefined shader module. have you called `this._init_shader_module()` first?");return this.device.createComputePipeline({label:`${this.kernel_name}_Pipeline`,layout:this.pipeline_layout,compute:{module:this.shader_module,entryPoint:this.shader_entry_point,constants:Object.fromEntries(this.map_constant_name_to_value)}})}}class g{buffer_entries=[];device;bind_group_name;constructor(e,t){this.device=e,this.bind_group_name=t}create_then_add_buffer(e,t,r,i){const _=B(this.device,e,r,i);return this.buffer_entries.push({name:e,binding_point:t,buffer:_}),this}create_then_add_buffer_init_u32(e,t,r,i){const _=J(this.device,e,r,i);return this.buffer_entries.push({name:e,binding_point:t,buffer:_}),this}add_buffer(e,t,r){return this.buffer_entries.push({name:e,binding_point:t,buffer:r}),this}build_raw(e,t){const r=new Z(this.device);this.buffer_entries.length===0&&console.warn(`[BindGroupBuilder (${this.bind_group_name})] no buffer added to current bind group!`);const i=new Set;for(const a of this.buffer_entries)i.has(a.binding_point)&&console.error("duplicate binding point detected!"),i.add(a.binding_point),a.buffer instanceof GPUBuffer&&r.map_buffer_name_to_buffer_object.set(a.name,a.buffer);const _=[];for(const a of this.buffer_entries)a.buffer instanceof GPUBuffer?_.push({binding:a.binding_point,resource:{buffer:a.buffer}}):_.push({binding:a.binding_point,resource:a.buffer});return r.bind_group_object=this.device.createBindGroup({label:this.bind_group_name,layout:e.getBindGroupLayout(t??0),entries:_}),r}build(e,t){return this.build_raw(e.pipeline,t)}}var z=typeof Float32Array<"u"?Float32Array:Array;function f(){var n=new z(3);return z!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n}function k(n,e,t){var r=new z(3);return r[0]=n,r[1]=e,r[2]=t,r}function x(n,e,t){return n[0]=e[0]+t[0],n[1]=e[1]+t[1],n[2]=e[2]+t[2],n}function oe(n,e,t){return n[0]=e[0]-t[0],n[1]=e[1]-t[1],n[2]=e[2]-t[2],n}function y(n,e,t){return n[0]=e[0]*t,n[1]=e[1]*t,n[2]=e[2]*t,n}function D(n,e){var t=e[0],r=e[1],i=e[2],_=t*t+r*r+i*i;return _>0&&(_=1/Math.sqrt(_)),n[0]=e[0]*_,n[1]=e[1]*_,n[2]=e[2]*_,n}function C(n,e,t){var r=e[0],i=e[1],_=e[2],a=t[0],o=t[1],s=t[2];return n[0]=i*s-_*o,n[1]=_*a-r*s,n[2]=r*o-i*a,n}var L=oe;(function(){var n=f();return function(e,t,r,i,_,a){var o,s;for(t||(t=3),r||(r=0),i?s=Math.min(i*t+r,e.length):s=e.length,o=r;o<s;o+=t)n[0]=e[o],n[1]=e[o+1],n[2]=e[o+2],_(n,n,a),e[o]=n[0],e[o+1]=n[1],e[o+2]=n[2];return e}})();const se=32,le=90/180*Math.PI,T=1,G=k(0,2,3),ue=k(0,0,0),q=.001,ce=k(.48,.82,1),de=q,fe=100.1,he=Math.PI;function b(){return`
// ===========
//  constants
// ===========

const EPS = ${q};
const PI = ${he};
// LESSON (260307): always set color in linear space.
// but most tools give us srgb-encoded values.
// so do the conversion first.
const SKY_COLOR = vec3f(${ce});
const RAY_NEAR_THRESHOLD = ${de};
const RAY_FAR_THRESHOLD = ${fe};

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
`}function pe(){return`
@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(0) @binding(1) var<storage, read_write> out_ray_array_length: u32;
@group(0) @binding(2) var<storage, read_write> out_ray_array: array<Ray>;
@group(0) @binding(3) var<storage, read_write> out_frame_index: u32;

const WG_DIM_X = 16u;
const WG_DIM_Y = 16u;

@compute
@workgroup_size(WG_DIM_X, WG_DIM_Y, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_id) local_id: vec3u
) {
  let x = (workgroup_id.x * WG_DIM_X) + local_id.x;
  let y = (workgroup_id.y * WG_DIM_Y) + local_id.y;

  let scene_info = in_scene_info;
  let pixel00 = scene_info.pixel00;
  let viewport_u_base = scene_info.viewport_u_base;
  let viewport_v_base = scene_info.viewport_v_base;
  let eye = scene_info.eye;
  let width = scene_info.width;
  let height = scene_info.height;

  let ray_array_offset = y * width + x;
  if ray_array_offset == 0u {
    out_ray_array_length = width * height;
    out_frame_index++;
  }

  if x < width && y < height {
    let pixel_offset = vec2f(f32(x), f32(y)) + rand_unit_square(f32(out_frame_index) * 114514.1919810 + f32(ray_array_offset));
    let target_pixel = pixel00 + ((viewport_u_base * pixel_offset.x) + (viewport_v_base * pixel_offset.y));
    let direction_norm = normalize(target_pixel - eye);
    let primary_ray = Ray(eye, direction_norm, ray_array_offset, vec3f(1.0));
    out_ray_array[ray_array_offset] = primary_ray;
  }
}
`}function ge(){return`
@group(0) @binding(0) var<storage, read> in_next_ray_array_length: u32;
@group(0) @binding(1) var<storage, read_write> out_prev_ray_array_length: u32;
@group(0) @binding(2) var<storage, read_write> out_indirect_args: IndirectArgs;

@compute
@workgroup_size(1, 1, 1)
fn compute() {
    out_prev_ray_array_length = 0u;
    out_indirect_args = IndirectArgs((in_next_ray_array_length + 127u) / 128u, 1u, 1u);
}
`}function ye(){return`
@group(0) @binding(0) var<storage, read> in_ray_array_length: u32;
@group(0) @binding(1) var<storage, read> in_ray_array: array<Ray>;
@group(0) @binding(2) var<storage, read_write> out_ray_array_length: atomic<u32>;
@group(0) @binding(3) var<storage, read_write> out_ray_array: array<Ray>;

@group(1) @binding(0) var<storage, read> in_object_array: array<Object>;
@group(1) @binding(1) var<storage, read> in_sphere_array: array<Sphere>;
@group(1) @binding(2) var<storage, read> in_rect_array: array<Rect>;
@group(1) @binding(3) var<storage, read> in_material_array: array<Material>;
@group(1) @binding(4) var<storage, read_write> out_color_buffer: array<vec4f>;

const WG_DIM_X = 128u;

@compute
@workgroup_size(WG_DIM_X, 1, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_index) thread_id: u32
) {
  let id = (workgroup_id.x * WG_DIM_X) + thread_id;

  if id < in_ray_array_length {
    let ray = in_ray_array[id];

    var min_t = 1e10;
    var hit_object_id = -1;

    let object_array_length = i32(arrayLength(&in_object_array));

    for (var i = 0; i < object_array_length; i++) {
      let object = in_object_array[i];

      var t = RAY_FAR_THRESHOLD;
      if object.geometry_type == 0u {
        t = hit_test_sphere(ray, in_sphere_array[object.geometry_data_id]);
      } else { // object.geometry_type == 1u --> rect
        t = hit_test_rect(ray, in_rect_array[object.geometry_data_id]);
      }

      if t <= RAY_NEAR_THRESHOLD || t >= RAY_FAR_THRESHOLD {
        continue;
      }

      if t < min_t {
        min_t = t;
        hit_object_id = i;
      }
    }

    if hit_object_id >= 0 {
      let write_idx = atomicAdd(&out_ray_array_length, 1u);
      let hit_point = get_hit_point(ray, min_t);
      let object = in_object_array[hit_object_id];

      // ===== determine normal
      var normal_norm = vec3f(0.0);
      if object.geometry_type == 0u {
        normal_norm = sphere_get_normal_norm(ray, in_sphere_array[object.geometry_data_id], hit_point);
      } else { // object.geometry_type == 1u --> rect
        normal_norm = rect_get_normal_norm(ray, in_rect_array[object.geometry_data_id]);
      }

      // ===== compute new ray
      let material = in_material_array[object.material_data_id];
      let material_type = material._type;

      var new_ray_direction_norm = vec3f(0.0);
      if material_type == 0u {
        new_ray_direction_norm = evaluate_diffuse(normal_norm, f32(write_idx) * min_t);
        out_ray_array[write_idx] = Ray(hit_point + (EPS * normal_norm), new_ray_direction_norm, ray.pixel_offset, ray.weight * material.albedo);
      } else if material_type == 1u {
        new_ray_direction_norm = evaluate_metal(normal_norm, ray.direction_norm, material.fuzziness, f32(write_idx) * min_t);
        out_ray_array[write_idx] = Ray(hit_point + (EPS * normal_norm), new_ray_direction_norm, ray.pixel_offset, ray.weight * material.albedo);
      } else { // object.material_type == 2u --> glass
        let entering = dot(ray.direction_norm, normal_norm) <= 0.0;
        let offset_dir = select(normal_norm, -normal_norm, entering);
        new_ray_direction_norm = evaluate_glass(normal_norm, ray.direction_norm, material.refraction_index, f32(write_idx) * min_t);
        out_ray_array[write_idx] = Ray(hit_point + (EPS * offset_dir), new_ray_direction_norm, ray.pixel_offset, ray.weight);
        // LESSON (260314) we almost always need some bias to improve numerical stability..
      }

      // hack: checkerboard
      if object.geometry_type == 1u {
        const RES = 50.0;
        let uv = hit_test_rect_alpha_beta(ray, in_rect_array[object.geometry_data_id]) * RES;
        let uv_int = vec2u(uv);
        out_ray_array[write_idx].weight = ray.weight * select(1.0, 0.0, (uv_int.x + uv_int.y) % 2 == 0u);
      }
    } else {
      out_color_buffer[ray.pixel_offset] += vec4f(SKY_COLOR * ray.weight, 1.0);
    }
  }
}
`}function be(){return`
@group(0) @binding(0) var<storage, read> in_frame_index: u32;
@group(0) @binding(1) var<storage, read> in_color_buffer: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> out_filtered_color_buffer: array<vec4f>;

const WG_DIM_X = 128u;

@compute
@workgroup_size(WG_DIM_X, 1, 1)
fn compute(
  @builtin(workgroup_id) workgroup_id : vec3u,
  @builtin(local_invocation_index) thread_id: u32
) {
  let id = (workgroup_id.x * WG_DIM_X) + thread_id;
  let n = arrayLength(&in_color_buffer);
  if id < n {
    let curr = in_color_buffer[id];
    let prev = out_filtered_color_buffer[id];
    out_filtered_color_buffer[id] = mix(prev, curr, 1.0 / f32(in_frame_index));
  }
}
`}function I(){return`
@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;
@group(0) @binding(1) var<storage, read> in_filtered_color_buffer: array<vec4f>;

struct VSOutput {
  @builtin(position) position: vec4f
}

@vertex
fn vertex(@builtin(vertex_index) vertex_index: u32) -> VSOutput {
  var vs_output: VSOutput;

  let pos_x = select(1.0, -1.0, (vertex_index & 1u) == 0u);
  let pos_y = select(1.0, -1.0, ((vertex_index >> 1u) & 1u) == 1u);
  vs_output.position = vec4f(pos_x, pos_y, 0.0, 1.0);

  return vs_output;
}

@fragment
fn fragment(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let width = in_scene_info.width;
  let pixel_offset = u32(position.y) * width + u32(position.x);
  let linear_color = in_filtered_color_buffer[pixel_offset];
  let cutoff = 0.0031308;
  let srgb = select(
    1.055 * pow(linear_color.rgb, vec3<f32>(1.0/2.4)) - 0.055,
    12.92 * linear_color.rgb,
    linear_color.rgb < vec3<f32>(cutoff)
  );

  return vec4<f32>(srgb, linear_color.a);
}
`}class me{map_event_to_callback=new Map;active_event_list=[];event_write_idx=0;emit(e){this.event_write_idx<this.active_event_list.length?(this.active_event_list[this.event_write_idx]=e,this.event_write_idx++):this.active_event_list.push(e)}listen(e,t){const r=this.map_event_to_callback.get(e)??[];r.push(t),this.map_event_to_callback.set(e,r)}process(){for(let e=0;e<this.event_write_idx;e++){const t=this.map_event_to_callback.get(this.active_event_list[e])??[];for(const r of t)r()}this.event_write_idx=0}}class ve{_event_bus;_device;_context;_presentation_format;_canvas_width;_canvas_height;_pixel_cnt;_gen_ray_kernel;_gen_ray_kernel_bind_group;_prep_hit_test_kernel;_prep_hit_test_kernel_bind_group_pingpong;_hit_test_kernel;_hit_test_kernel_bind_group_pingpong;_hit_test_kernel_bind_group_shared;_filter_kernel;_filter_kernel_bind_group;_blit_pipeline;_blit_bind_group;_utils_shader_reflector;async main(){await this.init_webgpu(),this.init_canvas_size(),this.pre_init()&&(this.init_kernels(),this.init_bind_groups(),this.init_callbacks(),this.render())}async init_webgpu(){const e=await navigator.gpu.requestAdapter();if(e===null){console.error("failed to initialize WebGPU!");return}const t=await e.requestDevice({requiredLimits:{maxBufferSize:e.limits.maxBufferSize,maxStorageBufferBindingSize:e.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:e.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:e.limits.maxComputeWorkgroupSizeX,maxStorageBuffersPerShaderStage:e.limits.maxStorageBuffersPerShaderStage},requiredFeatures:[]});if(t===null){console.error("failed to initialize WebGPU!");return}this._device=t,this._presentation_format=navigator.gpu.getPreferredCanvasFormat();const r=document.querySelector("canvas");if(r===null)throw new Error("could not find canvas element. please check index.html!");const i=r.getContext("webgpu");if(i===null){console.error("failed to initialize WebGPU!");return}i.configure({device:this._device,format:this._presentation_format}),this._context=i,console.info("successfully initialized WebGPU 🎉")}pre_init(){return this._utils_shader_reflector=new W(b()),this._event_bus=new me,!0}prepare_scene_info_data(){const e=this._canvas_width/this._canvas_height,t=f();L(t,ue,G),D(t,t);const r=f();C(r,t,k(0,1,0)),D(r,r);const i=f();C(i,t,r);const _=2*Math.tan(le/2)*T,a=_*e,o=f();y(o,r,a);const s=f();y(s,i,_);const u=f();y(u,o,1/this._canvas_width);const l=f();y(l,s,1/this._canvas_height);const c=f(),d=f();y(d,t,T),x(c,G,d),x(d,o,s),y(d,d,.5),L(c,c,d);const h=f();x(d,u,l),y(d,d,.5),x(h,c,d);const S=this._utils_shader_reflector.get_struct("SceneInfo");return S.set_field("pixel00",h).set_field("width",this._canvas_width).set_field("height",this._canvas_height).set_field("viewport_u_base",u).set_field("viewport_v_base",l).set_field("eye",G),S.data}init_canvas_size(){const e=document.querySelector("canvas");if(e===null)throw new Error("could not find canvas element. please check index.html!");const t=window.devicePixelRatio;e.width=Math.floor(t*e.clientWidth),e.height=Math.floor(t*e.clientHeight),this._canvas_width=e.width,this._canvas_height=e.height,this._pixel_cnt=this._canvas_width*this._canvas_height}init_kernels(){this._gen_ray_kernel=new w(this._device,"gen ray kernel",b()+pe(),"compute").build(),this._prep_hit_test_kernel=new w(this._device,"prep hit test kernel",b()+ge(),"compute").build(),this._hit_test_kernel=new w(this._device,"hit test kernel",b()+ye(),"compute").build(),this._filter_kernel=new w(this._device,"filter kernel",b()+be(),"compute").build();const e=this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),t=this._device.createPipelineLayout({bindGroupLayouts:[e]});this._blit_pipeline=this._device.createRenderPipeline({layout:t,vertex:{module:this._device.createShaderModule({code:b()+I()}),entryPoint:"vertex"},fragment:{module:this._device.createShaderModule({code:b()+I()}),entryPoint:"fragment",targets:[{format:this._presentation_format,writeMask:GPUColorWrite.ALL}]},primitive:{topology:"triangle-strip"}})}init_bind_groups(){const e=this.prepare_scene_info_data(),t=K(this._device,"scene info",e.byteLength);this._device.queue.writeBuffer(t,0,e);const _=this._utils_shader_reflector.get_struct_array("Object",4).set_field(0,"geometry_type",0).set_field(0,"geometry_data_id",0).set_field(0,"material_data_id",0).set_field(1,"geometry_type",1).set_field(1,"geometry_data_id",0).set_field(1,"material_data_id",1).set_field(2,"geometry_type",0).set_field(2,"geometry_data_id",1).set_field(2,"material_data_id",4).set_field(3,"geometry_type",0).set_field(3,"geometry_data_id",2).set_field(3,"material_data_id",2).data,a=p(this._device,"object array",_.byteLength);this._device.queue.writeBuffer(a,0,_);const s=this._utils_shader_reflector.get_struct_array("Sphere",3).set_field(0,"center",[.3-.5,.5,1.2]).set_field(0,"radius",.5).set_field(1,"center",[1.1,.75,1]).set_field(1,"radius",.75).set_field(2,"center",[-1.2,.3,1]).set_field(2,"radius",.3).data,u=p(this._device,"sphere array",s.byteLength);this._device.queue.writeBuffer(u,0,s);const l=5,d=this._utils_shader_reflector.get_struct_array("Rect",1).set_field(0,"corner",[-l/2,0,-l/2]).set_field(0,"u",[l,0,0]).set_field(0,"v",[0,0,l]).data,h=p(this._device,"rect array",d.byteLength);this._device.queue.writeBuffer(h,0,d);const E=this._utils_shader_reflector.get_struct_array("Material",5).set_field(0,"_type",0).set_field(0,"albedo",[.8,0,0]).set_field(1,"_type",0).set_field(1,"albedo",[.2,.2,.2]).set_field(2,"_type",2).set_field(2,"albedo",[0,.8,0]).set_field(2,"refraction_index",1.5).set_field(3,"_type",0).set_field(3,"albedo",[0,0,.8]).set_field(4,"_type",1).set_field(4,"albedo",[.5,.5,.5]).set_field(4,"fuzziness",0).data,A=p(this._device,"material array",E.byteLength);this._device.queue.writeBuffer(A,0,E);const j=p(this._device,"color buffer",16*this._canvas_width*this._canvas_height),M=V(this._device,"hit test indirect arg",12),O=this._utils_shader_reflector.get_struct("Ray").size_bytes,m=p(this._device,"ray array length ping",4),P=p(this._device,"ray array ping",O*this._canvas_width*this._canvas_height),v=p(this._device,"ray array length pong",4),U=p(this._device,"ray array pong",O*this._canvas_width*this._canvas_height),F=Q(this._device,"frame index",0);this._gen_ray_kernel_bind_group=new g(this._device,"gen ray kernel bind group").add_buffer("in_scene_info",0,t).add_buffer("out_ray_array_length",1,m).add_buffer("out_ray_array",2,P).add_buffer("out_frame_index",3,F).build(this._gen_ray_kernel);const Y=new g(this._device,"prep hit test kernel bind group ping").add_buffer("in_next_ray_array_length",0,m).add_buffer("out_prev_ray_array_length",1,v).add_buffer("out_indirect_args",2,M).build(this._prep_hit_test_kernel),N=new g(this._device,"prep hit test kernel bind group pong").add_buffer("in_next_ray_array_length",0,v).add_buffer("out_prev_ray_array_length",1,m).add_buffer("out_indirect_args",2,M).build(this._prep_hit_test_kernel);this._prep_hit_test_kernel_bind_group_pingpong=[Y,N];const H=new g(this._device,"hit test kernel bind group ping").add_buffer("in_ray_array_length",0,m).add_buffer("in_ray_array",1,P).add_buffer("out_ray_array_length",2,v).add_buffer("out_ray_array",3,U).build(this._hit_test_kernel,0),X=new g(this._device,"hit test kernel bind group pong").add_buffer("in_ray_array_length",0,v).add_buffer("in_ray_array",1,U).add_buffer("out_ray_array_length",2,m).add_buffer("out_ray_array",3,P).build(this._hit_test_kernel,0);this._hit_test_kernel_bind_group_shared=new g(this._device,"hit test kernel bind group shared").add_buffer("in_object_array",0,a).add_buffer("in_sphere_array",1,u).add_buffer("in_rect_array",2,h).add_buffer("in_material_array",3,A).add_buffer("out_color_buffer",4,j).build(this._hit_test_kernel,1),this._hit_test_kernel_bind_group_pingpong=[H,X],this._filter_kernel_bind_group=new g(this._device,"filter kernel bind group").add_buffer("in_frame_index",0,this._gen_ray_kernel_bind_group.get_buffer("out_frame_index")).add_buffer("in_color_buffer",1,j).create_then_add_buffer("out_filtered_color_buffer",2,GPUBufferUsage.STORAGE,16*this._canvas_width*this._canvas_height).build(this._filter_kernel),this._blit_bind_group=new g(this._device,"blit bind group").add_buffer("in_scene_info",0,t).add_buffer("in_filtered_color_buffer",1,this._filter_kernel_bind_group.get_buffer("out_filtered_color_buffer")).build_raw(this._blit_pipeline)}init_callbacks(){this._event_bus.listen("canvas-size-changed",()=>{this.init_canvas_size(),this.init_bind_groups()});let e;addEventListener("resize",()=>{e&&clearTimeout(e),e=setTimeout(()=>{this._event_bus.emit("canvas-size-changed")},100)})}render(){const e=t=>{this._event_bus.process();const r=this._prep_hit_test_kernel_bind_group_pingpong[0].get_buffer("out_indirect_args"),i=this._device.createCommandEncoder();{i.clearBuffer(this._filter_kernel_bind_group.get_buffer("in_color_buffer")),i.pushDebugGroup("frame");{i.pushDebugGroup("ray generation"),this._gen_ray_kernel.dispatch(i,this._gen_ray_kernel_bind_group,Math.ceil(this._canvas_width/16),Math.ceil(this._canvas_height/16),1),i.popDebugGroup(),i.pushDebugGroup("hit test");{for(let _=0;_<se;_++)this._prep_hit_test_kernel.dispatch(i,this._prep_hit_test_kernel_bind_group_pingpong[_&1],1,1,1),this._hit_test_kernel.dispatch_multiple_bind_group_indirect(i,[this._hit_test_kernel_bind_group_pingpong[_&1],this._hit_test_kernel_bind_group_shared],r);i.popDebugGroup()}i.pushDebugGroup("filtering"),this._filter_kernel.dispatch(i,this._filter_kernel_bind_group,Math.ceil(this._pixel_cnt/128),1,1),i.popDebugGroup(),i.pushDebugGroup("blit");{const _=i.beginRenderPass({colorAttachments:[{view:this._context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});_.setBindGroup(0,this._blit_bind_group.bind_group_object),_.setPipeline(this._blit_pipeline),_.draw(4,1),_.end(),i.popDebugGroup()}i.popDebugGroup()}this._device.queue.submit([i.finish()])}window.requestAnimationFrame(e)};window.requestAnimationFrame(e)}}const we=new ve;we.main();
