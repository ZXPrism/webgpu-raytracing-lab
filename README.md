# webgpu-raytracing-lab

This is my experiment on raytracing based on GPU.

It should obey the basic rules of raytracing, but is probably not the common practice, so be cautious when reading my codes.

## Overview
### Configs
- `config_max_bounce`
- `config_spp`

### Kernels
- `gen_ray`: prepare initial primary rays; for each pixel, generate one random ray
- `hit_test`: hit test for existing rays, calculate color contribution and new rays
- `blit`: blit result to screen
- `filter`

### Procedure
In one frame:

1. gen ray
2. hit test for `config_max_bounce` times
3. blit

Repeat the procedure above for `config_spp` times, then do a filtering on the final output.

---

That is, we need `config_spp` frames to fully render one scene.

But we can actually do faster, if we put everything in one frame. The reason why I split them to multiple frames is for aesthetic considerations.

Also, the result often needs less iterations to converge, but convergence checking requires CPU readback, which should be avoided for most circumstances. That's why I used iterations of fixed times.
