export type FrameBuffer = {
    fb: WebGLFramebuffer,
    texture: WebGLTexture,
    width: number,
    height: number,
    bind: () => void,
    setTextureSlot: (slot: number) => number,
}
export type DoubleFramebuffer = {
    read: FrameBuffer,
    write: FrameBuffer,
    swap: () => void
}
export class Program {
    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation>;
    attributes: Record<string, number>;
    constructor(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        this.gl = gl;
        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);
        this.uniforms = getProgramUniforms(gl, this.program);
        this.attributes = getProgramAttribute(gl, this.program);

    }
    bind() {
        this.gl.useProgram(this.program);
    }
}


////DEBUG////////
function logGLCall(functionName: string, args: any) {
    console.log("gl." + functionName + "(" +
        // @ts-ignore
        WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");
}

export class Engine {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    buffer: WebGLBuffer;
    positionLocation: number = 0;
    constructor(canvas: HTMLCanvasElement, mode?: 'dev') {
        this.canvas = canvas;
        const cxt = canvas.getContext('webgl2')
        if (!cxt) {
            throw new Error('Webgl not supported');
        }
        this.gl = cxt;
        if (mode === 'dev')
            ////DEBUG////////
            // @ts-ignore
            this.gl = WebGLDebugUtils.makeDebugContext(this.gl, undefined, logGLCall);
        this.gl.getExtension('EXT_color_buffer_float');
        this.gl.getExtension('WEBGL_color_buffer_float');
        this.gl.getExtension('OES_texture_float');
        this.gl.getExtension('OES_texture_float_linear');
        const buff = this.gl.createBuffer();
        if (!buff) {
            throw new Error('Unable to init engine buffer')
        }
        this.buffer = buff;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, -1]), this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.positionLocation)
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    }

    draw(frameBuffer?: FrameBuffer) {

        if (!frameBuffer) {
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        } else {
            this.gl.viewport(0, 0, frameBuffer.width, frameBuffer.height);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer.fb);
        }
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3 * 2);
    }

    render(callback: (...args: any[]) => void) {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        callback();
    }

    getResolution(resolution: number) {
        const aspect = this.gl.drawingBufferHeight / this.gl.drawingBufferWidth;
        return { width: resolution, height: resolution * aspect }
    }
}


export function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Unable to init empty shader')
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = new Error(gl.getShaderInfoLog(shader) || 'Unable to complie shader')
        gl.deleteShader(shader);
        throw error;
    }
    return shader;
}
function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = gl.createProgram();
    if (!program) {
        throw new Error('Unable to init empty program')
    }
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        throw new Error('Unable to link program')
    }
    return program;
}

function getProgramUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
    const uniforms: Record<string, WebGLUniformLocation> = {};
    for (let i = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) - 1; i >= 0; i--) {
        const uniformName = gl.getActiveUniform(program, i)?.name;
        if (uniformName) {
            const location = gl.getUniformLocation(program, uniformName);
            if (location !== null) {
                uniforms[uniformName] = location;
            }
        }
    }
    return uniforms;
}

function getProgramAttribute(gl: WebGL2RenderingContext, program: WebGLProgram) {
    const attributes: Record<string, number> = {};
    for (let i = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) - 1; i >= 0; i--) {
        const attributeName = gl.getActiveAttrib(program, i)?.name;
        if (attributeName) {
            const location = gl.getAttribLocation(program, attributeName);
            if (location !== null) {
                attributes[attributeName] = location;
            }
        }
    }
    return attributes;
}

export function createTexture(gl: WebGL2RenderingContext, width: number, height: number, internalformat: number, format: number, type: number, filtering: number = gl.NEAREST, data: ArrayBufferView | null) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);



    gl.texImage2D(gl.TEXTURE_2D, 0, internalformat, width, height, 0, format, type, data)
    if (!texture) {
        throw new Error('Unable to create texture')
    }
    return texture
}

export async function loadImage(src: string) {
    const image = await <Promise<HTMLImageElement>>new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
            resolve(image);
        }
        image.crossOrigin = "anonymous";
        image.src = src;
    });
    return image;
}


export function createFrameBuffer(gl: WebGL2RenderingContext, width: number, height: number, internalformat: number, format: number, type: number, filtering: number, data: ArrayBufferView = null): FrameBuffer {
    const texture = createTexture(gl, width, height, internalformat, format, type, filtering, data);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, width, height);

    if (!texture || !fb) throw new Error('Unable to create framebuffer');

    return {
        fb,
        texture,
        width: width,
        height: height,
        bind() {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        },
        setTextureSlot(slot: number) {
            gl.activeTexture(gl.TEXTURE0 + slot);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return slot;
        }
    }

}

export function createDFB(gl: WebGL2RenderingContext, width: number, height: number, internalformat: number, format: number, type: number, filtering: number, data: ArrayBufferView = null): DoubleFramebuffer {
    let fb1 = createFrameBuffer(gl, width, height, internalformat, format, type, filtering, data);
    let fb2 = createFrameBuffer(gl, width, height, internalformat, format, type, filtering, null);

    return {
        get read() {
            return fb1;
        },
        get write() {
            return fb2;
        },
        set read(fb) {
            fb1 = fb;
        },
        set write(fb) {
            fb2 = fb;
        },
        swap() {
            let temp = fb1;
            fb1 = fb2;
            fb2 = temp;
        }
    }
}


