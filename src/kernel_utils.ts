// usage contains `GPUBufferUsage.COPY_DST` & `GPUBufferUsage.COPY_SRC` by default for convenience
// typically, you only need to pass `GPUBufferUsage.UNIFORM` or `GPUBufferUsage.STORAGE`
export function createGPUBuffer(device: GPUDevice, bufferName: string, extraBufferUsage: GPUFlagsConstant, nBytes: number): GPUBuffer {
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
export function createGPUBufferU32(device: GPUDevice, bufferName: string, extraBufferUsage: GPUFlagsConstant, value_u32: number): GPUBuffer {
    const gpuBuffer = createGPUBuffer(device, bufferName, extraBufferUsage, 4);

    const buffer = new Uint32Array(1);
    buffer[0] = value_u32;
    device.queue.writeBuffer(gpuBuffer, 0, buffer.buffer);

    return gpuBuffer;
}

// helper to write a single u32 to a buffer
export function writeU32ToGPUBuffer(device: GPUDevice, bufferObject: GPUBuffer, value_u32: number): void {
    const buffer = new Uint32Array(1);
    buffer[0] = value_u32;
    device.queue.writeBuffer(bufferObject, 0, buffer.buffer);
}

// helper to inspect buffer content
export async function readGPUBuffer<T extends ArrayBufferView>(
    device: GPUDevice,
    srcBuffer: GPUBuffer,
    size: number,
    arrayType: { new(buffer: ArrayBufferLike): T },
    offset = 0
): Promise<T> {
    const stagingBuffer = device.createBuffer({
        size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(srcBuffer, offset, stagingBuffer, 0, size);
    device.queue.submit([encoder.finish()]);

    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const copy = stagingBuffer.getMappedRange().slice(0);
    stagingBuffer.unmap();
    stagingBuffer.destroy();

    return new arrayType(copy);
}
