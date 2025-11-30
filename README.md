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

1. gen ray, each pixel `config_spp` rays
2. hit test for `config_max_bounce` times
3. filter using previous frame's output (running average)
4. blit to screen
