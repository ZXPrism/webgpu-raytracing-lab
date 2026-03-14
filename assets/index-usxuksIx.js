(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const _ of i)if(_.type==="childList")for(const a of _.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const _={};return i.integrity&&(_.integrity=i.integrity),i.referrerPolicy&&(_.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?_.credentials="include":i.crossOrigin==="anonymous"?_.credentials="omit":_.credentials="same-origin",_}function r(i){if(i.ep)return;i.ep=!0;const _=t(i);fetch(i.href,_)}})();function C(n,e,t,r){let i=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST;return i|=t,n.createBuffer({label:e,size:r,usage:i})}function oe(n,e,t){const r=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM;return n.createBuffer({label:e,size:t,usage:r})}function b(n,e,t){const r=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE;return n.createBuffer({label:e,size:t,usage:r})}function se(n,e,t){const r=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE|GPUBufferUsage.INDIRECT;return n.createBuffer({label:e,size:t,usage:r})}function ue(n,e,t,r){const i=C(n,e,t,4),_=new Uint32Array(1);return _[0]=r,n.queue.writeBuffer(i,0,_.buffer),i}function le(n,e,t){const r=b(n,e,4),i=new Uint32Array(1);return i[0]=t,n.queue.writeBuffer(r,0,i.buffer),r}class fe{bind_group_object;map_buffer_name_to_buffer_object=new Map;device;constructor(e){this.device=e}get_buffer(e){const t=this.map_buffer_name_to_buffer_object.get(e);if(t===void 0)throw new Error(`BindGroup: buffer "${e}" does not exist in this bind group!`);return t}set_buffer(e,t){if(this.map_buffer_name_to_buffer_object.has(e))this.map_buffer_name_to_buffer_object.set(e,t);else throw new Error(`BindGroup: unknown buffer name ${e}. It's forbidden to add buffers that do not relate to the bind group!`)}set_buffer_size(e,t){const r=this.get_buffer(e),i=r.size;if(t>i){const _=C(this.device,r.label,r.usage,t);this.set_buffer(e,_),r.destroy()}}}class de{pipeline;constructor(e){this.pipeline=e}get_bind_group_layout(e){return this.pipeline.getBindGroupLayout(e)}dispatch_no_barrier(e,t,r,i,_){e.setPipeline(this.pipeline),e.setBindGroup(0,t.bind_group_object),e.dispatchWorkgroups(r,i,_)}dispatch_no_barrier_indirect(e,t,r,i){e.setPipeline(this.pipeline),e.setBindGroup(0,t.bind_group_object),e.dispatchWorkgroupsIndirect(r,i??0)}dispatch_no_barrier_multiple_bind_group(e,t,r,i,_){e.setPipeline(this.pipeline),t.forEach((a,o)=>{e.setBindGroup(o,a.bind_group_object)}),e.dispatchWorkgroups(r,i,_)}dispatch_no_barrier_multiple_bind_group_indirect(e,t,r,i){e.setPipeline(this.pipeline),t.forEach((_,a)=>{e.setBindGroup(a,_.bind_group_object)}),e.dispatchWorkgroupsIndirect(r,i??0)}dispatch(e,t,r,i,_){const a=e.beginComputePass();this.dispatch_no_barrier(a,t,r,i,_),a.end()}dispatch_indirect(e,t,r,i){const _=e.beginComputePass();this.dispatch_no_barrier_indirect(_,t,r,i),_.end()}dispatch_multiple_bind_group(e,t,r,i,_){const a=e.beginComputePass();this.dispatch_no_barrier_multiple_bind_group(a,t,r,i,_),a.end()}dispatch_multiple_bind_group_indirect(e,t,r,i){const _=e.beginComputePass();this.dispatch_no_barrier_multiple_bind_group_indirect(_,t,r,i),_.end()}}const ce={u32:4,f32:4,vec2u:8,vec2f:8,vec3f:12,vec4f:16},pe={u32:4,f32:4,vec2u:8,vec2f:8,vec3f:16,vec4f:16},he={u32:1,f32:1,vec2u:2,vec2f:2,vec3f:3,vec4f:4},ge={u32:"integer",f32:"float",vec2u:"integer",vec2f:"float",vec3f:"float",vec4f:"float"},ye=new Map([["u32","u32"],["f32","f32"],["vec2u","vec2u"],["vec2<u32>","vec2u"],["vec2f","vec2f"],["vec2<f32>","vec2f"],["vec3f","vec3f"],["vec3<f32>","vec3f"],["vec4f","vec4f"],["vec4<f32>","vec4f"]]);class X{_shader_struct_name;_field_name_list;_field_type_list;constructor(e){this._shader_struct_name=e,this._field_name_list=[],this._field_type_list=[]}add_field(e,t){return this._field_name_list.push(e),this._field_type_list.push(t),this}build(e=!1){const t=[],r=new Map;let i=0,_=0;this._field_name_list.forEach((d,f)=>{const l=this._field_type_list[f],c=ce[l],p=pe[l];p>_&&(_=p),i=Math.ceil(i/p)*p,r.set(d,f),t.push({type:l,offset_bytes:i}),i+=c});const a=Math.ceil(i/_)*_,o=new ArrayBuffer(a);return new Uint8Array(o).fill(63),new I(this._shader_struct_name,o,r,t,e)}}class I{_name;_map_field_name_to_layout_entry_index;_layout;_data;constructor(e,t,r,i,_=!1){this._name=e,this._data=t,this._map_field_name_to_layout_entry_index=r,this._layout=i,_===!1&&this.check_optimal_layout()}copy(e=!0){let t;return e?(t=new ArrayBuffer(this.size_bytes),new Uint8Array(t).fill(63)):t=this._data.slice(0),new I(this.name,t,structuredClone(this._map_field_name_to_layout_entry_index),structuredClone(this._layout))}set_field(e,t,r=0){const i=this._map_field_name_to_layout_entry_index.get(e);if(i===void 0)throw new Error(`ShaderStruct: field "${e}" does not exist in shader struct "${this.name}"`);const _=this._layout[i],a=_.type;let o;typeof t=="number"?o=[t]:o=t;const s=he[a];if(s!==o.length)throw o.length===1?new Error(`ShaderStruct: field "${e}" has ${s} components, but only "${o.length}" component is given`):new Error(`ShaderStruct: field "${e}" has ${s} components, but "${o.length}" components are given`);const d=_.offset_bytes,f=(r+d)/4;return ge[a]==="integer"?new Uint32Array(this._data).set(o,f):new Float32Array(this._data).set(o,f),this}_get_optimal_layout_impl_brute_force(){const e=this._layout.length,t=Array.from({length:e},()=>!1),r=Array.from({length:e},()=>-1);let i=Array.from({length:e},()=>-1),_=1061109567;const a=o=>{if(o===e){const s=new X("(I am a dummy used in the optimal layout algo >_<)");for(let f=0;f<e;f++)s.add_field("dummy field #{i}",this.layout[r[f]].type);const d=s.build(!0).size_bytes;d<_&&(_=d,i=structuredClone(r));return}for(let s=0;s<e;s++)t[s]===!1&&(t[s]=!0,r[o]=s,a(o+1),t[s]=!1)};return a(0),[Array.from({length:e},(o,s)=>({type:this._layout[i[s]].type,offset_bytes:-1})),_]}check_optimal_layout(){if(this._layout.length===0)return;function e(i,_){if(_.length!==i.length)return!1;const a=new Map;i.forEach(d=>{const f=d.type,l=a.get(f)??0;a.set(f,l+1)});const o=new Map;_.forEach(d=>{const f=d.type,l=o.get(f)??0;o.set(f,l+1)});let s=!0;return a.forEach((d,f)=>{const l=o.get(f);(l===void 0||l!==d)&&(s=!1)}),s}const[t,r]=this._get_optimal_layout_impl_brute_force();if(e(this._layout,t)===!1)throw new Error(`ShaderStruct (${this._name}): Bad impl of optimal layout algorithm: layout entry counts mismatch`);if(r>this.size_bytes)throw new Error(`ShaderStruct (${this._name}): bad impl of optimal layout algorithm: the "optimal" layout is suboptimal`);r<this.size_bytes&&(console.warn(`ShaderStruct (${this._name}): current layout is suboptimal, the suggested layout is:`),console.warn(t),console.warn(`which can save ${this.size_bytes} - ${r} = ${this.size_bytes-r} bytes`))}get name(){return this._name}get size_bytes(){return this._data.byteLength}get data(){return this._data}get layout(){return this._layout}get map_field_name_to_layout_entry_index(){return this._map_field_name_to_layout_entry_index}set override_data(e){this._data=e}}class be{shader_struct;_data;_length;_stride;constructor(e,t){this._length=t,this._stride=e.size_bytes,this._data=new ArrayBuffer(t*this._stride),new Uint8Array(this._data).fill(63),this.shader_struct=e.copy(!1),this.shader_struct.override_data=this._data}set_field(e,t,r){if(e>=this.length)throw new Error(`ShaderStructArray: struct_index is out of bounds, given ${e}, max allowed is ${this.length}`);return this.shader_struct.set_field(t,r,e*this._stride),this}get length(){return this._length}get data(){return this._data}}class H{map_bind_group_index_to_bind_group_layout_entry_list=new Map;map_struct_name_to_shader_struct=new Map;constructor(e){const t=/^\s*@group\((\d)\)\s*@binding\((\d+)\)\s*var<([\w,\s]+)>/gm;let r;for(;(r=t.exec(e))!==null;){const _=+r[1],a=+r[2],o=r[3];let s;o.includes("uniform")?s="uniform":o.includes("read_write")?s="storage":s="read-only-storage";const d=this.map_bind_group_index_to_bind_group_layout_entry_list.get(_)??[];d.push({binding:a,visibility:GPUShaderStage.COMPUTE,buffer:{type:s}}),this.map_bind_group_index_to_bind_group_layout_entry_list.set(_,d)}const i=/struct\s+(\w+)\s*{([^}]+)}/gm;for(;(r=i.exec(e))!==null;){const _=r[1],a=r[2],o=new X(_);let s=!0;const d=/(\w+)\s*:\s*([\w<>]+)/gm;let f;for(;(f=d.exec(a))!==null;){const l=f[1],c=ye.get(f[2]);if(c===void 0){console.warn(`ShaderReflector: detected unsupported data type "${c}" (field: "${l}")`),console.warn(`ShaderReflector: struct "${_}" won't be reflected`),s=!1;break}if(c)o.add_field(l,c);else throw new Error("You should never see this error..This is just for passing type check. But if you do see this, you are in trouble.")}if(s){const l=o.build();this.map_struct_name_to_shader_struct.set(_,l)}}}get_struct(e){const t=this.map_struct_name_to_shader_struct.get(e);if(t===void 0)throw new Error(`ShaderReflector: struct "${e}" not found in shader`);return t.copy()}get_struct_array(e,t){const r=this.get_struct(e);return new be(r,t)}}class P{shader_module;pipeline_layout;bind_group_layout_list=[];map_constant_name_to_value=new Map;device;kernel_name;shader_source;shader_entry_point;constructor(e,t,r,i){this.device=e,this.kernel_name=t,this.shader_source=r,this.shader_entry_point=i}add_constant(e,t){return this.map_constant_name_to_value.set(e,t),this}build(){return this._init_shader_module(),this._init_bind_group_layout(),this._init_pipeline_layout(),new de(this._init_pipeline())}_init_shader_module(){this.shader_module=this.device.createShaderModule({label:`${this.kernel_name}ShaderModule`,code:this.shader_source})}_init_bind_group_layout(){const e=[];new H(this.shader_source).map_bind_group_index_to_bind_group_layout_entry_list.forEach((_,a)=>{e.push(a),this.bind_group_layout_list.push(this.device.createBindGroupLayout({label:`${this.kernel_name}_BindGroupLayout_${a}`,entries:_}))});const r=Array.from({length:e.length},(_,a)=>a);r.sort((_,a)=>e[_]-e[a]);const i=[];r.forEach((_,a)=>{i[a]=this.bind_group_layout_list[_]}),this.bind_group_layout_list=i}_init_pipeline_layout(){this.pipeline_layout=this.device.createPipelineLayout({label:`${this.kernel_name}_PipelineLayout`,bindGroupLayouts:this.bind_group_layout_list})}_init_pipeline(){if(this.pipeline_layout===void 0)throw new Error("KernelBuilder: undefined pipeline layout. have you called `this._init_pipeline_layout()` first?");if(this.shader_module===void 0)throw new Error("KernelBuilder: undefined shader module. have you called `this._init_shader_module()` first?");return this.device.createComputePipeline({label:`${this.kernel_name}_Pipeline`,layout:this.pipeline_layout,compute:{module:this.shader_module,entryPoint:this.shader_entry_point,constants:Object.fromEntries(this.map_constant_name_to_value)}})}}class m{buffer_entries=[];device;bind_group_name;constructor(e,t){this.device=e,this.bind_group_name=t}create_then_add_buffer(e,t,r,i){const _=C(this.device,e,r,i);return this.buffer_entries.push({name:e,binding_point:t,buffer:_}),this}create_then_add_buffer_init_u32(e,t,r,i){const _=ue(this.device,e,r,i);return this.buffer_entries.push({name:e,binding_point:t,buffer:_}),this}add_buffer(e,t,r){return this.buffer_entries.push({name:e,binding_point:t,buffer:r}),this}build_raw(e,t){const r=new fe(this.device);this.buffer_entries.length===0&&console.warn(`[BindGroupBuilder (${this.bind_group_name})] no buffer added to current bind group!`);const i=new Set;for(const a of this.buffer_entries)i.has(a.binding_point)&&console.error("duplicate binding point detected!"),i.add(a.binding_point),a.buffer instanceof GPUBuffer&&r.map_buffer_name_to_buffer_object.set(a.name,a.buffer);const _=[];for(const a of this.buffer_entries)a.buffer instanceof GPUBuffer?_.push({binding:a.binding_point,resource:{buffer:a.buffer}}):_.push({binding:a.binding_point,resource:a.buffer});return r.bind_group_object=this.device.createBindGroup({label:this.bind_group_name,layout:e.getBindGroupLayout(t??0),entries:_}),r}build(e,t){return this.build_raw(e.pipeline,t)}}var R=typeof Float32Array<"u"?Float32Array:Array;function h(){var n=new R(3);return R!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n}function E(n,e,t){var r=new R(3);return r[0]=n,r[1]=e,r[2]=t,r}function G(n,e,t){return n[0]=e[0]+t[0],n[1]=e[1]+t[1],n[2]=e[2]+t[2],n}function me(n,e,t){return n[0]=e[0]-t[0],n[1]=e[1]-t[1],n[2]=e[2]-t[2],n}function v(n,e,t){return n[0]=e[0]*t,n[1]=e[1]*t,n[2]=e[2]*t,n}function q(n,e){var t=e[0],r=e[1],i=e[2],_=t*t+r*r+i*i;return _>0&&(_=1/Math.sqrt(_)),n[0]=e[0]*_,n[1]=e[1]*_,n[2]=e[2]*_,n}function F(n,e,t){var r=e[0],i=e[1],_=e[2],a=t[0],o=t[1],s=t[2];return n[0]=i*s-_*o,n[1]=_*a-r*s,n[2]=r*o-i*a,n}var Y=me;(function(){var n=h();return function(e,t,r,i,_,a){var o,s;for(t||(t=3),r||(r=0),i?s=Math.min(i*t+r,e.length):s=e.length,o=r;o<s;o+=t)n[0]=e[o],n[1]=e[o+1],n[2]=e[o+2],_(n,n,a),e[o]=n[0],e[o+1]=n[1],e[o+2]=n[2];return e}})();const ve=32,we=90/180*Math.PI,j=1,M=E(0,2,3),xe=E(0,0,0),K=.001,Se=E(.48,.82,1),Pe=K,Ge=100,ke=Math.PI;function w(){return`
// ===========
//  constants
// ===========

const EPS = ${K};
const PI = ${ke};
// LESSON (260307): always set color in linear space.
// but most tools give us srgb-encoded values.
// so do the conversion first.
const SKY_COLOR = vec3f(${Se});
const RAY_NEAR_THRESHOLD = ${Pe};
const RAY_FAR_THRESHOLD = ${Ge};

// =========
//  structs
// =========

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

struct Sphere {
  center: vec3f,
  radius: f32,
}

struct IndirectArgs {
  dispatch_x: u32,
  dispatch_y: u32,
  dispatch_z: u32,
}

struct DiffuseMaterial {
  albedo: vec3f,
}

struct MetalMaterial {
  albedo: vec3f,
  fuzziness: f32,
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
// NOTE: each function returns new ray's direction, which should be normalized (here)
// callers should always expect to get a noramlized ray direction

fn evaluate_diffuse(normal_norm: vec3f, hit_point: vec3f, seed: f32) -> vec3f {
  // TODO: check if this is lambertian, need a proof
  let res_ray_direction = normal_norm + rand_unit_sphere_shell(seed);
  return normalize(select(-res_ray_direction, res_ray_direction, dot(res_ray_direction, normal_norm) >= 0.0));
}

fn evaluate_metal(in_ray_dirction: vec3f, normal_norm: vec3f, hit_point: vec3f) -> vec3f {
  let res_ray_direction = reflect(in_ray_dirction, normal_norm);
  return normalize(res_ray_direction);
}
`}function Be(){return`
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
`}function ze(){return`
@group(0) @binding(0) var<storage, read> in_next_ray_array_length: u32;
@group(0) @binding(1) var<storage, read_write> out_prev_ray_array_length: u32;
@group(0) @binding(2) var<storage, read_write> out_indirect_args: IndirectArgs;

@compute
@workgroup_size(1, 1, 1)
fn compute() {
    out_prev_ray_array_length = 0u;
    out_indirect_args = IndirectArgs((in_next_ray_array_length + 127u) / 128u, 1u, 1u);
}
`}function Ae(){return`
@group(0) @binding(0) var<storage, read> in_ray_array_length: u32;
@group(0) @binding(1) var<storage, read> in_ray_array: array<Ray>;
@group(0) @binding(2) var<storage, read> in_sphere_array: array<Sphere>;
@group(0) @binding(3) var<storage, read> in_diffuse_material_array: array<DiffuseMaterial>;
@group(0) @binding(4) var<storage, read_write> out_color_buffer: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> out_ray_array_length: atomic<u32>;
@group(0) @binding(6) var<storage, read_write> out_ray_array: array<Ray>;

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

    let sphere_array_length = i32(arrayLength(&in_sphere_array));
    for (var i = 0; i < sphere_array_length; i++) {
      let t = hit_test_sphere(ray, in_sphere_array[i]);
      if t < RAY_NEAR_THRESHOLD || t > RAY_FAR_THRESHOLD {
        continue;
      }
      if t < min_t {
        min_t = t;
        hit_object_id = i;
      }
    }

    if hit_object_id >= 0 {
      let sphere = in_sphere_array[hit_object_id];
      let material = in_diffuse_material_array[hit_object_id];

      let write_idx = atomicAdd(&out_ray_array_length, 1u);
      let hit_point = get_hit_point(ray, min_t);
      let normal_norm = sphere_get_normal_norm(ray, sphere, hit_point);
      let diffuse_ray_direction_norm = evaluate_diffuse(normal_norm, hit_point, f32(write_idx) * min_t);

      out_ray_array[write_idx] = Ray(hit_point + (EPS * normal_norm), diffuse_ray_direction_norm, ray.pixel_offset, ray.weight * material.albedo);
    } else {
      out_color_buffer[ray.pixel_offset] += vec4f(SKY_COLOR * ray.weight, 1.0);
    }
  }
}
`}function Ee(){return`
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
`}function N(){return`
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
`}class Me{map_event_to_callback=new Map;active_event_list=[];event_write_idx=0;emit(e){this.event_write_idx<this.active_event_list.length?(this.active_event_list[this.event_write_idx]=e,this.event_write_idx++):this.active_event_list.push(e)}listen(e,t){const r=this.map_event_to_callback.get(e)??[];r.push(t),this.map_event_to_callback.set(e,r)}process(){for(let e=0;e<this.event_write_idx;e++){const t=this.map_event_to_callback.get(this.active_event_list[e])??[];for(const r of t)r()}this.event_write_idx=0}}let k,u,V,U,g,y,J,T,D,B,O,z,Q,$,A,L,Z,x;async function Re(){const n=await navigator.gpu.requestAdapter();if(n===null){console.error("failed to initialize WebGPU!");return}const e=await n.requestDevice({requiredLimits:{maxBufferSize:n.limits.maxBufferSize,maxStorageBufferBindingSize:n.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:n.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:n.limits.maxComputeWorkgroupSizeX,maxStorageBuffersPerShaderStage:n.limits.maxStorageBuffersPerShaderStage},requiredFeatures:["subgroups"]});if(e===null){console.error("failed to initialize WebGPU!");return}u=e,U=navigator.gpu.getPreferredCanvasFormat();const t=document.querySelector("canvas");if(t===null)throw new Error("could not find canvas element. please check index.html!");const r=t.getContext("webgpu");if(r===null){console.error("failed to initialize WebGPU!");return}r.configure({device:u,format:U}),V=r,console.info("successfully initialized WebGPU 🎉")}function Ue(){return x=new H(w()),k=new Me,!0}function De(){const n=g/y,e=h();Y(e,xe,M),q(e,e);const t=h();F(t,e,E(0,1,0)),q(t,t);const r=h();F(r,e,t);const i=2*Math.tan(we/2)*j,_=i*n,a=h();v(a,t,_);const o=h();v(o,r,i);const s=h();v(s,a,1/g);const d=h();v(d,o,1/y);const f=h(),l=h();v(l,e,j),G(f,M,l),G(l,a,o),v(l,l,.5),Y(f,f,l);const c=h();G(l,s,d),v(l,l,.5),G(c,f,l);const p=x.get_struct("SceneInfo");return p.set_field("pixel00",c).set_field("width",g).set_field("height",y).set_field("viewport_u_base",s).set_field("viewport_v_base",d).set_field("eye",M),p.data}function ee(){const n=document.querySelector("canvas");if(n===null)throw new Error("could not find canvas element. please check index.html!");const e=window.devicePixelRatio;n.width=Math.floor(e*n.clientWidth),n.height=Math.floor(e*n.clientHeight),g=n.width,y=n.height,J=g*y}function Oe(){T=new P(u,"gen ray kernel",w()+Be(),"compute").build(),B=new P(u,"prep hit test kernel",w()+ze(),"compute").build(),z=new P(u,"hit test kernel",w()+Ae(),"compute").build(),$=new P(u,"filter kernel",w()+Ee(),"compute").build();const n=u.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),e=u.createPipelineLayout({bindGroupLayouts:[n]});L=u.createRenderPipeline({layout:e,vertex:{module:u.createShaderModule({code:w()+N()}),entryPoint:"vertex"},fragment:{module:u.createShaderModule({code:w()+N()}),entryPoint:"fragment",targets:[{format:U,writeMask:GPUColorWrite.ALL}]},primitive:{topology:"triangle-strip"}})}function te(){const n=De(),e=oe(u,"scene info",n.byteLength);u.queue.writeBuffer(e,0,n);const t=4,i=x.get_struct_array("Sphere",t).set_field(0,"center",[0,.5,1-1*Math.sqrt(3)]).set_field(0,"radius",.5).set_field(1,"center",[0,-1e4,0]).set_field(1,"radius",1e4).set_field(2,"center",[1,.75,1]).set_field(2,"radius",.75).set_field(3,"center",[-1,.3,1]).set_field(3,"radius",.3).data,_=b(u,"sphere array",i.byteLength);u.queue.writeBuffer(_,0,i);const o=x.get_struct_array("DiffuseMaterial",t).set_field(0,"albedo",[1,0,0]).set_field(1,"albedo",[.5,.5,.5]).set_field(2,"albedo",[0,1,0]).set_field(3,"albedo",[0,0,1]).data,s=b(u,"diffuse material array",o.byteLength);u.queue.writeBuffer(s,0,o);const d=b(u,"color buffer",16*g*y),f=se(u,"hit test indirect arg",12),l=x.get_struct("Ray").size_bytes,c=b(u,"ray array length ping",4),p=b(u,"ray array ping",l*g*y),S=b(u,"ray array length pong",4),W=b(u,"ray array pong",l*g*y),re=le(u,"frame index",0);D=new m(u,"gen ray kernel bind group").add_buffer("in_scene_info",0,e).add_buffer("out_ray_array_length",1,c).add_buffer("out_ray_array",2,p).add_buffer("out_frame_index",3,re).build(T);const ie=new m(u,"prep hit test kernel bind group ping").add_buffer("in_next_ray_array_length",0,c).add_buffer("out_prev_ray_array_length",1,S).add_buffer("out_indirect_args",2,f).build(B),ne=new m(u,"prep hit test kernel bind group pong").add_buffer("in_next_ray_array_length",0,S).add_buffer("out_prev_ray_array_length",1,c).add_buffer("out_indirect_args",2,f).build(B);O=[ie,ne];const _e=new m(u,"hit test kernel bind group ping").add_buffer("in_ray_array_length",0,c).add_buffer("in_ray_array",1,p).add_buffer("in_sphere_array",2,_).add_buffer("in_diffuse_material_array",3,s).add_buffer("out_color_buffer",4,d).add_buffer("out_ray_array_length",5,S).add_buffer("out_ray_array",6,W).build(z),ae=new m(u,"hit test kernel bind group pong").add_buffer("in_ray_array_length",0,S).add_buffer("in_ray_array",1,W).add_buffer("in_sphere_array",2,_).add_buffer("in_diffuse_material_array",3,s).add_buffer("out_color_buffer",4,d).add_buffer("out_ray_array_length",5,c).add_buffer("out_ray_array",6,p).build(z);Q=[_e,ae],A=new m(u,"filter kernel bind group").add_buffer("in_frame_index",0,D.get_buffer("out_frame_index")).add_buffer("in_color_buffer",1,d).create_then_add_buffer("out_filtered_color_buffer",2,GPUBufferUsage.STORAGE,16*g*y).build($),Z=new m(u,"blit bind group").add_buffer("in_scene_info",0,e).add_buffer("in_filtered_color_buffer",1,A.get_buffer("out_filtered_color_buffer")).build_raw(L)}function Ce(){k.listen("canvas-size-changed",()=>{ee(),te()});let n;addEventListener("resize",()=>{n&&clearTimeout(n),n=setTimeout(()=>{k.emit("canvas-size-changed")},100)})}function Ie(){function n(e){k.process();const t=O[0].get_buffer("out_indirect_args"),r=u.createCommandEncoder();{r.clearBuffer(A.get_buffer("in_color_buffer")),r.pushDebugGroup("frame");{r.pushDebugGroup("ray generation"),T.dispatch(r,D,Math.ceil(g/16),Math.ceil(y/16),1),r.popDebugGroup(),r.pushDebugGroup("hit test");{for(let i=0;i<ve;i++)B.dispatch(r,O[i&1],1,1,1),z.dispatch_indirect(r,Q[i&1],t);r.popDebugGroup()}r.pushDebugGroup("filtering"),$.dispatch(r,A,Math.ceil(J/128),1,1),r.popDebugGroup(),r.pushDebugGroup("blit");{const i=r.beginRenderPass({colorAttachments:[{view:V.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});i.setBindGroup(0,Z.bind_group_object),i.setPipeline(L),i.draw(4,1),i.end(),r.popDebugGroup()}r.popDebugGroup()}u.queue.submit([r.finish()])}window.requestAnimationFrame(n)}window.requestAnimationFrame(n)}async function Te(){await Re(),ee(),Ue()&&(Oe(),te(),Ce(),Ie())}Te();
