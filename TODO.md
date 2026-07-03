# Raw
## Base
- [X] `260307` HDR support
  - `260703` Added ACES
- [ ] `260307` More geometries
    - [X] planes
    - [ ] cuboids
    - [ ] triangles
    - [ ] `260703` SDF support
- [ ] `260307` BVH
    - [ ] js impl
    - [ ] wasm impl
- [ ] `260307` Perf (with limited metrics) for quickly checks
- [ ] `260307` Convergence checks to save power
  - TODO 0703
- [ ] `260307` Mixed rendering (with rasterization)
- [ ] `260307` Picking
- [ ] `260307` Editing
- [ ] `260307` Shader optimizations (with profilers), maybe need some sort to improve locality, or do compressions!
- [ ] `260308` ShaderReflector: support parsing nested struct decls
- [ ] `260308` ShaderReflector: generate shader structs bind codes
- [ ] `260308` BindGroupBuilder: provide wrappers to (create then) add {storage,uniform} buffer, do not expose GPUBufferUsage flags
- [ ] `260314` Randomization overhaul. Evaluate current randomness (may be some freq analysis?)
- [ ] `260315` Graph node editor similar to Blender
- [ ] `260315` Environmental mapping
- [ ] `260319` Neural graphics
- [ ] `260703` DPR account
- [ ] `260703` Pressure test to evaluate if sortings are needed

## Aux
- [ ] `260307` Scene representation & serialization & regression
- [ ] `260307` Gallery
- [ ] `260314` Docs

## Miscs
- [ ] `260314` Logging overhaul: each log should have object name
