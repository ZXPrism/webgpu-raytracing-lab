# webgpu-raytracing-lab

This is my experiment on raytracing based on GPU.

It should obey the basic rules of raytracing, but is probably not the common practice, so be cautious when reading my codes.

## Getting Started
1. Install `pnpm`
2. Run `pnpm i`
3. Run `pnpm run dev`

## Overview
### Configs
In the future, this part can be configured with JSON.
- `config_max_bounce`: the max bounce time (recursion depth) of rays

### Kernels
- `gen_ray`: prepare initial primary rays; for each pixel, generate one random ray
- `hit_test`: hit test for existing rays, calculate color contribution and new rays
- `filter`: filter based on previous outputs to reduce noises
- `filter`: additional filter to reduce noises
    - to be added..
- `blit`: blit result to screen

### Procedure
In one frame:

1. gen ray for each pixel
2. hit test for `config_max_bounce` times
3. filter using previous frame's output (running average)
4. blit to screen


## Deploy to GitHub Pages
Run `pnpm run deploy`.
