import { canvas2DConfig } from "../diver";

let index = 0;
canvas2DConfig.subscribe(s => {
    index = s.currentColorIndex;
})
export function makeInteractive(canvas: HTMLCanvasElement, simulation: { update: (x: number, y: number, index: number) => void }) {
    function paint(e) {
        const c = e.target;
        const rect = c.getBoundingClientRect();
        const scaleX = c.width / rect.width;
        const scaleY = c.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        simulation.update(Math.floor(x), Math.floor(y), index);
    }
    canvas.addEventListener('mousemove', paint)
    canvas.addEventListener('touchmove', paint)
}