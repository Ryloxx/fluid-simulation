import { Engine, Program, createShader, createFrameBuffer, createDFB, DoubleFramebuffer, FrameBuffer } from './lib.js'
import { addDataShaderSource, advectShaderSource, clearShaderSource, copyShaderSource, displayShaderSource, divergeanceShaderSource, gradientSubstractShaderSource, diffuseShaderSource, vertexShaderShaderSource, pressureShaderSource, boundaryShaderSource, curlShaderSource, vorticityShaderSource, filterShaderSource, bloomLightShaderSource, bloomBlendingSource } from "./shaderSources.js";

/* TYPES */

export type Color = [number, number, number];
export interface Webgl2FluidSimulationConfig {
    baseResolution: number,
    currentResolution: number
    radius: number,
    speed: number,
    decayFactor: number,
    swirlFactor: number,
    pressureFactor: number,
    bloomIntensity: number,
}
enum FilterType {
    BLUR,
    EDGE_DETECT,
    SHARPEN,
}


/* CLASS */
class Filter {
    static kernelTypes = {
        blur: {
            kernel: [1, 2, 1, 2, 4, 2, 1, 2, 1],
            weight: 16,
        },
        edgeDetect: {
            kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
            weight: 1,
        },
        sharpen: {
            kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0],
            weight: 1,
        }
    }
    kernels: {
        kernel: number[],
        weight: number
    }[] = [];
    program: Program
    constructor(kernels: { kernel: number[]; weight: number; }[], program: Program) {
        this.kernels = kernels
        this.program = program;
    }
    apply(engine: Engine, source: FrameBuffer, dest: FrameBuffer, round: number = 1) {
        this.program.bind();
        engine.gl.uniform2f(this.program.uniforms.u_pixelSize, 1 / source.width, 1 / source.height)
        const r = round + ((round + 1) % 2)
        for (let i = 0; i < r; i++) {
            this.kernels.forEach(kernel => {
                engine.gl.uniform1fv(this.program.uniforms['u_kernel[0]'], kernel.kernel);
                engine.gl.uniform1f(this.program.uniforms.u_weight, kernel.weight);
                engine.gl.uniform1i(this.program.uniforms.u_data, source.setTextureSlot(0))
                engine.draw(dest);
                const temp = dest;
                dest = source;
                source = temp;
            })
        }
    }
}
/* FUNCTIONS */
function init(canvas: HTMLCanvasElement) {
    if (!canvas) throw new Error('No canvas found');
    const engine = new Engine(canvas);
    const { gl } = engine;
    const { advectProgram,
        displayProgram,
        gradientSubstractProgram,
        // diffuseProgram,
        divergenceProgram,
        addDataShaderProgram,
        copyProgram,
        clearProgram,
        pressureProgram,
        // boundaryProgram,
        curlProgram,
        filterProgram,
        vorticityProgram,
        bloomLightProgram,
        bloomBlendingProgram,
    } = compilePrograms(gl);
    const config: Webgl2FluidSimulationConfig = {
        baseResolution: 1024,
        currentResolution: 1024,
        radius: 0.00001,
        speed: 1,
        decayFactor: 0.2,
        swirlFactor: 10,
        pressureFactor: 0.1,
        bloomIntensity: 1,
    }
    const filtersMap = {
        [FilterType.BLUR]: new Filter([Filter.kernelTypes.blur], filterProgram),
        [FilterType.EDGE_DETECT]: new Filter([Filter.kernelTypes.edgeDetect], filterProgram),
        [FilterType.SHARPEN]: new Filter([Filter.kernelTypes.sharpen], filterProgram)
    }
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    let velocity: DoubleFramebuffer;
    let pressure: DoubleFramebuffer;
    let density: DoubleFramebuffer;
    let divergence: FrameBuffer;
    let curl: FrameBuffer;
    let bloomFrameBuffers: FrameBuffer[];
    let tempFBLRESOLUTION1: DoubleFramebuffer;
    let tempFBLRESOLUTION2: DoubleFramebuffer;
    const forces: { x: number, y: number, vx: number, vy: number, color: Color }[] = [];


    const bloomFrameBufferCount = 6;

    function initFrameBuffer(resolution: number) {
        let resolution1 = engine.getResolution(resolution >> 2);
        let resolution2 = engine.getResolution(resolution);
        density = createDFB(gl, resolution2.width, resolution2.height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
        velocity = createDFB(gl, resolution1.width, resolution1.height, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.LINEAR);
        pressure = createDFB(gl, resolution1.width, resolution1.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
        divergence = createFrameBuffer(gl, resolution1.width, resolution1.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
        curl = createFrameBuffer(gl, resolution1.width, resolution1.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
        bloomFrameBuffers = [];
        for (let i = 1; i < bloomFrameBufferCount; i++) {
            bloomFrameBuffers.push(createFrameBuffer(gl, resolution2.width >> i, resolution2.height >> i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR))
        }
        tempFBLRESOLUTION1 = createDFB(gl, resolution1.width, resolution1.height, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
        tempFBLRESOLUTION2 = createDFB(gl, resolution2.width, resolution2.height, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    }
    function resizerFrameBuffers(resolution: number) {
        let resolution1 = engine.getResolution(resolution >> 2);
        let resolution2 = engine.getResolution(resolution);
        const densityNew = createDFB(gl, resolution2.width, resolution2.height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
        const velocityNew = createDFB(gl, resolution1.width, resolution1.height, gl.RG16F, gl.RG, gl.HALF_FLOAT, gl.LINEAR);
        const pressureNew = createDFB(gl, resolution1.width, resolution1.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
        const divergenceNew = createFrameBuffer(gl, resolution1.width, resolution1.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
        const curlNew = createFrameBuffer(gl, resolution1.width, resolution1.height, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.NEAREST);
        const tempFBLRESOLUTION1New = createDFB(gl, resolution1.width, resolution1.height, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
        const tempFBLRESOLUTION2New = createDFB(gl, resolution2.width, resolution2.height, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
        copyToFramebuffer(density.read, densityNew.read);
        copyToFramebuffer(density.write, densityNew.write);
        copyToFramebuffer(velocity.read, velocityNew.write);
        copyToFramebuffer(velocity.write, velocityNew.write);
        copyToFramebuffer(pressure.read, pressureNew.read);
        copyToFramebuffer(pressure.write, pressureNew.write);
        copyToFramebuffer(divergence, divergenceNew);
        copyToFramebuffer(curl, curlNew);
        copyToFramebuffer(tempFBLRESOLUTION2.read, tempFBLRESOLUTION2New.read);
        copyToFramebuffer(tempFBLRESOLUTION2.write, tempFBLRESOLUTION2New.write);
        copyToFramebuffer(tempFBLRESOLUTION1.read, tempFBLRESOLUTION1New.read);
        copyToFramebuffer(tempFBLRESOLUTION1.write, tempFBLRESOLUTION1New.write);
        bloomFrameBuffers = bloomFrameBuffers.map((framebuffer, i) => {
            const frameBufferNew = createFrameBuffer(gl, resolution2.width >> (i + 1), resolution2.height >> (i + 1), gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR)
            copyToFramebuffer(framebuffer, frameBufferNew);
            return frameBufferNew;
        })
        density = densityNew;
        velocity = velocityNew;
        pressure = pressureNew;
        divergence = divergenceNew;
        curl = curlNew;
        tempFBLRESOLUTION1 = tempFBLRESOLUTION1New;
        tempFBLRESOLUTION2 = tempFBLRESOLUTION2New;
    }

    initFrameBuffer(config.currentResolution);

    function copyToFramebuffer(source: FrameBuffer, target: FrameBuffer) {
        copyProgram.bind();
        {
            gl.uniform1i(copyProgram.uniforms.u_data, source.setTextureSlot(0));
        }
        engine.draw(target);
    }
    function swirl(dt: number, force: number) {
        curlProgram.bind();
        gl.uniform2f(curlProgram.uniforms.u_pixelSize, 1 / velocity.read.width, 1 / velocity.read.height);
        gl.uniform1i(curlProgram.uniforms.u_velocity, velocity.read.setTextureSlot(0));
        engine.draw(curl);

        vorticityProgram.bind();
        gl.uniform2f(vorticityProgram.uniforms.u_pixelSize, 1 / velocity.read.width, 1 / velocity.read.height);
        gl.uniform1i(vorticityProgram.uniforms.u_velocity, velocity.read.setTextureSlot(0));
        gl.uniform1i(vorticityProgram.uniforms.u_curl, curl.setTextureSlot(1));
        gl.uniform1f(vorticityProgram.uniforms.u_curlForce, force);
        gl.uniform1f(vorticityProgram.uniforms.u_dt, dt);
        engine.draw(velocity.write);
        velocity.swap();
    }
    function project(pressureFactor: number) {
        divergenceProgram.bind();
        gl.uniform2f(divergenceProgram.uniforms.u_pixelSize, 1 / velocity.read.width, 1 / velocity.read.height);
        gl.uniform1f(divergenceProgram.uniforms.u_h, 1);
        gl.uniform1i(divergenceProgram.uniforms.u_velocity, velocity.read.setTextureSlot(0));
        engine.draw(divergence);
        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.u_data, pressure.read.setTextureSlot(0));
        gl.uniform4f(clearProgram.uniforms.u_value, pressureFactor, 1, 1, 1);
        gl.uniform4f(clearProgram.uniforms.u_constant, 0, 0, 0, 0);
        engine.draw(pressure.write);
        pressure.swap();
        pressureProgram.bind();
        gl.uniform2f(pressureProgram.uniforms.u_pixelSize, 1 / velocity.read.width, 1 / velocity.read.height);
        gl.uniform1i(pressureProgram.uniforms.u_divergence, divergence.setTextureSlot(0));
        for (let i = 0; i < 50; i++) {
            gl.uniform1i(pressureProgram.uniforms.u_pressure, pressure.read.setTextureSlot(1));
            engine.draw(pressure.write);
            pressure.swap();
        }

        // setBound(pressure, [1, 1], 1);

        gradientSubstractProgram.bind();
        gl.uniform2f(gradientSubstractProgram.uniforms.u_pixelSize, 1 / velocity.read.width, 1 / velocity.read.height);
        gl.uniform1f(gradientSubstractProgram.uniforms.u_h, 0.5);
        gl.uniform1i(gradientSubstractProgram.uniforms.u_pressure, pressure.read.setTextureSlot(0));
        gl.uniform1i(gradientSubstractProgram.uniforms.u_velocity, velocity.read.setTextureSlot(1));
        engine.draw(velocity.write);
        velocity.swap();
        // setBound(velocity, [1, 1], -1);
    }

    function advect(dfb: DoubleFramebuffer, dt: number, decayFactor: number) {
        advectProgram.bind();
        gl.uniform2f(advectProgram.uniforms.u_pixelSize, 1 / velocity.read.width, 1 / velocity.read.height);
        gl.uniform2f(advectProgram.uniforms.u_targetSize, dfb.read.width, dfb.read.height);
        gl.uniform1i(advectProgram.uniforms.u_velocity, velocity.read.setTextureSlot(0));
        gl.uniform1i(advectProgram.uniforms.u_x, dfb.read.setTextureSlot(1));
        gl.uniform1f(advectProgram.uniforms.u_dt, dt);
        gl.uniform1f(advectProgram.uniforms.u_decayFactor, decayFactor);
        engine.draw(dfb.write);
        dfb.swap();
    }
    function applyBloom(dfb: DoubleFramebuffer, bloomIntensity: number) {
        if (bloomFrameBuffers.length < 2) return

        let prev = bloomFrameBuffers[0];
        bloomLightProgram.bind();
        gl.uniform1i(bloomLightProgram.uniforms.u_data, dfb.read.setTextureSlot(0));
        engine.draw(prev);

        for (let i = 1; i < bloomFrameBuffers.length; i++) {
            let next = bloomFrameBuffers[i];
            copyToFramebuffer(prev, next);
            prev = next;
        }
        filtersMap[FilterType.BLUR].apply(engine, prev, bloomFrameBuffers[bloomFrameBuffers.length - 2], 5);
        prev = bloomFrameBuffers[bloomFrameBuffers.length - 2];

        for (let i = bloomFrameBuffers.length - 3; i >= 1; i--) {
            let next = bloomFrameBuffers[i];
            copyToFramebuffer(prev, next);
            prev = next;
        }

        bloomBlendingProgram.bind();
        gl.uniform1i(bloomBlendingProgram.uniforms.u_data, dfb.read.setTextureSlot(0));
        gl.uniform1i(bloomBlendingProgram.uniforms.u_bloom, prev.setTextureSlot(1));
        gl.uniform1f(bloomBlendingProgram.uniforms.u_intensity, bloomIntensity);
        engine.draw(dfb.write);
        dfb.swap();
    }
    // function setBound(dfb: DoubleFramebuffer, offset: [number, number], scale: number) {
    //     boundaryProgram.bind();
    //     {
    //         gl.uniform1i(boundaryProgram.uniforms.u_x, dfb.read.setTextureSlot(2));
    //         gl.uniform2f(boundaryProgram.uniforms.u_size, dfb.read.width, dfb.read.height);
    //         gl.uniform2f(boundaryProgram.uniforms.u_offset, ...offset);
    //         gl.uniform1f(boundaryProgram.uniforms.u_scale, scale);
    //     }
    //     engine.draw(dfb.write);
    //     dfb.swap();

    // }
    // // function diffuse(dfb: DoubleFramebuffer, input: FrameBuffer, dt: number, diff: number, iterations: number = 50) {
    // //     diffuseProgram.bind()
    // //     {
    // //         gl.uniform1f(diffuseProgram.uniforms.u_diff, diff);
    // //         gl.uniform2f(diffuseProgram.uniforms.u_pixelSize, 1 / dfb.read.width, 1 / dfb.read.height);
    // //         gl.uniform1f(diffuseProgram.uniforms.u_dt, dt);
    // //         gl.uniform1i(diffuseProgram.uniforms.u_x0, input.setTextureSlot(0));
    // //     }
    // //     for (let i = 0; i < iterations; i++) {
    // //         gl.uniform1i(diffuseProgram.uniforms.u_x, dfb.read.setTextureSlot(1));
    // //         engine.draw(dfb.write);
    // //         dfb.swap();
    // //     }
    // // }
    function vel_step(dt: number, swirlFactor: number, pressureFactor: number, decayForctor: number) {
        swirl(dt, swirlFactor);
        project(pressureFactor);
        advect(velocity, dt, decayForctor);

    }

    function dens_step(dt: number, decayFactor: number) {
        advect(density, dt, decayFactor);
    }

    function applyForces(speed: number, radius: number, dt: number) {
        addDataShaderProgram.bind();
        while (forces.length) {
            const force = forces.pop();
            if (!force) continue;
            gl.uniform2f(addDataShaderProgram.uniforms.u_addPoint, force.x, force.y);
            gl.uniform1i(addDataShaderProgram.uniforms.u_set, 1);
            gl.uniform1i(addDataShaderProgram.uniforms.u_data, density.read.setTextureSlot(0));
            gl.uniform4f(addDataShaderProgram.uniforms.u_amount, force.color[0] / 255, force.color[1] / 255, force.color[2] / 255, 1.0);
            gl.uniform1f(addDataShaderProgram.uniforms.u_radius, radius * config.baseResolution);
            gl.uniform2f(addDataShaderProgram.uniforms.u_pixelSize, 1 / density.read.width, 1 / density.read.height);
            engine.draw(density.write);
            density.swap();

            gl.uniform1i(addDataShaderProgram.uniforms.u_data, velocity.read.setTextureSlot(0));
            gl.uniform1i(addDataShaderProgram.uniforms.u_set, 0);
            gl.uniform2f(addDataShaderProgram.uniforms.u_pixelSize, 1 / velocity.read.width, 1 / velocity.read.height);
            gl.uniform4f(addDataShaderProgram.uniforms.u_amount, force.vx * speed, force.vy * speed, 0.0, 1.0);
            gl.uniform1f(addDataShaderProgram.uniforms.u_radius, 0.5 * radius * config.baseResolution);
            engine.draw(velocity.write);
            velocity.swap();
        }
    }
    function drawToCanvas(dfb: DoubleFramebuffer, filters: FilterType[] = [], config: Webgl2FluidSimulationConfig) {
        copyToFramebuffer(dfb.read, tempFBLRESOLUTION2.read);
        filters.forEach(filter => {
            filtersMap[filter].apply(engine, tempFBLRESOLUTION2.read, tempFBLRESOLUTION2.write);
            tempFBLRESOLUTION2.swap();
        })
        if (filters.includes(FilterType.BLUR)) {
            filtersMap[FilterType.BLUR].apply(engine, tempFBLRESOLUTION2.read, tempFBLRESOLUTION2.write, 2)
            tempFBLRESOLUTION2.swap();
        }
        if (config.bloomIntensity > 0) {
            applyBloom(tempFBLRESOLUTION2, config.bloomIntensity);
        }
        displayProgram.bind();
        gl.uniform1i(displayProgram.uniforms.u_data, tempFBLRESOLUTION2.read.setTextureSlot(0))
        engine.draw();
    }
    const img = new Image();
    img.onload = () => {
        density = createDFB(gl, img.width, img.height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST,
            //@ts-ignore
            img);
        // applyBloom(density);
    }
    img.crossOrigin = 'anonymous';
    //img.src = 'https://images.unsplash.com/photo-1492539161849-b2b18e79c85f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
    return Object.freeze({
        config,
        render: (dt: number, filters?: FilterType[]) => {
            engine.render(() => {
                applyForces(config.speed, config.radius, dt);
                vel_step(dt, config.swirlFactor, config.pressureFactor, config.decayFactor * 0.1);
                dens_step(dt, config.decayFactor);
                drawToCanvas(density, filters, config)
            })
        },
        addForce: (x: number, y: number, vx: number, vy: number, color: Color) => {
            forces.push({ x, y, vx, vy, color })
        },
        updateConfig: (newConfig: Webgl2FluidSimulationConfig) => {
            if (config.currentResolution != newConfig.currentResolution) {
                resizerFrameBuffers(newConfig.currentResolution);
            }
            for (let option in newConfig) {
                config[option] = newConfig[option];
            }

        },
        reset: () => {
            initFrameBuffer(config.currentResolution);
        }
    })

}

function compilePrograms(gl: WebGL2RenderingContext) {
    const advectProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, advectShaderSource))
    const divergenceProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, divergeanceShaderSource))
    // const diffuseProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, diffuseShaderSource))
    const gradientSubstractProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, gradientSubstractShaderSource))
    const displayProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, displayShaderSource))
    const addDataShaderProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, addDataShaderSource))
    const copyProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, copyShaderSource))
    const clearProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, clearShaderSource))
    const pressureProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, pressureShaderSource))
    // const boundaryProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, boundaryShaderSource))
    const curlProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, curlShaderSource))
    const vorticityProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, vorticityShaderSource))
    const filterProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, filterShaderSource))
    const bloomLightProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, bloomLightShaderSource))
    const bloomBlendingProgram = new Program(gl, createShader(gl, gl.VERTEX_SHADER, vertexShaderShaderSource), createShader(gl, gl.FRAGMENT_SHADER, bloomBlendingSource))
    return {
        advectProgram, divergenceProgram,
        // diffuseProgram, 
        gradientSubstractProgram, displayProgram, addDataShaderProgram, copyProgram, clearProgram, pressureProgram, filterProgram, bloomLightProgram, bloomBlendingProgram,
        // boundaryProgram, 
        curlProgram, vorticityProgram
    }
}

