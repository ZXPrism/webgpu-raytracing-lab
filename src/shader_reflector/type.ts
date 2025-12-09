export type ShaderDataPrimitiveType = "integer" | "float";

// ref: https://www.w3.org/TR/WGSL/#alignment-and-size
// currently only supported types needed in the shader
export const ShaderDataTypeSize = {
    u32: 4,
    f32: 4,
    vec2u: 8,
    vec2f: 8,
    vec3f: 12,
    vec4f: 16,
} as const;

export const ShaderDataTypeAlignment = {
    u32: 4,
    f32: 4,
    vec2u: 8,
    vec2f: 8,
    vec3f: 16,
    vec4f: 16,
} as const satisfies { [K in keyof typeof ShaderDataTypeSize]: number };

export const ShaderDataTypeComponentCount = {
    u32: 1,
    f32: 1,
    vec2u: 2,
    vec2f: 2,
    vec3f: 3,
    vec4f: 4,
} as const satisfies { [K in keyof typeof ShaderDataTypeSize]: number };

export const ShaderDataTypePrimitivity = {
    u32: "integer",
    f32: "float",
    vec2u: "integer",
    vec2f: "float",
    vec3f: "float",
    vec4f: "float",
} as const satisfies { [K in keyof typeof ShaderDataTypeSize]: ShaderDataPrimitiveType };

export type ShaderDataType = keyof typeof ShaderDataTypeSize;

export const MapTypeToShaderDataType = new Map<string, ShaderDataType>([
    ["u32", "u32"],
    ["f32", "f32"],
    ["vec2u", "vec2u"],
    ["vec2<u32>", "vec2u"],
    ["vec2f", "vec2f"],
    ["vec2<f32>", "vec2f"],
    ["vec3f", "vec3f"],
    ["vec3<f32>", "vec3f"],
    ["vec4f", "vec4f"],
    ["vec4<f32>", "vec4f"],
]);
