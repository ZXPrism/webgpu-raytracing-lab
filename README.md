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

## Style / Contribution Guide (DRAFT)
- NEVER use non-null assertion (!)
  - If you are querying sth that may not exist, return `undefined`. Callers should check the results properly.
  - If you are querying sth that must exist, throw an error. Do not let error propagate.


## Dev Guide for Myself (delete this)
### Deploy to GitHub Pages
Run `pnpm run deploy`.

### Add New Changes
- Add new changes on dev branch. Test whenever I can.
- When these changes are ready (a complete new feature / fix, etc.), switch to main branch and run `git merge --squash dev`.
- Deploy to github pages.
- Switch back to dev branch, run `git merge main`.
- Continue to add new things!

### Miscs

Do not need to write CHANGELOG, I will keep commit log of main branch clean. Sufficient for this personal project.
