import { BindGroup } from './bind_group';

export class Kernel {
    public pipeline: GPUComputePipeline;

    constructor(pipeline: GPUComputePipeline) {
        this.pipeline = pipeline;
    }

    public get_bind_group_layout(bind_group_index: number): GPUBindGroupLayout {
        return this.pipeline.getBindGroupLayout(bind_group_index);
    }

    public dispatch_no_barrier(compute_pass_encoder: GPUComputePassEncoder, bind_group: BindGroup, wg_dim_x: number, wg_dim_y: number, wg_dim_z: number): void {
        compute_pass_encoder.setPipeline(this.pipeline);
        compute_pass_encoder.setBindGroup(0, bind_group.bind_group_object);
        compute_pass_encoder.dispatchWorkgroups(wg_dim_x, wg_dim_y, wg_dim_z);
    }

    public dispatch_no_barrier_indirect(compute_pass_encoder: GPUComputePassEncoder, bind_group: BindGroup, indirect_arg_buffer_object: GPUBuffer, indirect_arg_offset?: number): void {
        compute_pass_encoder.setPipeline(this.pipeline);
        compute_pass_encoder.setBindGroup(0, bind_group.bind_group_object);
        compute_pass_encoder.dispatchWorkgroupsIndirect(indirect_arg_buffer_object, indirect_arg_offset ?? 0);
    }

    public dispatch_no_barrier_multiple_bind_group(compute_pass_encoder: GPUComputePassEncoder, bind_group_list: BindGroup[], wg_dim_x: number, wg_dim_y: number, wg_dim_z: number): void {
        compute_pass_encoder.setPipeline(this.pipeline);
        bind_group_list.forEach((bind_group, index) => {
            compute_pass_encoder.setBindGroup(index, bind_group.bind_group_object);
        });
        compute_pass_encoder.dispatchWorkgroups(wg_dim_x, wg_dim_y, wg_dim_z);
    }

    public dispatch_no_barrier_multiple_bind_group_indirect(compute_pass_encoder: GPUComputePassEncoder, bind_group_list: BindGroup[], indirect_arg_buffer_object: GPUBuffer, indirect_arg_offset?: number): void {
        compute_pass_encoder.setPipeline(this.pipeline);
        bind_group_list.forEach((bind_group, index) => {
            compute_pass_encoder.setBindGroup(index, bind_group.bind_group_object);
        });
        compute_pass_encoder.dispatchWorkgroupsIndirect(indirect_arg_buffer_object, indirect_arg_offset ?? 0);
    }

    public dispatch(encoder: GPUCommandEncoder, bind_group: BindGroup, wg_dim_x: number, wg_dim_y: number, wg_dim_z: number): void {
        const compute_pass_encoder = encoder.beginComputePass();
        this.dispatch_no_barrier(compute_pass_encoder, bind_group, wg_dim_x, wg_dim_y, wg_dim_z);
        compute_pass_encoder.end();
    }

    public dispatch_indirect(encoder: GPUCommandEncoder, bind_group: BindGroup, indirect_arg_buffer_object: GPUBuffer, indirect_arg_offset?: number): void {
        const compute_pass_encoder = encoder.beginComputePass();
        this.dispatch_no_barrier_indirect(compute_pass_encoder, bind_group, indirect_arg_buffer_object, indirect_arg_offset);
        compute_pass_encoder.end();
    }

    public dispatch_multiple_bind_group(encoder: GPUCommandEncoder, bind_group_list: BindGroup[], wg_dim_x: number, wg_dim_y: number, wg_dim_z: number): void {
        const compute_pass_encoder = encoder.beginComputePass();
        this.dispatch_no_barrier_multiple_bind_group(compute_pass_encoder, bind_group_list, wg_dim_x, wg_dim_y, wg_dim_z);
        compute_pass_encoder.end();
    }

    public dispatch_multiple_bind_group_indirect(encoder: GPUCommandEncoder, bind_group_list: BindGroup[], indirect_arg_buffer_object: GPUBuffer, indirect_arg_offset?: number): void {
        const compute_pass_encoder = encoder.beginComputePass();
        this.dispatch_no_barrier_multiple_bind_group_indirect(compute_pass_encoder, bind_group_list, indirect_arg_buffer_object, indirect_arg_offset);
        compute_pass_encoder.end();
    }
}
