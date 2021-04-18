import Canvas2D from "./components/Canvas2D.svelte";
import Webgl2 from "./components/Webgl2.svelte";
import Webgl2Config from "./components/Webgl2Config.svelte";
import Canvas2DConfig from "./components/Canvas2DConfig.svelte";
import type { SvelteComponentDev } from "svelte/internal";

export enum SimulationType {
    WEBGL2,
    CANVAS2D,
}

export enum InputType {
    RANGE,
    COLOR,
    CHECKBOX,
    SELECT,
}
export const simulationsComponents: Record<SimulationType, {
    component: typeof SvelteComponentDev,
    configComponent: typeof SvelteComponentDev,
    title: string,
}> = {
    [SimulationType.WEBGL2]: {
        component: Webgl2,
        configComponent: Webgl2Config,
        title: 'Fluid Simulation - Webgl2'
    },
    [SimulationType.CANVAS2D]: {
        component: Canvas2D,
        configComponent: Canvas2DConfig,
        title: 'Fluid Simulation - Canvas2D'
    }
}