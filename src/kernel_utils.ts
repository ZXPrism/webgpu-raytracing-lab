// helper to create a gpu buffer
export function create_gpu_buffer(device: GPUDevice, bufferName: string, extraBufferUsage: GPUFlagsConstant, nBytes: number): GPUBuffer {
    let usage = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
    usage |= extraBufferUsage;

    const gpu_buffer = device.createBuffer({
        label: bufferName,
        size: nBytes,
        usage
    });

    return gpu_buffer;
}

// helper to create a gpu uniform buffer
export function create_gpu_uniform_buffer(device: GPUDevice, bufferName: string, nBytes: number): GPUBuffer {
    const usage = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM;

    const gpu_buffer = device.createBuffer({
        label: bufferName,
        size: nBytes,
        usage
    });

    return gpu_buffer;
}

// helper to create a gpu storage buffer
export function create_gpu_storage_buffer(device: GPUDevice, bufferName: string, nBytes: number): GPUBuffer {
    const usage = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE;

    // WebGPU requires a minimum buffer size for storage buffers
    // Even if the buffer is logically empty, we need at least 16 bytes
    const MIN_BUFFER_SIZE = 16;
    const size = Math.max(nBytes, MIN_BUFFER_SIZE);

    const gpu_buffer = device.createBuffer({
        label: bufferName,
        size: size,
        usage
    });

    return gpu_buffer;
}

// helper to create a gpu indirect buffer
export function create_gpu_indirect_buffer(device: GPUDevice, bufferName: string, nBytes: number): GPUBuffer {
    const usage = GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT;

    const gpu_buffer = device.createBuffer({
        label: bufferName,
        size: nBytes,
        usage
    });

    return gpu_buffer;
}

// helper to create a gpu buffer containing one single u32
export function create_gpu_buffer_u32(device: GPUDevice, bufferName: string, extraBufferUsage: GPUFlagsConstant, value_u32: number): GPUBuffer {
    const gpu_buffer = create_gpu_buffer(device, bufferName, extraBufferUsage, 4);

    const buffer = new Uint32Array(1);
    buffer[0] = value_u32;
    device.queue.writeBuffer(gpu_buffer, 0, buffer.buffer);

    return gpu_buffer;
}

// helper to create a gpu storage buffer containing one single u32
export function create_gpu_storage_buffer_u32(device: GPUDevice, bufferName: string, value_u32: number): GPUBuffer {
    const gpu_buffer = create_gpu_storage_buffer(device, bufferName, 4);

    const buffer = new Uint32Array(1);
    buffer[0] = value_u32;
    device.queue.writeBuffer(gpu_buffer, 0, buffer.buffer);

    return gpu_buffer;
}
