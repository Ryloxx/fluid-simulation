import type { Color, Webgl2FluidSimulationConfig } from "./webglsimulation/simulation";
import type { Writable } from "svelte/store";
import { writable } from "svelte/store";


export const title = writable('Welcome');
export interface Webgl2FluidSimulationInteractiveConfig {
    multicolor: true,
    color: Color,
}



export const webgl2Config: Writable<Webgl2FluidSimulationConfig> = writable({
    baseResolution: 1024,
    currentResolution: 1024,
    radius: 0.00001,
    speed: 1,
    decayFactor: 0.2,
    swirlFactor: 10,
    pressureFactor: 0.1,
    bloomIntensity: 0.5,
});

export const webgl2InteractiveConfig: Writable<Webgl2FluidSimulationInteractiveConfig> = writable({
    multicolor: true,
    color: [0, 0, 0],
})

export interface Canvas2DFluidSimulationConfig {
    currentColorIndex: number,
    colors: string[],
    resolution: number,
}
export const canvas2DConfig: Writable<Canvas2DFluidSimulationConfig> = writable({
    currentColorIndex: 0,
    colors: ['#ffffff'],
    resolution: 100,
})

export function hexToRgb(hex): Color {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}
