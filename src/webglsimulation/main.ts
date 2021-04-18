import { webgl2InteractiveConfig } from "../diver";
import FluidSimulation from "./simulation";
import type { Color } from "./simulation";
import gsap from 'gsap';
import { Engine } from "./lib";
let color: Color = null;
let currentColor = getColor();
setInterval(() => {
    currentColor = getColor();
}, 3000)

// HELPER //
function getColor() {
    return color ?? FluidSimulation.makeRandomColor();
}
webgl2InteractiveConfig.subscribe(s => {
    if (s.multicolor) {
        color = null;
    } else {
        color = s.color;
    }
})

// CANVAS HANDLING //
export function makeInteractive(simulation: FluidSimulation) {
    const { canvas } = simulation;
    let dist = 0;

    webgl2InteractiveConfig.subscribe(s => {
        if (!s.multicolor) {
            currentColor = s.color;
        }
    })

    function lock(event: any) {
        let x = event.offsetX || event.touches?.[0].pageX;
        let y = event.offsetY || event.touches?.[0].pageY;
        let lx = x;
        let ly = y;
        const multiplier = 1;
        function addForce(event: any) {
            const nx = event.offsetX || event.touches?.[0].pageX;
            const ny = event.offsetY || event.touches?.[0].pageY;
            const dx = nx - x;
            const dy = y - ny;
            const { clientWidth: cwidth, clientHeight: cheight } = canvas;
            simulation.addPoint(nx / cwidth, 1 - (ny / cheight),
                dx * multiplier,
                dy * multiplier,
                [currentColor[0], currentColor[1], currentColor[2]])
            dist += Math.sqrt((nx - lx) ** 2 + (ny - ly) ** 2);
            const hypot = Math.sqrt(cwidth ** 2 + cheight ** 2);
            if (dist > hypot * 0.1) {
                console.log('ok')
                dist = 0;
                x = nx;
                y = ny;
            }
            lx = nx;
            ly = ny;
        }
        function unlock() {
            canvas.removeEventListener('mouseup', unlock);
            canvas.removeEventListener('mousemove', addForce);
            canvas.removeEventListener('touchend', unlock);
            canvas.removeEventListener('touchmove', addForce);
        }

        canvas.addEventListener('mousemove', addForce);
        canvas.addEventListener('mouseup', unlock);
        canvas.addEventListener('touchmove', addForce);
        canvas.addEventListener('touchend', unlock);
    }
    function setInteractivity(interactive: boolean) {
        if (interactive) {
            setInteractivity(false);
            canvas.addEventListener('touchstart', lock);
            canvas.addEventListener('mousedown', lock);
        } else {
            canvas.removeEventListener('touchstart', lock);
            canvas.removeEventListener('mousedown', lock);
        }
    }
    setInteractivity(true);
    return setInteractivity;
}


// GSAP ANIMAITONS //


// function makeAnimations(args:{x:number,y:number,vx:number,vy:number}[])
export function makePresetsAnimations(simulation: FluidSimulation) {
    function getAnimtionColor() {
        return <Color>currentColor.map(x => x);
    }
    function makeArc({ direction = [1, 1], start = [0, 0], startRadius = 1, endRadius = startRadius }: {
        direction: [number, number],
        start: [number, number],
        startRadius: number,
        endRadius: number,
    }) {
        const temp = {
            radius: startRadius,
        }
        const onUpdate = function () {
            const dt = this.totalProgress();
            const x = (direction[0] * (dt + start[0]) + 1) % 1;
            const y = (direction[1] * Math.sqrt((temp.radius ** 2) - (((dt + start[1]) / temp.radius) ** 2)) + 1) % 1;
            simulation.addPoint(x, y, dt * direction[0], dt * direction[1], getAnimtionColor())
        }
        return gsap.timeline().to(temp, {
            radius: endRadius,
            duration: 5,
        }).eventCallback('onUpdate', onUpdate);
    }

    function makeSpiral({
        start = [0, 0],
        round = 10,
    }) {
        const temp = {}
        const onUpdate = function () {
            const dt = this.totalProgress() * (8 * round);
            const x = dt * Math.cos(dt) / (10 * round);
            const y = dt * Math.sin(dt) / (10 * round);
            simulation.addPoint(start[0] + x, start[1] + y, -x, -y, getAnimtionColor())
        }
        return gsap.timeline().to(temp, { duration: 20 }).eventCallback('onUpdate', onUpdate);
    }
    function makeLineDrift({
        start = [0, 0],
        round = 10,
    }) {
        const temp = {}
        const onUpdate = function () {
            const dt = 0.5 * this.totalProgress() * (8 * round);
            const x = dt * Math.cos(dt) / (10 * round);
            const y = dt * Math.cos(dt) / (10 * round);
            simulation.addPoint(start[0] + x, start[1] + y, x, y, getAnimtionColor())
        }
        return gsap.timeline().to(temp, { duration: 20 }).eventCallback('onUpdate', onUpdate);
    }

    function makeThrust({
        start = [0, 0],
        direction = [1, 1],
    }) {
        const temp = {}
        const onUpdate = function () {
            simulation.addPoint(start[0], start[1], direction[0], direction[1], getAnimtionColor())
        }
        return gsap.timeline().to(temp, { duration: 20 }).eventCallback('onUpdate', onUpdate);
    }

    return {
        spiral: makeSpiral({
            start: [0.5, 0.5],
            round: 6
        }).pause(),
        arcs:
            makeArc({
                direction: [1, 1],
                start: [0, 0],
                startRadius: 1,
                endRadius: 1,
            }).add(makeArc({
                direction: [-1, 1],
                start: [0, 0],
                startRadius: 1,
                endRadius: 1,
            }), 0).pause(),
        lineDrift: makeLineDrift({
            start: [0.5, 0.5],
            round: 10
        }).pause(),
        thrustCollapse: makeThrust({
            start: [0.25, 0.5],
            direction: [1, 0],
        }).add(makeThrust({
            start: [0.75, 0.5],
            direction: [-1, 0],
        }), 0).pause(),
        cornerThrusts: makeThrust({
            start: [0.1, 0.1],
            direction: [1, 2],
        }).add(makeThrust({
            start: [0.1, 0.9],
            direction: [1, -2]
        }), 0).add(makeThrust({
            start: [0.9, 0.1],
            direction: [-1, 2],
        }), 0).add(makeThrust({
            start: [0.9, 0.9],
            direction: [-1, -2]
        }), 0).pause(),
        chimney: makeThrust({
            start: [0, 0],
            direction: [1, 0]
        }).add(makeThrust({
            start: [1, 0],
            direction: [-1, 0]
        }), 0).pause(),
        flame: makeThrust({
            start: [.5, .3],
            direction: [0, 1]
        }).pause(),
        floor: makeThrust({
            start: [.5, 0.01],
            direction: [0, -1]
        }).pause(),
    }
}



/* ***************************** */

