# webgpu-raytracing-lab

<img width="3748" height="1844" alt="demo" src="https://github.com/user-attachments/assets/9e2b0b9c-3ca5-462f-8733-209a56ba4861" />

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

## Gallery
<img width="3748" height="1844" alt="0c0c38adcbef7609fd8fdc9b68dda3cc7dd99e22" src="https://github.com/user-attachments/assets/0179f848-7321-48dd-8685-8bb32d8f1505" />

<img width="3748" height="1844" alt="8cac9deef01f3a29ce3885cadf25bc315d607c3e" src="https://github.com/user-attachments/assets/023c91ab-fd1b-4fad-ad23-791e73458b69" />

<img width="3748" height="1844" alt="e525ee1190ef76c67f3eab2fdb16fdfaae51673a" src="https://github.com/user-attachments/assets/455d091f-7cab-4a30-9f3e-039d848d2bfd" />

<img width="3748" height="1844" alt="a9148313632762d08ed6f4bbe6ec08fa533dc6c6" src="https://github.com/user-attachments/assets/3d53c834-9c38-44f1-bdaf-36d8bcd83438" />

<img width="3748" height="1844" alt="8273af1ea8d3fd1fbe74f13e764e251f94ca5fa9" src="https://github.com/user-attachments/assets/9825b018-629b-4362-8d81-2d8cd121c682" />


## Style / Contribution Guide (DRAFT)
- NEVER use non-null assertion (!)
  - If you are querying sth that may not exist, return `undefined`. Callers should check the results properly.
  - If you are querying sth that must exist, throw an error. Do not let error propagate.

- NEVER use `arrayLength` function in WGSL but explicitly pass length in or calculate on the fly, since array length is not necessarily equal to actual element count

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


## References
- Raytracing: https://raytracing.github.io/
- SDF: https://iquilezles.org/articles/
- BVH: https://jacco.ompf2.com/2022/04/13/how-to-build-a-bvh-part-1-basics/
- PBR: https://pbr-book.org/4ed/contents
- Sky rendering: https://sebh.github.io/publications/egsr2020.pdf