function clamp(value: number, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
}

/* START */

export default class FluidSimulation {
    private rqId = 0;
    private now = 0;
    public canvas: HTMLCanvasElement;
    private simulation: Readonly<{ config: Webgl2FluidSimulationConfig; render: (dt: number, filters?: FilterType[]) => void; addForce: (x: number, y: number, vx: number, vy: number, color: Color) => void; updateConfig: (newConfig: Webgl2FluidSimulationConfig) => void; reset: () => void; }>;
    private filters: Set<FilterType> = new Set();
    constructor(canvas: HTMLCanvasElement) {
        this.simulation = init(canvas);
        this.canvas = canvas;
        this.initFilters();
    }
    start() {
        cancelAnimationFrame(this.rqId);
        this.now = Date.now();
        this.update();
    }
    initFilters() {
        this.filters.add(FilterType.BLUR);
        // this.filters.add(FilterType.EDGE_DETECT);
        //  this.filters.add(FilterType.SHARPEN)
    }
    pause() {
        cancelAnimationFrame(this.rqId);
    }
    addPoint(x: number, y: number, vx: number, vy: number, color: Color) {
        this.simulation.addForce(x, y, clamp(vx, -0.05, 0.05), clamp(vy, -0.05, 0.05), color);
    };
    static makeRandomColor(): Color {
        return [235 * Math.random(), 100 + 155 * Math.random(), 20 + 255 * Math.random()]
    };
    update() {
        const nnow = Date.now();
        this.simulation.render(
            0.016
            , Array.from(this.filters.values()),
            // (nnow - this.now) / 1000
        );
        this.now = nnow;
        this.rqId = requestAnimationFrame(() => {
            this.update();
        });
    }
    reset() {
        this.simulation.reset();
    }
    set config(config: Webgl2FluidSimulationConfig) {
        this.simulation.updateConfig(config);
    }
    get config() {
        return { ...this.simulation.config };
    }
}


