(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const _ of document.querySelectorAll('link[rel="modulepreload"]'))t(_);new MutationObserver(_=>{for(const i of _)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&t(a)}).observe(document,{childList:!0,subtree:!0});function r(_){const i={};return _.integrity&&(i.integrity=_.integrity),_.referrerPolicy&&(i.referrerPolicy=_.referrerPolicy),_.crossOrigin==="use-credentials"?i.credentials="include":_.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function t(_){if(_.ep)return;_.ep=!0;const i=r(_);fetch(_.href,i)}})();function I(n,e,r,t){let _=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST;return _|=r,n.createBuffer({label:e,size:t,usage:_})}function ae(n,e,r){let t=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM;return n.createBuffer({label:e,size:r,usage:t})}function y(n,e,r){let t=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE;return n.createBuffer({label:e,size:r,usage:t})}function oe(n,e,r){let t=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE|GPUBufferUsage.INDIRECT;return n.createBuffer({label:e,size:r,usage:t})}function se(n,e,r,t){const _=I(n,e,r,4),i=new Uint32Array(1);return i[0]=t,n.queue.writeBuffer(_,0,i.buffer),_}class ue{bind_group_object;map_buffer_name_to_buffer_object=new Map;device;constructor(e){this.device=e}get_buffer(e){const r=this.map_buffer_name_to_buffer_object.get(e);return r||console.error(`BindGroup: buffer "${e}" does not exist in this bind group!`),r}set_buffer_size(e,r){let t=this.get_buffer(e);const _=t.size;if(r>_){const i=I(this.device,t.label,t.usage,r);t.destroy(),t=i}}}class fe{pipeline;constructor(e){this.pipeline=e}get_bind_group_layout(e){return this.pipeline.getBindGroupLayout(e)}dispatch_no_barrier(e,r,t,_,i){e.setPipeline(this.pipeline),e.setBindGroup(0,r.bind_group_object),e.dispatchWorkgroups(t,_,i)}dispatch_no_barrier_indirect(e,r,t,_){e.setPipeline(this.pipeline),e.setBindGroup(0,r.bind_group_object),e.dispatchWorkgroupsIndirect(t,_??0)}dispatch_no_barrier_multiple_bind_group(e,r,t,_,i){e.setPipeline(this.pipeline),r.forEach((a,s)=>{e.setBindGroup(s,a.bind_group_object)}),e.dispatchWorkgroups(t,_,i)}dispatch_no_barrier_multiple_bind_group_indirect(e,r,t,_){e.setPipeline(this.pipeline),r.forEach((i,a)=>{e.setBindGroup(a,i.bind_group_object)}),e.dispatchWorkgroupsIndirect(t,_??0)}dispatch(e,r,t,_,i){const a=e.beginComputePass();this.dispatch_no_barrier(a,r,t,_,i),a.end()}dispatch_indirect(e,r,t,_){const i=e.beginComputePass();this.dispatch_no_barrier_indirect(i,r,t,_),i.end()}dispatch_multiple_bind_group(e,r,t,_,i){const a=e.beginComputePass();this.dispatch_no_barrier_multiple_bind_group(a,r,t,_,i),a.end()}dispatch_multiple_bind_group_indirect(e,r,t,_){const i=e.beginComputePass();this.dispatch_no_barrier_multiple_bind_group_indirect(i,r,t,_),i.end()}}const S={u32:4,f32:4,vec2u:8,vec2f:8,vec3f:12,vec4f:16},P={u32:4,f32:4,vec2u:8,vec2f:8,vec3f:16,vec4f:16},de={u32:1,f32:1,vec2u:2,vec2f:2,vec3f:3,vec4f:4},ce={u32:"integer",f32:"float",vec2u:"integer",vec2f:"float",vec3f:"float",vec4f:"float"},le=new Map([["u32","u32"],["f32","f32"],["vec2u","vec2u"],["vec2<u32>","vec2u"],["vec2f","vec2f"],["vec2<f32>","vec2f"],["vec3f","vec3f"],["vec3<f32>","vec3f"],["vec4f","vec4f"],["vec4<f32>","vec4f"]]);class pe{shader_struct=new L;constructor(e){this.shader_struct.name=e}add_field(e,r,t){return this.shader_struct._map_field_name_to_field_type.set(e,r),this.shader_struct._map_field_name_to_field_offset.set(e,t),this}build(e){return this.shader_struct._data=new ArrayBuffer(e),this.shader_struct}}class L{name;_map_field_name_to_field_type=new Map;_map_field_name_to_field_offset=new Map;_data;copy(e=!0){const r=new L;return r._map_field_name_to_field_type=new Map(this._map_field_name_to_field_type),r._map_field_name_to_field_offset=new Map(this._map_field_name_to_field_offset),e&&(r._data=new ArrayBuffer(this.size_bytes)),r}set_field(e,r,t=0){const _=this._map_field_name_to_field_type.get(e);if(!_)return console.warn(`ShaderStruct: field "${e}" does not exist in shader struct "${this.name}"`),this;let i;typeof r=="number"?i=[r]:i=r;const a=de[_];if(a!=i.length)return i.length==1?console.warn(`ShaderStruct: field "${e}" has ${a} components, but only "${i.length}" component is given`):console.warn(`ShaderStruct: field "${e}" has ${a} components, but "${i.length}" components are given`),this;const s=(t+this._map_field_name_to_field_offset.get(e))/4;return ce[_]=="integer"?new Uint32Array(this._data).set(i,s):new Float32Array(this._data).set(i,s),this}get size_bytes(){return this._data.byteLength}get data(){return this._data}}class he{shader_struct;_data;_length;_stride;constructor(e,r){this._length=r,this._stride=e.size_bytes,this._data=new ArrayBuffer(r*this._stride),this.shader_struct=e.copy(!1),this.shader_struct._data=this._data}set_field(e,r,t){return e>=this.length?(console.warn(`ShaderStructArray: struct_index is out of bounds, given ${e}, max allowed is ${this.length}`),this):(this.shader_struct.set_field(r,t,e*this._stride),this)}get length(){return this._length}get data(){return this._data}}class K{map_bind_group_index_to_bind_group_layout_entry_list=new Map;map_struct_name_to_shader_struct=new Map;constructor(e){const r=/^\s*@group\((\d)\)\s*@binding\((\d+)\)\s*var<([\w,\s]+)>/gm;let t;for(;(t=r.exec(e))!==null;){const i=+t[1],a=+t[2],s=t[3];let u;s.includes("uniform")?u="uniform":s.includes("read_write")?u="storage":u="read-only-storage";const d=this.map_bind_group_index_to_bind_group_layout_entry_list.get(i)??[];d.push({binding:a,visibility:GPUShaderStage.COMPUTE,buffer:{type:u}}),this.map_bind_group_index_to_bind_group_layout_entry_list.set(i,d)}const _=/struct\s+(\w+)\s*{([^}]+\n+)}/gm;for(;(t=_.exec(e))!==null;){const i=t[1],a=t[2],s=new pe(i);let u=!0,d=0,l=0,f=0,c=0;const b=/(\w+)\s*:\s*([\w<>]+)/gm;let x;for(;(x=b.exec(a))!==null;){const G=x[1],k=le.get(x[2]);switch(k){case"u32":{l=S.u32,c=P.u32;break}case"f32":{l=S.f32,c=P.f32;break}case"vec2u":{l=S.vec2u,c=P.vec2u;break}case"vec2f":{l=S.vec2f,c=P.vec2f;break}case"vec3f":{l=S.vec3f,c=P.vec3f;break}case"vec4f":{l=S.vec4f,c=P.vec4f;break}default:{console.warn(`ShaderReflector: detected unsupported data type "${k}" (field: "${G}")`),console.warn(`ShaderReflector: struct "${i}" won't be reflected`),u=!1;break}}if(!u)break;c>f&&(f=c),d=Math.ceil(d/c)*c,s.add_field(G,k,d),d+=l}u&&(d=Math.ceil(d/f)*f,this.map_struct_name_to_shader_struct.set(i,s.build(d)))}}get_struct(e){const r=this.map_struct_name_to_shader_struct.get(e);return r||console.error(`ShaderReflector: the schema of struct "${e}" does not exist in this shader!`),r.copy()}get_struct_array(e,r){const t=this.get_struct(e);return new he(t,r)}}class M{shader_module;pipeline_layout;bind_group_layout_list=[];map_constant_name_to_value=new Map;device;kernel_name;shader_source;shader_entry_point;constructor(e,r,t,_){this.device=e,this.kernel_name=r,this.shader_source=t,this.shader_entry_point=_}add_constant(e,r){return this.map_constant_name_to_value.set(e,r),this}build(){return this._init_shader_module(),this._init_bind_group_layout(),this._init_pipeline_layout(),new fe(this._init_pipeline())}_init_shader_module(){this.shader_module=this.device.createShaderModule({label:`${this.kernel_name}ShaderModule`,code:this.shader_source})}_init_bind_group_layout(){const e=[];new K(this.shader_source).map_bind_group_index_to_bind_group_layout_entry_list.forEach((i,a)=>{e.push(a),this.bind_group_layout_list.push(this.device.createBindGroupLayout({label:`${this.kernel_name}_BindGroupLayout_${a}`,entries:i}))});const t=Array.from({length:e.length},(i,a)=>a);t.sort((i,a)=>e[i]-e[a]);const _=[];t.forEach((i,a)=>{_[a]=this.bind_group_layout_list[i]}),this.bind_group_layout_list=_}_init_pipeline_layout(){this.pipeline_layout=this.device.createPipelineLayout({label:`${this.kernel_name}_PipelineLayout`,bindGroupLayouts:this.bind_group_layout_list})}_init_pipeline(){return this.device.createComputePipeline({label:`${this.kernel_name}_Pipeline`,layout:this.pipeline_layout,compute:{module:this.shader_module,entryPoint:this.shader_entry_point,constants:Object.fromEntries(this.map_constant_name_to_value)}})}}class m{buffer_entries=[];device;bind_group_name;constructor(e,r){this.device=e,this.bind_group_name=r}create_then_add_buffer(e,r,t,_){const i=I(this.device,e,t,_);return this.buffer_entries.push({name:e,binding_point:r,buffer:i}),this}create_then_add_buffer_init_u32(e,r,t,_){const i=se(this.device,e,t,_);return this.buffer_entries.push({name:e,binding_point:r,buffer:i}),this}add_buffer(e,r,t){return this.buffer_entries.push({name:e,binding_point:r,buffer:t}),this}build_raw(e,r){const t=new ue(this.device);this.buffer_entries.length===0&&console.warn(`[BindGroupBuilder (${this.bind_group_name})] no buffer added to current bind group!`);const _=new Set;for(const a of this.buffer_entries)_.has(a.binding_point)&&console.error("duplicate binding point detected!"),_.add(a.binding_point),a.buffer instanceof GPUBuffer&&t.map_buffer_name_to_buffer_object.set(a.name,a.buffer);const i=[];for(const a of this.buffer_entries)a.buffer instanceof GPUBuffer?i.push({binding:a.binding_point,resource:{buffer:a.buffer}}):i.push({binding:a.binding_point,resource:a.buffer});return t.bind_group_object=this.device.createBindGroup({label:this.bind_group_name,layout:e.getBindGroupLayout(r??0),entries:i}),t}build(e,r){return this.build_raw(e.pipeline,r)}}var E=typeof Float32Array<"u"?Float32Array:Array;function p(){var n=new E(3);return E!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n}function W(n,e,r){var t=new E(3);return t[0]=n,t[1]=e,t[2]=r,t}function R(n,e,r){return n[0]=e[0]+r[0],n[1]=e[1]+r[1],n[2]=e[2]+r[2],n}function ge(n,e,r){return n[0]=e[0]-r[0],n[1]=e[1]-r[1],n[2]=e[2]-r[2],n}function v(n,e,r){return n[0]=e[0]*r,n[1]=e[1]*r,n[2]=e[2]*r,n}function Y(n,e){var r=e[0],t=e[1],_=e[2],i=r*r+t*t+_*_;return i>0&&(i=1/Math.sqrt(i)),n[0]=e[0]*i,n[1]=e[1]*i,n[2]=e[2]*i,n}function j(n,e,r){var t=e[0],_=e[1],i=e[2],a=r[0],s=r[1],u=r[2];return n[0]=_*u-i*s,n[1]=i*a-t*u,n[2]=t*s-_*a,n}var N=ge;(function(){var n=p();return function(e,r,t,_,i,a){var s,u;for(r||(r=3),t||(t=0),_?u=Math.min(_*r+t,e.length):u=e.length,s=t;s<u;s+=r)n[0]=e[s],n[1]=e[s+1],n[2]=e[s+2],i(n,n,a),e[s]=n[0],e[s+1]=n[1],e[s+2]=n[2];return e}})();const be=32,ye=90/180*Math.PI,X=1,O=W(0,3,3),me=W(0,0,0),w=`// ===========\r
//  constants\r
// ===========\r
const EPS = 0.001;\r
const PI = 3.141592653;\r
const SKY_COLOR = vec3f(143.0, 233.0, 255.0) / 255.0;\r
const RAY_NEAR_THRESHOLD = EPS;\r
const RAY_FAR_THRESHOLD = 100.0;\r
\r
// =========\r
//  structs\r
// =========\r
struct SceneInfo { // 64\r
  pixel00: vec3f, // 0 -> 12\r
  width: u32, // 12 -> 4\r
  viewport_u_base: vec3f, // 16 -> 12\r
  height: u32, // 28 -> 4\r
  viewport_v_base: vec3f, // 32 -> 16 (12 + 4)\r
  eye: vec3f // 48 -> 16 (12 + 4)\r
}\r
\r
struct Ray { // 48\r
  origin: vec3f, // 0 -> 16 (12 + 4)\r
  direction_norm: vec3f, // 16 -> 12;\r
  pixel_offset: u32, // 28 -> 4\r
  weight: vec3f, // 32 -> 16 (12 + 4)\r
}\r
\r
struct Sphere { // 16\r
  center: vec3f, // 0 -> 12\r
  radius: f32, // 12 -> 4\r
}\r
\r
struct IndirectArgs { // 12\r
  dispatch_x: u32, // 0 -> 4\r
  dispatch_y: u32, // 4 -> 8\r
  dispatch_z: u32, // 8 -> 12\r
}\r
\r
struct DiffuseMaterial { // 16\r
  albedo: vec3f // 0 -> 16 (12 + 4)\r
}\r
\r
// ========\r
//  random\r
// ========\r
\r
var<private> seed_bias = 0.0;\r
\r
// from: https://marktension.nl/blog/my_favorite_wgsl_random_func_so_far/\r
fn rand(seed: f32) -> f32 {\r
  var x = bitcast<u32>(seed_bias * 233.33 + seed);\r
\r
  // A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm for u32.\r
  x += (x << 10u);\r
  x ^= (x >> 6u);\r
  x += (x << 3u);\r
  x ^= (x >> 11u);\r
  x += (x << 15u);\r
\r
  // Construct a float with half-open range [0:1] using low 23 bits.\r
  let ieee_mantissa = 0x007FFFFFu;   // binary32 mantissa bitmask\r
  let ieee_one = 0x3F800000u;        // 1.0 in IEEE binary32\r
  x &= ieee_mantissa;                // Keep only mantissa bits (fractional part)\r
  x |= ieee_one;                     // Add fractional part to 1.0\r
\r
  let res = bitcast<f32>(x);         // Range [1:2]\r
  seed_bias = res - 1.0;             // Range [0:1]\r
  return seed_bias;\r
}\r
\r
// uniform [-0.5, 0.5]^2\r
fn rand_unit_square(seed: f32) -> vec2f {\r
  let x = rand(seed);\r
  return vec2f(x, rand(x)) - 0.5;\r
}\r
\r
// NOTE: uniform on the unit sphere's shell (not uniform inside the the unit sphere volume)\r
// That is, the result is always an unit vector\r
fn rand_unit_sphere_shell(seed: f32) -> vec3f {\r
  let y = 2.0 * rand(seed) - 1.0;\r
  let phi = 2.0 * PI * rand(seed + 1.0);\r
  let r = sqrt(1.0 - y * y);\r
  return vec3f(r * cos(phi), y, r * sin(phi));\r
}\r
\r
// ==========\r
//  hit test\r
// ==========\r
\r
fn hit_test_sphere(ray: Ray, sphere: Sphere) -> f32 {\r
  let delta = sphere.center - ray.origin;\r
  let a = dot(ray.direction_norm, ray.direction_norm);\r
  let b = -2.0 * dot(ray.direction_norm, delta);\r
  let c = dot(delta, delta) - (sphere.radius * sphere.radius);\r
\r
  let det = b * b - 4.0 * a * c;\r
  if det >= 0.0 {\r
    let det_sqrt = sqrt(det);\r
    let t1 = (-b - det_sqrt) / (2.0 * a);\r
    let t2 = (-b + det_sqrt) / (2.0 * a);\r
\r
    if t1 >= 0.0 {\r
      return t1;\r
    } else if t2 >= 0.0 {\r
      return t2;\r
    }\r
  }\r
\r
  return -1.0; // if miss, return a negative value\r
}\r
\r
fn get_hit_point(ray: Ray, t: f32) -> vec3f {\r
  return ray.origin + (ray.direction_norm * t);\r
}\r
\r
// ============\r
//  get normal\r
// ============\r
// NOTE: all returned normals should be normalized\r
\r
fn sphere_get_normal_norm(ray: Ray, sphere: Sphere, hit_point: vec3f) -> vec3f {\r
  let delta = hit_point - sphere.center;\r
  return select(-delta, delta, dot(delta, ray.direction_norm) <= 0.0) / sphere.radius;\r
}\r
\r
// ===================\r
//  evaluate material\r
// ===================\r
// NOTE: each function returns new ray's direction, which should be normalized\r
\r
fn evaluate_diffuse(normal: vec3f, hit_point: vec3f, seed: f32) -> vec3f {\r
  let res_ray_direction = rand_unit_sphere_shell(seed);\r
  return select(-res_ray_direction, res_ray_direction, dot(res_ray_direction, normal) >= 0.0);\r
}\r
\r
// fn evaluate_metal(in_ray_dirction: vec3f, normal_norm: vec3f, hit_point: vec3f) -> vec3f {\r
//   let res_ray_direction = reflect(in_ray_dirction, normal_norm);\r
//   return normalize(res_ray_direction);\r
// }\r
`,ve=`@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;\r
@group(0) @binding(1) var<storage, read_write> out_ray_array_length: u32;\r
@group(0) @binding(2) var<storage, read_write> out_ray_array: array<Ray>;\r
@group(0) @binding(3) var<storage, read_write> out_frame_index: u32;\r
\r
const WG_DIM_X = 16u;\r
const WG_DIM_Y = 16u;\r
\r
@compute\r
@workgroup_size(WG_DIM_X, WG_DIM_Y, 1)\r
fn compute(\r
  @builtin(workgroup_id) workgroup_id : vec3u,\r
  @builtin(local_invocation_id) local_id: vec3u\r
) {\r
  let x = (workgroup_id.x * WG_DIM_X) + local_id.x;\r
  let y = (workgroup_id.y * WG_DIM_Y) + local_id.y;\r
\r
  let scene_info = in_scene_info;\r
  let pixel00 = scene_info.pixel00;\r
  let viewport_u_base = scene_info.viewport_u_base;\r
  let viewport_v_base = scene_info.viewport_v_base;\r
  let eye = scene_info.eye;\r
  let width = scene_info.width;\r
  let height = scene_info.height;\r
\r
  let ray_array_offset = y * width + x;\r
  if ray_array_offset == 0u {\r
    out_ray_array_length = width * height;\r
    out_frame_index++;\r
  }\r
\r
  if x < width && y < height {\r
    let pixel_offset = vec2f(f32(x), f32(y)) + rand_unit_square(f32(out_frame_index) * 114514.1919810 + f32(ray_array_offset));\r
    let target_pixel = pixel00 + ((viewport_u_base * pixel_offset.x) + (viewport_v_base * pixel_offset.y));\r
    let direction_norm = normalize(target_pixel - eye);\r
    let primary_ray = Ray(eye, direction_norm, ray_array_offset, vec3f(1.0));\r
    out_ray_array[ray_array_offset] = primary_ray;\r
  }\r
}\r
`,we=`@group(0) @binding(0) var<storage, read> in_next_ray_array_length: u32;\r
@group(0) @binding(1) var<storage, read_write> out_prev_ray_array_length: u32;\r
@group(0) @binding(2) var<storage, read_write> out_indirect_args: IndirectArgs;\r
\r
@compute\r
@workgroup_size(1, 1, 1)\r
fn compute() {\r
    out_prev_ray_array_length = 0u;\r
    out_indirect_args = IndirectArgs((in_next_ray_array_length + 127u) / 128u, 1u, 1u);\r
}\r
`,xe=`@group(0) @binding(0) var<storage, read> in_ray_array_length: u32;\r
@group(0) @binding(1) var<storage, read> in_ray_array: array<Ray>;\r
@group(0) @binding(2) var<storage, read> in_sphere_array: array<Sphere>;\r
@group(0) @binding(3) var<storage, read> in_diffuse_material_array: array<DiffuseMaterial>;\r
@group(0) @binding(4) var<storage, read_write> out_color_buffer: array<vec4f>;\r
@group(0) @binding(5) var<storage, read_write> out_ray_array_length: atomic<u32>;\r
@group(0) @binding(6) var<storage, read_write> out_ray_array: array<Ray>;\r
\r
const WG_DIM_X = 128u;\r
\r
@compute\r
@workgroup_size(WG_DIM_X, 1, 1)\r
fn compute(\r
  @builtin(workgroup_id) workgroup_id : vec3u,\r
  @builtin(local_invocation_index) thread_id: u32\r
) {\r
  let id = workgroup_id.x * WG_DIM_X + thread_id;\r
\r
  if id < in_ray_array_length {\r
    let ray = in_ray_array[id];\r
\r
    var min_t = 1e10;\r
    var hit_object_id = -1;\r
\r
    let sphere_array_length = i32(arrayLength(&in_sphere_array));\r
    for(var i = 0; i < sphere_array_length; i++) {\r
      let t = hit_test_sphere(ray, in_sphere_array[i]);\r
      if t < RAY_NEAR_THRESHOLD || t > RAY_FAR_THRESHOLD {\r
        continue;\r
      }\r
      if t < min_t {\r
        min_t = t;\r
        hit_object_id = i;\r
      }\r
    }\r
\r
    if hit_object_id >= 0 {\r
      let sphere = in_sphere_array[hit_object_id];\r
      let material = in_diffuse_material_array[hit_object_id];\r
\r
      let write_idx = atomicAdd(&out_ray_array_length, 1u);\r
      let hit_point = get_hit_point(ray, min_t);\r
      let normal_norm = sphere_get_normal_norm(ray, sphere, hit_point);\r
      let diffuse_ray_direction_norm = evaluate_diffuse(normal_norm, hit_point, f32(write_idx) * min_t);\r
\r
      out_ray_array[write_idx] = Ray(hit_point + EPS * normal_norm, diffuse_ray_direction_norm, ray.pixel_offset, ray.weight * material.albedo);\r
    } else {\r
      out_color_buffer[ray.pixel_offset] += vec4f(SKY_COLOR * ray.weight, 1.0);\r
    }\r
  }\r
}\r
`,Se=`@group(0) @binding(0) var<storage, read> in_frame_index: u32;\r
@group(0) @binding(1) var<storage, read> in_color_buffer: array<vec4f>;\r
@group(0) @binding(2) var<storage, read_write> out_filtered_color_buffer: array<vec4f>;\r
\r
const WG_DIM_X = 128u;\r
\r
@compute\r
@workgroup_size(WG_DIM_X, 1, 1)\r
fn compute(\r
  @builtin(workgroup_id) workgroup_id : vec3u,\r
  @builtin(local_invocation_index) thread_id: u32\r
) {\r
  let id = workgroup_id.x * WG_DIM_X + thread_id;\r
  let n = arrayLength(&in_color_buffer);\r
  if id < n {\r
    let curr = in_color_buffer[id];\r
    let prev = out_filtered_color_buffer[id];\r
    out_filtered_color_buffer[id] = mix(prev, curr, 1.0 / f32(in_frame_index));\r
  }\r
}\r
`,H=`@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;\r
@group(0) @binding(1) var<storage, read> in_filtered_color_buffer: array<vec4f>;\r
\r
struct VSOutput {\r
  @builtin(position) position: vec4f\r
}\r
\r
@vertex\r
fn vertex(@builtin(vertex_index) vertex_index: u32) -> VSOutput {\r
  var vs_output: VSOutput;\r
\r
  let pos_x = select(1.0, -1.0, (vertex_index & 1u) == 0u);\r
  let pos_y = select(1.0, -1.0, ((vertex_index >> 1u) & 1u) == 1u);\r
  vs_output.position = vec4f(pos_x, pos_y, 0.0, 1.0);\r
\r
  return vs_output;\r
}\r
\r
@fragment\r
fn fragment(@builtin(position) position: vec4f) -> @location(0) vec4f {\r
  let width = in_scene_info.width;\r
  let pixel_offset = u32(position.y) * width + u32(position.x);\r
  return in_filtered_color_buffer[pixel_offset];\r
}\r
`;class Pe{map_event_to_callback=new Map;active_event_list=[];event_write_idx=0;emit(e){this.event_write_idx<this.active_event_list.length?(this.active_event_list[this.event_write_idx]=e,this.event_write_idx++):this.active_event_list.push(e)}listen(e,r){const t=this.map_event_to_callback.get(e)??[];t.push(r),this.map_event_to_callback.set(e,t)}process(){for(let e=0;e<this.event_write_idx;e++){const r=this.map_event_to_callback.get(this.active_event_list[e])??[];for(const t of r)t()}this.event_write_idx=0}}let A,o,V,J,h,g,Q,q,T,U,C,z,Z,$,D,F,ee,B;async function Ge(){const n=await navigator.gpu.requestAdapter();if(!n){console.error("failed to initialize WebGPU!");return}const e=n.features.has("bgra8unorm-storage"),r=await n.requestDevice({requiredLimits:{maxBufferSize:n.limits.maxBufferSize,maxStorageBufferBindingSize:n.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:n.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:n.limits.maxComputeWorkgroupSizeX,maxStorageBuffersPerShaderStage:n.limits.maxStorageBuffersPerShaderStage},requiredFeatures:e?["bgra8unorm-storage","subgroups"]:["subgroups"]});if(!r){console.error("failed to initialize WebGPU!");return}o=r;const t=e?navigator.gpu.getPreferredCanvasFormat():"rgba8unorm";J=t;const i=document.querySelector("canvas").getContext("webgpu");if(!i){console.error("failed to initialize WebGPU!");return}i.configure({device:o,format:t,usage:GPUTextureUsage.RENDER_ATTACHMENT}),V=i,console.info("successfully initialized WebGPU 🎉")}function ke(){return B=new K(w),A=new Pe,!0}function Be(){const n=h/g,e=p();N(e,me,O),Y(e,e);const r=p();j(r,e,W(0,1,0)),Y(r,r);const t=p();j(t,e,r);const _=2*Math.tan(ye/2)*X,i=_*n,a=p();v(a,r,i);const s=p();v(s,t,_);const u=p();v(u,a,1/h);const d=p();v(d,s,1/g);const l=p(),f=p();v(f,e,X),R(l,O,f),R(f,a,s),v(f,f,.5),N(l,l,f);const c=p();R(f,u,d),v(f,f,.5),R(c,l,f);const b=B.get_struct("SceneInfo");return b.set_field("pixel00",c).set_field("width",h).set_field("height",g).set_field("viewport_u_base",u).set_field("viewport_v_base",d).set_field("eye",O),b.data}function re(){const n=document.querySelector("canvas"),e=window.devicePixelRatio;n.width=Math.floor(e*n.clientWidth),n.height=Math.floor(e*n.clientHeight),h=n.width,g=n.height,Q=h*g}function Me(){q=new M(o,"gen ray kernel",w+ve,"compute").build(),U=new M(o,"prep hit test kernel",w+we,"compute").build(),z=new M(o,"hit test kernel",w+xe,"compute").build(),$=new M(o,"filter kernel",w+Se,"compute").build();const n=o.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),e=o.createPipelineLayout({bindGroupLayouts:[n]});F=o.createRenderPipeline({layout:e,vertex:{module:o.createShaderModule({code:w+H}),entryPoint:"vertex"},fragment:{module:o.createShaderModule({code:w+H}),entryPoint:"fragment",targets:[{format:J,writeMask:GPUColorWrite.ALL}]},primitive:{topology:"triangle-strip"}})}function te(){const n=Be(),e=ae(o,"scene info",64);o.queue.writeBuffer(e,0,n);const r=4,_=B.get_struct_array("Sphere",r).set_field(0,"center",[0,.5,1-1.5*Math.sqrt(3)]).set_field(0,"radius",.5).set_field(1,"center",[0,-1e4,0]).set_field(1,"radius",1e4).set_field(2,"center",[1.5,.5,1]).set_field(2,"radius",.5).set_field(3,"center",[-1.5,.5,1]).set_field(3,"radius",.5).data,i=y(o,"sphere array",r*16);o.queue.writeBuffer(i,0,_);const s=B.get_struct_array("DiffuseMaterial",r).set_field(0,"albedo",[1,0,0]).set_field(1,"albedo",[.5,.5,.5]).set_field(2,"albedo",[0,1,0]).set_field(3,"albedo",[0,0,1]).data,u=y(o,"diffuse material array",r*16);o.queue.writeBuffer(u,0,s);const d=B.get_struct("Ray").size_bytes,l=y(o,"color buffer",16*h*g),f=y(o,"ray array length ping",4),c=y(o,"ray array ping",d*h*g),b=y(o,"ray array length pong",4),x=y(o,"ray array pong",d*h*g),G=oe(o,"hit test indirect arg",12);T=new m(o,"gen ray kernel bind group").add_buffer("in_scene_info",0,e).add_buffer("out_ray_array_length",1,f).add_buffer("out_ray_array",2,c).create_then_add_buffer_init_u32("out_frame_index",3,GPUBufferUsage.STORAGE,0).build(q);const k=new m(o,"prep hit test kernel bind group ping").add_buffer("in_next_ray_array_length",0,f).add_buffer("out_prev_ray_array_length",1,b).add_buffer("out_indirect_args",2,G).build(U),ne=new m(o,"prep hit test kernel bind group pong").add_buffer("in_next_ray_array_length",0,b).add_buffer("out_prev_ray_array_length",1,f).add_buffer("out_indirect_args",2,G).build(U);C=[k,ne];const ie=new m(o,"hit test kernel bind group ping").add_buffer("in_ray_array_length",0,f).add_buffer("in_ray_array",1,c).add_buffer("in_sphere_array",2,i).add_buffer("in_diffuse_material_array",3,u).add_buffer("out_color_buffer",4,l).add_buffer("out_ray_array_length",5,b).add_buffer("out_ray_array",6,x).build(z),_e=new m(o,"hit test kernel bind group pong").add_buffer("in_ray_array_length",0,b).add_buffer("in_ray_array",1,x).add_buffer("in_sphere_array",2,i).add_buffer("in_diffuse_material_array",3,u).add_buffer("out_color_buffer",4,l).add_buffer("out_ray_array_length",5,f).add_buffer("out_ray_array",6,c).build(z);Z=[ie,_e],D=new m(o,"filter kernel bind group").add_buffer("in_frame_index",0,T.get_buffer("out_frame_index")).add_buffer("in_color_buffer",1,l).create_then_add_buffer("out_filtered_color_buffer",2,GPUBufferUsage.STORAGE,16*h*g).build($),ee=new m(o,"blit bind group").add_buffer("in_scene_info",0,e).add_buffer("in_filtered_color_buffer",1,D.get_buffer("out_filtered_color_buffer")).build_raw(F)}function Re(){A.listen("canvas-size-changed",()=>{re(),te()});let n;addEventListener("resize",()=>{n&&clearTimeout(n),n=setTimeout(()=>{A.emit("canvas-size-changed")},100)})}function Ae(){function n(e){A.process();const r=C[0].get_buffer("out_indirect_args"),t=o.createCommandEncoder();{t.clearBuffer(D.get_buffer("in_color_buffer")),t.pushDebugGroup("frame");{t.pushDebugGroup("ray generation"),q.dispatch(t,T,Math.ceil(h/16),Math.ceil(g/16),1),t.popDebugGroup(),t.pushDebugGroup("hit test");{for(let _=0;_<be;_++)U.dispatch(t,C[_&1],1,1,1),z.dispatch_indirect(t,Z[_&1],r);t.popDebugGroup()}t.pushDebugGroup("filtering"),$.dispatch(t,D,Math.ceil(Q/128),1,1),t.popDebugGroup(),t.pushDebugGroup("blit");{const _=t.beginRenderPass({colorAttachments:[{view:V.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});_.setBindGroup(0,ee.bind_group_object),_.setPipeline(F),_.draw(4,1),_.end(),t.popDebugGroup()}t.popDebugGroup()}o.queue.submit([t.finish()])}window.requestAnimationFrame(n)}window.requestAnimationFrame(n)}async function Ue(){await Ge(),re(),ke()&&(Me(),te(),Re(),Ae())}Ue();
