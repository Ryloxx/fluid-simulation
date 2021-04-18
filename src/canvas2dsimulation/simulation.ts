import { writable, get } from 'svelte/store';
import { idx, dens_step, vel_step } from './lib';

function get_from_UI(N, d, u, v, updateArr) {
  for (let i = 0; i < N + 2; i++) {
    for (let j = 0; j < N + 2; j++) {
      const [ud, uu, uv] = updateArr[idx(i, j, N)];
      d[idx(i, j, N)] = ud;
      u[idx(i, j, N)] = uu;
      v[idx(i, j, N)] = uv;
      updateArr[idx(i, j, N)] = [0, 0, 0];
    }
  }
}
export function draw_dens(N, dens, cxt, color) {
  for (let i = 0; i < N + 2; i++) {
    for (let j = 0; j < N + 2; j++) {
      cxt.fillStyle = color;
      cxt.globalAlpha = Math.max(0, Math.min(1, dens[idx(i, j, N)]));
      cxt.fillRect(i, j, 1, 1);
    }
  }
}

/* **************************************************************** */
const BASE_N = 100;
export const simulating = writable(false);
export const canvas = writable(null);
export const colors = writable(["#ffffff"]);
export const N = writable(BASE_N);

let n = BASE_N;
let cxt = null;

let rqId;
let datas;

function getVars() {
  return {
    visc: (0.0000001 * n) / BASE_N,
    diff: (0.0000001 * n) / BASE_N,
    dt: (0.3 * n) / BASE_N,
    vx: (5 * n) / BASE_N,
    vy: (5 * n) / BASE_N,
  };
}
export function reset() {
  const SIZE = (n + 2) ** 2;
  datas = [];
  get(colors)?.map((color) => {
    let u = Array(SIZE).fill(0);
    let v = Array(SIZE).fill(0);
    let u_prev = Array(SIZE).fill(0);
    let v_prev = Array(SIZE).fill(0);
    let dens = Array(SIZE).fill(0);
    let dens_prev = Array(SIZE).fill(0);
    let updateArr = Array(SIZE).fill([0, 0, 0]);
    datas.push({ u, v, u_prev, v_prev, dens, dens_prev, updateArr, color });
  });
}

N.subscribe((newn) => {
  n = newn;
  const c = get(canvas);
  if (c) {
    c.width = newn;
    c.height = newn;
  }
  reset();
});

simulating.subscribe((state) => {
  if (!state) {
    cancelAnimationFrame(rqId);
  } else {
    loop();
  }
});

canvas.subscribe((c) => {
  if (!c) {
    cxt = null;
    return;
  }
  c.width = n + 2;
  c.height = n + 2;
  cxt = c.getContext('2d');
});

colors.subscribe((s) => {
  if (s?.length) {
    reset();
  }
});

function loop() {
  if (cxt) {
    const vars = getVars();
    cxt.clearRect(0, 0, n + 2, n + 2);
    datas.forEach(
      ({ dens, dens_prev, u, u_prev, v, v_prev, updateArr, color }) => {
        get_from_UI(n, dens_prev, u_prev, v_prev, updateArr);
        vel_step(n, u, v, u_prev, v_prev, vars.visc, vars.dt);
        dens_step(n, dens, dens_prev, u, v, vars.diff, vars.dt);
        draw_dens(n, dens, cxt, color);
      },
    );
  }
  rqId = requestAnimationFrame(loop);
}

export function update(x, y, index) {
  const { vx, vy, dt } = getVars();
  const dens = vx * vy * 2;
  if (datas?.[index]?.updateArr) {
    const cidx = idx(x, y, n);
    datas[index].updateArr[cidx] = [dens, 0, 0];
    datas.forEach(({ updateArr }) => {
      updateArr[cidx][1] = vx;
      updateArr[cidx][2] = vy;
    });
  }
}

function getNeighbors(i, j) {
  const top = i > 0 ? idx(i - 1, j, n) : null;
  const bottom = i < n ? idx(i + 1, j, n) : null;
  const left = j > 0 ? idx(i, j - 1, n) : null;
  const right = j < n ? idx(i, j + 1, n) : null;
  return [top, left, bottom, right];
}
