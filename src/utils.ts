import { vec3 } from "gl-matrix";

export function encoded_to_linear(encoded: vec3): vec3 {
    const decode_channel = (channel: number): number => {
        if (channel <= 0.04045) {
            return channel / 12.92;
        }

        return Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    return vec3.fromValues(
        decode_channel(encoded[0]),
        decode_channel(encoded[1]),
        decode_channel(encoded[2]),
    );
}
