// helper to create a gpu buffer
export function create_gpu_buffer(device: GPUDevice, bufferName: string, extraBufferUsage: GPUFlagsConstant, nBytes: number): GPUBuffer {
    let usage = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
    usage |= extraBufferUsage;

    const gpuBuffer = device.createBuffer({
        label: bufferName,
        size: nBytes,
        usage
    });

    return gpuBuffer;
}

// helper to create buffer containing one single u32
export function create_gpu_buffer_u32(device: GPUDevice, bufferName: string, extraBufferUsage: GPUFlagsConstant, value_u32: number): GPUBuffer {
    const gpuBuffer = create_gpu_buffer(device, bufferName, extraBufferUsage, 4);

    const buffer = new Uint32Array(1);
    buffer[0] = value_u32;
    device.queue.writeBuffer(gpuBuffer, 0, buffer.buffer);

    return gpuBuffer;
}
