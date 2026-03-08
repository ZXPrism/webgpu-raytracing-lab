(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const _ of a.addedNodes)_.tagName==="LINK"&&_.rel==="modulepreload"&&t(_)}).observe(document,{childList:!0,subtree:!0});function r(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function t(n){if(n.ep)return;n.ep=!0;const a=r(n);fetch(n.href,a)}})();function I(i,e,r,t){let n=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST;return n|=r,i.createBuffer({label:e,size:t,usage:n})}function _e(i,e,r){const t=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM;return i.createBuffer({label:e,size:r,usage:t})}function v(i,e,r){const t=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE;return i.createBuffer({label:e,size:r,usage:t})}function oe(i,e,r){const t=GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE|GPUBufferUsage.INDIRECT;return i.createBuffer({label:e,size:r,usage:t})}function se(i,e,r,t){const n=I(i,e,r,4),a=new Uint32Array(1);return a[0]=t,i.queue.writeBuffer(n,0,a.buffer),n}class ue{bind_group_object;map_buffer_name_to_buffer_object=new Map;device;constructor(e){this.device=e}get_buffer(e){const r=this.map_buffer_name_to_buffer_object.get(e);if(r===void 0)throw new Error(`BindGroup: buffer "${e}" does not exist in this bind group!`);return r}set_buffer(e,r){if(this.map_buffer_name_to_buffer_object.has(e))this.map_buffer_name_to_buffer_object.set(e,r);else throw new Error(`BindGroup: unknown buffer name ${e}. It's forbidden to add buffers that do not relate to the bind group!`)}set_buffer_size(e,r){const t=this.get_buffer(e),n=t.size;if(r>n){const a=I(this.device,t.label,t.usage,r);this.set_buffer(e,a),t.destroy()}}}class le{pipeline;constructor(e){this.pipeline=e}get_bind_group_layout(e){return this.pipeline.getBindGroupLayout(e)}dispatch_no_barrier(e,r,t,n,a){e.setPipeline(this.pipeline),e.setBindGroup(0,r.bind_group_object),e.dispatchWorkgroups(t,n,a)}dispatch_no_barrier_indirect(e,r,t,n){e.setPipeline(this.pipeline),e.setBindGroup(0,r.bind_group_object),e.dispatchWorkgroupsIndirect(t,n??0)}dispatch_no_barrier_multiple_bind_group(e,r,t,n,a){e.setPipeline(this.pipeline),r.forEach((_,o)=>{e.setBindGroup(o,_.bind_group_object)}),e.dispatchWorkgroups(t,n,a)}dispatch_no_barrier_multiple_bind_group_indirect(e,r,t,n){e.setPipeline(this.pipeline),r.forEach((a,_)=>{e.setBindGroup(_,a.bind_group_object)}),e.dispatchWorkgroupsIndirect(t,n??0)}dispatch(e,r,t,n,a){const _=e.beginComputePass();this.dispatch_no_barrier(_,r,t,n,a),_.end()}dispatch_indirect(e,r,t,n){const a=e.beginComputePass();this.dispatch_no_barrier_indirect(a,r,t,n),a.end()}dispatch_multiple_bind_group(e,r,t,n,a){const _=e.beginComputePass();this.dispatch_no_barrier_multiple_bind_group(_,r,t,n,a),_.end()}dispatch_multiple_bind_group_indirect(e,r,t,n){const a=e.beginComputePass();this.dispatch_no_barrier_multiple_bind_group_indirect(a,r,t,n),a.end()}}const S={u32:4,f32:4,vec2u:8,vec2f:8,vec3f:12,vec4f:16},k={u32:4,f32:4,vec2u:8,vec2f:8,vec3f:16,vec4f:16},fe={u32:1,f32:1,vec2u:2,vec2f:2,vec3f:3,vec4f:4},de={u32:"integer",f32:"float",vec2u:"integer",vec2f:"float",vec3f:"float",vec4f:"float"},ce=new Map([["u32","u32"],["f32","f32"],["vec2u","vec2u"],["vec2<u32>","vec2u"],["vec2f","vec2f"],["vec2<f32>","vec2f"],["vec3f","vec3f"],["vec3<f32>","vec3f"],["vec4f","vec4f"],["vec4<f32>","vec4f"]]);class pe{_shader_struct_name;_map_field_name_to_layout_entry_index;_layout;constructor(e){this._shader_struct_name=e,this._map_field_name_to_layout_entry_index=new Map,this._layout=[]}add_field(e,r,t){if(this._map_field_name_to_layout_entry_index.has(e))throw new Error(`ShaderStructBuilder: field ${e} already exists in shader struct ${this._shader_struct_name}!`);const n=this._layout.length;if(n!==0){if(t<=this._layout[n-1].offset_bytes)throw new Error(`ShaderStructBuilder: failed to add field ${e} to shader struct ${this._shader_struct_name}: invalid field offset`)}else if(t!==0)throw new Error(`ShaderStructBuilder: failed to add field ${e} to shader struct ${this._shader_struct_name}: first field offset nonzero`);return this._map_field_name_to_layout_entry_index.set(e,n),this._layout.push({type:r,offset_bytes:t}),this}build(e){const r=new ArrayBuffer(e);return new Uint8Array(r).fill(63),new L(this._shader_struct_name,r,this._map_field_name_to_layout_entry_index,this._layout)}}class L{_name;_map_field_name_to_layout_entry_index;_layout;_data;constructor(e,r,t,n){this._name=e,this._data=r,this._map_field_name_to_layout_entry_index=t,this._layout=n}copy(e=!0){let r;return e?(r=new ArrayBuffer(this.size_bytes),new Uint8Array(r).fill(63)):r=this._data.slice(0),new L(this.name,r,structuredClone(this._map_field_name_to_layout_entry_index),structuredClone(this._layout))}set_field(e,r,t=0){const n=this._map_field_name_to_layout_entry_index.get(e);if(n===void 0)throw new Error(`ShaderStruct: field "${e}" does not exist in shader struct "${this.name}"`);const a=this._layout[n],_=a.type;let o;typeof r=="number"?o=[r]:o=r;const s=fe[_];if(s!==o.length)throw o.length===1?new Error(`ShaderStruct: field "${e}" has ${s} components, but only "${o.length}" component is given`):new Error(`ShaderStruct: field "${e}" has ${s} components, but "${o.length}" components are given`);const d=a.offset_bytes,f=(t+d)/4;return de[_]==="integer"?new Uint32Array(this._data).set(o,f):new Float32Array(this._data).set(o,f),this}_get_optimal_layout_impl_brute_force(){const e=this._layout.length,r=Array.from({length:e},()=>!1),t=Array.from({length:e},()=>-1);let n=Array.from({length:e},()=>-1),a=1061109567;function _(o){if(o===e){0<a&&(a=0,n=t);return}for(let s=0;s<e;s++)r[s]===!1&&(r[s]=!0,t[o]=s,r[s]=!1)}return _(0),Array.from({length:e},(o,s)=>this._layout[n[s]])}check_optimal_layout(){if(this._layout.length===0)return;function e(s,d){if(d.length!==s.length)return!1;const f=new Map;s.forEach(p=>{const h=p.type,g=f.get(h)??0;f.set(h,g+1)});const l=new Map;d.forEach(p=>{const h=p.type,g=l.get(h)??0;l.set(h,g+1)});let c=!0;return f.forEach((p,h)=>{const g=l.get(h);(g===void 0||g!==p)&&(c=!1)}),c}const r=this._get_optimal_layout_impl_brute_force();if(e(this._layout,r)===!1)throw new Error(`ShaderStruct (${this._name}): Bad impl of optimal layout algorithm: layout entry counts mismatch`);const t=r.length-1,n=r[t],a=Math.max(...r.map(s=>k[s.type])),_=n.offset_bytes+S[n.type],o=Math.ceil(_/a)*a;if(o>this.size_bytes)throw new Error(`ShaderStruct (${this._name}): bad impl of optimal layout algorithm: the "optimal" layout is suboptimal`);o<this.size_bytes&&(console.warn(`ShaderStruct (${this._name}): current layout is suboptimal, the suggested layout is:`),console.warn(r),console.warn(`which can save ${this.size_bytes} - ${o} = ${this.size_bytes-o} bytes`))}get name(){return this._name}get size_bytes(){return this._data.byteLength}get data(){return this._data}get layout(){return this._layout}get map_field_name_to_layout_entry_index(){return this._map_field_name_to_layout_entry_index}set override_data(e){this._data=e}}class he{shader_struct;_data;_length;_stride;constructor(e,r){this._length=r,this._stride=e.size_bytes,this._data=new ArrayBuffer(r*this._stride),new Uint8Array(this._data).fill(63),this.shader_struct=e.copy(!1),this.shader_struct.override_data=this._data}set_field(e,r,t){if(e>=this.length)throw new Error(`ShaderStructArray: struct_index is out of bounds, given ${e}, max allowed is ${this.length}`);return this.shader_struct.set_field(r,t,e*this._stride),this}get length(){return this._length}get data(){return this._data}}class V{map_bind_group_index_to_bind_group_layout_entry_list=new Map;map_struct_name_to_shader_struct=new Map;constructor(e){const r=/^\s*@group\((\d)\)\s*@binding\((\d+)\)\s*var<([\w,\s]+)>/gm;let t;for(;(t=r.exec(e))!==null;){const a=+t[1],_=+t[2],o=t[3];let s;o.includes("uniform")?s="uniform":o.includes("read_write")?s="storage":s="read-only-storage";const d=this.map_bind_group_index_to_bind_group_layout_entry_list.get(a)??[];d.push({binding:_,visibility:GPUShaderStage.COMPUTE,buffer:{type:s}}),this.map_bind_group_index_to_bind_group_layout_entry_list.set(a,d)}const n=/struct\s+(\w+)\s*{([^}]+)}/gm;for(;(t=n.exec(e))!==null;){const a=t[1],_=t[2],o=new pe(a);let s=!0,d=0,f=0,l=0,c=0;const p=/(\w+)\s*:\s*([\w<>]+)/gm;let h;for(;(h=p.exec(_))!==null;){const g=h[1],P=ce.get(h[2]);switch(P){case"u32":{f=S.u32,c=k.u32;break}case"f32":{f=S.f32,c=k.f32;break}case"vec2u":{f=S.vec2u,c=k.vec2u;break}case"vec2f":{f=S.vec2f,c=k.vec2f;break}case"vec3f":{f=S.vec3f,c=k.vec3f;break}case"vec4f":{f=S.vec4f,c=k.vec4f;break}default:{console.warn(`ShaderReflector: detected unsupported data type "${P}" (field: "${g}")`),console.warn(`ShaderReflector: struct "${a}" won't be reflected`),s=!1;break}}if(s===!1)break;if(c>l&&(l=c),d=Math.ceil(d/c)*c,P)o.add_field(g,P,d);else throw new Error("You should never see this error..This is just for passing type check. But if you do see this, you are in trouble.");d+=f}if(s){d=Math.ceil(d/l)*l;const g=o.build(d);this.map_struct_name_to_shader_struct.set(a,g)}}}get_struct(e){const r=this.map_struct_name_to_shader_struct.get(e);if(r===void 0)throw new Error(`ShaderReflector: struct "${e}" not found in shader`);return r.copy()}get_struct_array(e,r){const t=this.get_struct(e);return new he(t,r)}}class z{shader_module;pipeline_layout;bind_group_layout_list=[];map_constant_name_to_value=new Map;device;kernel_name;shader_source;shader_entry_point;constructor(e,r,t,n){this.device=e,this.kernel_name=r,this.shader_source=t,this.shader_entry_point=n}add_constant(e,r){return this.map_constant_name_to_value.set(e,r),this}build(){return this._init_shader_module(),this._init_bind_group_layout(),this._init_pipeline_layout(),new le(this._init_pipeline())}_init_shader_module(){this.shader_module=this.device.createShaderModule({label:`${this.kernel_name}ShaderModule`,code:this.shader_source})}_init_bind_group_layout(){const e=[];new V(this.shader_source).map_bind_group_index_to_bind_group_layout_entry_list.forEach((a,_)=>{e.push(_),this.bind_group_layout_list.push(this.device.createBindGroupLayout({label:`${this.kernel_name}_BindGroupLayout_${_}`,entries:a}))});const t=Array.from({length:e.length},(a,_)=>_);t.sort((a,_)=>e[a]-e[_]);const n=[];t.forEach((a,_)=>{n[_]=this.bind_group_layout_list[a]}),this.bind_group_layout_list=n}_init_pipeline_layout(){this.pipeline_layout=this.device.createPipelineLayout({label:`${this.kernel_name}_PipelineLayout`,bindGroupLayouts:this.bind_group_layout_list})}_init_pipeline(){if(this.pipeline_layout===void 0)throw new Error("KernelBuilder: undefined pipeline layout. have you called `this._init_pipeline_layout()` first?");if(this.shader_module===void 0)throw new Error("KernelBuilder: undefined shader module. have you called `this._init_shader_module()` first?");return this.device.createComputePipeline({label:`${this.kernel_name}_Pipeline`,layout:this.pipeline_layout,compute:{module:this.shader_module,entryPoint:this.shader_entry_point,constants:Object.fromEntries(this.map_constant_name_to_value)}})}}class w{buffer_entries=[];device;bind_group_name;constructor(e,r){this.device=e,this.bind_group_name=r}create_then_add_buffer(e,r,t,n){const a=I(this.device,e,t,n);return this.buffer_entries.push({name:e,binding_point:r,buffer:a}),this}create_then_add_buffer_init_u32(e,r,t,n){const a=se(this.device,e,t,n);return this.buffer_entries.push({name:e,binding_point:r,buffer:a}),this}add_buffer(e,r,t){return this.buffer_entries.push({name:e,binding_point:r,buffer:t}),this}build_raw(e,r){const t=new ue(this.device);this.buffer_entries.length===0&&console.warn(`[BindGroupBuilder (${this.bind_group_name})] no buffer added to current bind group!`);const n=new Set;for(const _ of this.buffer_entries)n.has(_.binding_point)&&console.error("duplicate binding point detected!"),n.add(_.binding_point),_.buffer instanceof GPUBuffer&&t.map_buffer_name_to_buffer_object.set(_.name,_.buffer);const a=[];for(const _ of this.buffer_entries)_.buffer instanceof GPUBuffer?a.push({binding:_.binding_point,resource:{buffer:_.buffer}}):a.push({binding:_.binding_point,resource:_.buffer});return t.bind_group_object=this.device.createBindGroup({label:this.bind_group_name,layout:e.getBindGroupLayout(r??0),entries:a}),t}build(e,r){return this.build_raw(e.pipeline,r)}}var O=typeof Float32Array<"u"?Float32Array:Array;function y(){var i=new O(3);return O!=Float32Array&&(i[0]=0,i[1]=0,i[2]=0),i}function W(i,e,r){var t=new O(3);return t[0]=i,t[1]=e,t[2]=r,t}function E(i,e,r){return i[0]=e[0]+r[0],i[1]=e[1]+r[1],i[2]=e[2]+r[2],i}function ge(i,e,r){return i[0]=e[0]-r[0],i[1]=e[1]-r[1],i[2]=e[2]-r[2],i}function x(i,e,r){return i[0]=e[0]*r,i[1]=e[1]*r,i[2]=e[2]*r,i}function j(i,e){var r=e[0],t=e[1],n=e[2],a=r*r+t*t+n*n;return a>0&&(a=1/Math.sqrt(a)),i[0]=e[0]*a,i[1]=e[1]*a,i[2]=e[2]*a,i}function N(i,e,r){var t=e[0],n=e[1],a=e[2],_=r[0],o=r[1],s=r[2];return i[0]=n*s-a*o,i[1]=a*_-t*s,i[2]=t*o-n*_,i}var X=ge;(function(){var i=y();return function(e,r,t,n,a,_){var o,s;for(r||(r=3),t||(t=0),n?s=Math.min(n*r+t,e.length):s=e.length,o=t;o<s;o+=r)i[0]=e[o],i[1]=e[o+1],i[2]=e[o+2],a(i,i,_),e[o]=i[0],e[o+1]=i[1],e[o+2]=i[2];return e}})();const ye=32,be=90/180*Math.PI,H=1,D=W(0,3,3),me=W(0,0,0),G=`// ===========\r
//  constants\r
// ===========\r
\r
const EPS = 0.001;\r
const PI = 3.141592653;\r
// LESSON (260307): always set color in linear space.\r
// but most tools give us srgb-encoded values.\r
// so do the conversion first.\r
const SKY_COLOR = vec3f(0.28, 0.82, 1.0);\r
const RAY_NEAR_THRESHOLD = EPS;\r
const RAY_FAR_THRESHOLD = 100.0;\r
\r
// =========\r
//  structs\r
// =========\r
\r
struct SceneInfo { // 64\r
  pixel00: vec3f, // 0 -> 12\r
  width: u32, // 12 -> 4\r
  viewport_u_base: vec3f, // 16 -> 12\r
  height: u32, // 28 -> 4\r
  viewport_v_base: vec3f, // 32 -> 16 (12 + 4)\r
  eye: vec3f, // 48 -> 16 (12 + 4)\r
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
  albedo: vec3f, // 0 -> 16 (12 + 4)\r
}\r
\r
struct MetalMaterial {\r
  albedo: vec3f,\r
  fuzziness: f32,\r
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
// NOTE: each function returns new ray's direction, which should be normalized (here)\r
// callers should always expect to get a noramlized ray direction\r
\r
fn evaluate_diffuse(normal: vec3f, hit_point: vec3f, seed: f32) -> vec3f {\r
  let res_ray_direction = rand_unit_sphere_shell(seed);\r
  return select(-res_ray_direction, res_ray_direction, dot(res_ray_direction, normal) >= 0.0);\r
}\r
\r
fn evaluate_metal(in_ray_dirction: vec3f, normal_norm: vec3f, hit_point: vec3f) -> vec3f {\r
  let res_ray_direction = reflect(in_ray_dirction, normal_norm);\r
  return normalize(res_ray_direction);\r
}\r
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
  let id = (workgroup_id.x * WG_DIM_X) + thread_id;\r
\r
  if id < in_ray_array_length {\r
    let ray = in_ray_array[id];\r
\r
    var min_t = 1e10;\r
    var hit_object_id = -1;\r
\r
    let sphere_array_length = i32(arrayLength(&in_sphere_array));\r
    for (var i = 0; i < sphere_array_length; i++) {\r
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
      out_ray_array[write_idx] = Ray(hit_point + (EPS * normal_norm), diffuse_ray_direction_norm, ray.pixel_offset, ray.weight * material.albedo);\r
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
  let id = (workgroup_id.x * WG_DIM_X) + thread_id;\r
  let n = arrayLength(&in_color_buffer);\r
  if id < n {\r
    let curr = in_color_buffer[id];\r
    let prev = out_filtered_color_buffer[id];\r
    out_filtered_color_buffer[id] = mix(prev, curr, 1.0 / f32(in_frame_index));\r
  }\r
}\r
`,K=`@group(0) @binding(0) var<uniform> in_scene_info: SceneInfo;\r
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
  let linear_color = in_filtered_color_buffer[pixel_offset];\r
  let cutoff = 0.0031308;\r
  let srgb = select(\r
    1.055 * pow(linear_color.rgb, vec3<f32>(1.0/2.4)) - 0.055,\r
    12.92 * linear_color.rgb,\r
    linear_color.rgb < vec3<f32>(cutoff)\r
  );\r
\r
  return vec4<f32>(srgb, linear_color.a);\r
}\r
`;class ke{map_event_to_callback=new Map;active_event_list=[];event_write_idx=0;emit(e){this.event_write_idx<this.active_event_list.length?(this.active_event_list[this.event_write_idx]=e,this.event_write_idx++):this.active_event_list.push(e)}listen(e,r){const t=this.map_event_to_callback.get(e)??[];t.push(r),this.map_event_to_callback.set(e,t)}process(){for(let e=0;e<this.event_write_idx;e++){const r=this.map_event_to_callback.get(this.active_event_list[e])??[];for(const t of r)t()}this.event_write_idx=0}}let A,u,J,C,b,m,Q,q,$,M,T,R,Z,F,U,Y,ee,B;async function Ge(){const i=await navigator.gpu.requestAdapter();if(i===null){console.error("failed to initialize WebGPU!");return}const e=await i.requestDevice({requiredLimits:{maxBufferSize:i.limits.maxBufferSize,maxStorageBufferBindingSize:i.limits.maxStorageBufferBindingSize,maxComputeInvocationsPerWorkgroup:i.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:i.limits.maxComputeWorkgroupSizeX,maxStorageBuffersPerShaderStage:i.limits.maxStorageBuffersPerShaderStage},requiredFeatures:["subgroups"]});if(e===null){console.error("failed to initialize WebGPU!");return}u=e,C=navigator.gpu.getPreferredCanvasFormat();const r=document.querySelector("canvas");if(r===null)throw new Error("could not find canvas element. please check index.html!");const t=r.getContext("webgpu");if(t===null){console.error("failed to initialize WebGPU!");return}t.configure({device:u,format:C}),J=t,console.info("successfully initialized WebGPU 🎉")}function Pe(){return B=new V(G),A=new ke,!0}function Be(){const i=b/m,e=y();X(e,me,D),j(e,e);const r=y();N(r,e,W(0,1,0)),j(r,r);const t=y();N(t,e,r);const n=2*Math.tan(be/2)*H,a=n*i,_=y();x(_,r,a);const o=y();x(o,t,n);const s=y();x(s,_,1/b);const d=y();x(d,o,1/m);const f=y(),l=y();x(l,e,H),E(f,D,l),E(l,_,o),x(l,l,.5),X(f,f,l);const c=y();E(l,s,d),x(l,l,.5),E(c,f,l);const p=B.get_struct("SceneInfo");return p.set_field("pixel00",c).set_field("width",b).set_field("height",m).set_field("viewport_u_base",s).set_field("viewport_v_base",d).set_field("eye",D),p.data}function re(){const i=document.querySelector("canvas");if(i===null)throw new Error("could not find canvas element. please check index.html!");const e=window.devicePixelRatio;i.width=Math.floor(e*i.clientWidth),i.height=Math.floor(e*i.clientHeight),b=i.width,m=i.height,Q=b*m}function ze(){q=new z(u,"gen ray kernel",G+ve,"compute").build(),M=new z(u,"prep hit test kernel",G+we,"compute").build(),R=new z(u,"hit test kernel",G+xe,"compute").build(),F=new z(u,"filter kernel",G+Se,"compute").build();const i=u.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]}),e=u.createPipelineLayout({bindGroupLayouts:[i]});Y=u.createRenderPipeline({layout:e,vertex:{module:u.createShaderModule({code:G+K}),entryPoint:"vertex"},fragment:{module:u.createShaderModule({code:G+K}),entryPoint:"fragment",targets:[{format:C,writeMask:GPUColorWrite.ALL}]},primitive:{topology:"triangle-strip"}})}function te(){const i=Be(),e=_e(u,"scene info",64);u.queue.writeBuffer(e,0,i);const r=4,n=B.get_struct_array("Sphere",r).set_field(0,"center",[0,.5,1-1.5*Math.sqrt(3)]).set_field(0,"radius",.5).set_field(1,"center",[0,-1e4,0]).set_field(1,"radius",1e4).set_field(2,"center",[1.5,.5,1]).set_field(2,"radius",.5).set_field(3,"center",[-1.5,.5,1]).set_field(3,"radius",.5).data,a=v(u,"sphere array",r*16);u.queue.writeBuffer(a,0,n);const o=B.get_struct_array("DiffuseMaterial",r).set_field(0,"albedo",[1,0,0]).set_field(1,"albedo",[.5,.5,.5]).set_field(2,"albedo",[0,1,0]).set_field(3,"albedo",[0,0,1]).data,s=v(u,"diffuse material array",r*16);u.queue.writeBuffer(s,0,o);const d=B.get_struct("Ray").size_bytes,f=v(u,"color buffer",16*b*m),l=v(u,"ray array length ping",4),c=v(u,"ray array ping",d*b*m),p=v(u,"ray array length pong",4),h=v(u,"ray array pong",d*b*m),g=oe(u,"hit test indirect arg",12);$=new w(u,"gen ray kernel bind group").add_buffer("in_scene_info",0,e).add_buffer("out_ray_array_length",1,l).add_buffer("out_ray_array",2,c).create_then_add_buffer_init_u32("out_frame_index",3,GPUBufferUsage.STORAGE,0).build(q);const P=new w(u,"prep hit test kernel bind group ping").add_buffer("in_next_ray_array_length",0,l).add_buffer("out_prev_ray_array_length",1,p).add_buffer("out_indirect_args",2,g).build(M),ne=new w(u,"prep hit test kernel bind group pong").add_buffer("in_next_ray_array_length",0,p).add_buffer("out_prev_ray_array_length",1,l).add_buffer("out_indirect_args",2,g).build(M);T=[P,ne];const ie=new w(u,"hit test kernel bind group ping").add_buffer("in_ray_array_length",0,l).add_buffer("in_ray_array",1,c).add_buffer("in_sphere_array",2,a).add_buffer("in_diffuse_material_array",3,s).add_buffer("out_color_buffer",4,f).add_buffer("out_ray_array_length",5,p).add_buffer("out_ray_array",6,h).build(R),ae=new w(u,"hit test kernel bind group pong").add_buffer("in_ray_array_length",0,p).add_buffer("in_ray_array",1,h).add_buffer("in_sphere_array",2,a).add_buffer("in_diffuse_material_array",3,s).add_buffer("out_color_buffer",4,f).add_buffer("out_ray_array_length",5,l).add_buffer("out_ray_array",6,c).build(R);Z=[ie,ae],U=new w(u,"filter kernel bind group").add_buffer("in_frame_index",0,$.get_buffer("out_frame_index")).add_buffer("in_color_buffer",1,f).create_then_add_buffer("out_filtered_color_buffer",2,GPUBufferUsage.STORAGE,16*b*m).build(F),ee=new w(u,"blit bind group").add_buffer("in_scene_info",0,e).add_buffer("in_filtered_color_buffer",1,U.get_buffer("out_filtered_color_buffer")).build_raw(Y)}function Ee(){A.listen("canvas-size-changed",()=>{re(),te()});let i;addEventListener("resize",()=>{i&&clearTimeout(i),i=setTimeout(()=>{A.emit("canvas-size-changed")},100)})}function Ae(){function i(e){A.process();const r=T[0].get_buffer("out_indirect_args"),t=u.createCommandEncoder();{t.clearBuffer(U.get_buffer("in_color_buffer")),t.pushDebugGroup("frame");{t.pushDebugGroup("ray generation"),q.dispatch(t,$,Math.ceil(b/16),Math.ceil(m/16),1),t.popDebugGroup(),t.pushDebugGroup("hit test");{for(let n=0;n<ye;n++)M.dispatch(t,T[n&1],1,1,1),R.dispatch_indirect(t,Z[n&1],r);t.popDebugGroup()}t.pushDebugGroup("filtering"),F.dispatch(t,U,Math.ceil(Q/128),1,1),t.popDebugGroup(),t.pushDebugGroup("blit");{const n=t.beginRenderPass({colorAttachments:[{view:J.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:"clear",storeOp:"store"}]});n.setBindGroup(0,ee.bind_group_object),n.setPipeline(Y),n.draw(4,1),n.end(),t.popDebugGroup()}t.popDebugGroup()}u.queue.submit([t.finish()])}window.requestAnimationFrame(i)}window.requestAnimationFrame(i)}async function Me(){await Ge(),re(),Pe()&&(ze(),te(),Ee(),Ae())}Me();
