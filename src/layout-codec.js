// Transfer one buffer instead of cloning hundreds of thousands of object graphs.
export const packLayout=data=>new TextEncoder().encode(JSON.stringify(data)).buffer;
export const unpackLayout=data=>data instanceof ArrayBuffer?JSON.parse(new TextDecoder().decode(data)):data;
