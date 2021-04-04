export function idx(i, j, N) {
  return i * (N + 2) + j;
}

function set_bnd(N, b, x) {
  for (let i = 1; i <= N; i++) {
    // x[idx(0, i,N)] = b == 1 ? 0 : 0;
    // x[idx(N + 1, i,N)] = b == 1 ? 0.1 : 0;
    // x[idx(i, 0,N)] = b == 2 ? 0 : 0;
    // x[idx(i, N + 1,N)] = b == 2 ? 0.1 : 0;

    x[idx(0, i, N)] = b == 1 ? -x[idx(1, i, N)] : x[idx(1, i, N)];
    x[idx(N + 1, i, N)] = b == 1 ? -x[idx(N, i, N)] : x[idx(N, i, N)];
    x[idx(i, 0, N)] = b == 2 ? -x[idx(i, 1, N)] : x[idx(i, 1, N)];
    x[idx(i, N + 1, N)] = b == 2 ? -x[idx(i, N, N)] : x[idx(i, N, N)];

    // x[idx(0, i,N)] = b == 1 ? -x[idx(1, i,N)] : 0.01;
    // x[idx(N + 1, i,N)] = b == 1 ? -x[idx(N, i,N)] : 0.01;
    // x[idx(i, 0,N)] = b == 2 ? -x[idx(i, 1,N)] : 0.01;
    // x[idx(i, N + 1,N)] = b == 2 ? -x[idx(i, N,N)] : 0.01;
  }
  x[idx(0, 0, N)] = 0.5 * (x[idx(1, 0, N)] + x[idx(0, 1, N)]);
  x[idx(0, N + 1, N)] = 0.5 * (x[idx(1, N + 1, N)] + x[idx(0, N, N)]);
  x[idx(N + 1, 0, N)] = 0.5 * (x[idx(N, 0, N)] + x[idx(N + 1, 1, N)]);
  x[idx(N + 1, N + 1, N)] = 0.5 * (x[idx(N, N + 1, N)] + x[idx(N + 1, N, N)]);
}

function add_source(N, x, s, dt) {
  let size = (N + 2) ** 2;
  for (let i = 0; i < size; i++) {
    x[i] += dt * s[i];
  }
}

function diffuse(N, b, x, x0, diff, dt) {
  const a = diff * dt * N ** 2;
  for (let k = 0; k < 20; k++) {
    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        x[idx(i, j, N)] =
          (x0[idx(i, j, N)] +
            a *
              (x[idx(i + 1, j, N)] +
                x[idx(i - 1, j, N)] +
                x[idx(i, j + 1, N)] +
                x[idx(i, j - 1, N)])) /
          (1 + 4 * a);
      }
    }
    set_bnd(N, b, x);
  }
}

function advect(N, b, d, d0, u, v, dt) {
  let i0, j0, i1, j1, x, y, s0, t0, s1, t1, dt0;
  dt0 = dt * N;
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      x = i - dt0 * u[idx(i, j, N)];
      y = j - dt0 * v[idx(i, j, N)];
      if (x < 0.5) x = 0.5;
      if (x > N + 0.5) x = N + 0.5;
      i0 = Math.floor(x);
      i1 = i0 + 1;
      if (y < 0.5) y = 0.5;
      if (y > N + 0.5) y = N + 0.5;
      j0 = Math.floor(y);
      j1 = j0 + 1;
      s1 = x - i0;
      s0 = 1 - s1;
      t1 = y - j0;
      t0 = 1 - t1;
      d[idx(i, j, N)] =
        s0 * (t0 * d0[idx(i0, j0, N)] + t1 * d0[idx(i0, j1, N)]) +
        s1 * (t0 * d0[idx(i1, j0, N)] + t1 * d0[idx(i1, j1, N)]);
    }
  }
  set_bnd(N, b, d);
}
function project(N, u, v, p, div) {
  let h = 1 / N;
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      div[idx(i, j, N)] =
        -0.5 *
        h *
        (u[idx(i + 1, j, N)] -
          u[idx(i - 1, j, N)] +
          v[idx(i, j + 1, N)] -
          v[idx(i, j - 1, N)]);
      p[idx(i, j, N)] = 0;
    }
  }
  set_bnd(N, 0, div);
  set_bnd(N, 0, p);
  for (let k = 0; k < 20; k++) {
    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        p[idx(i, j, N)] =
          (div[idx(i, j, N)] +
            p[idx(i - 1, j, N)] +
            p[idx(i + 1, j, N)] +
            p[idx(i, j - 1, N)] +
            p[idx(i, j + 1, N)]) /
          4;
      }
    }
    set_bnd(N, 0, p);
  }
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      u[idx(i, j, N)] -=
        (0.5 * (p[idx(i + 1, j, N)] - p[idx(i - 1, j, N)])) / h;
      v[idx(i, j, N)] -=
        (0.5 * (p[idx(i, j + 1, N)] - p[idx(i, j - 1, N)])) / h;
    }
  }
  set_bnd(N, 1, u);
  set_bnd(N, 2, v);
}
export function dens_step(N, x, x0, u, v, diff, dt) {
  add_source(N, x, x0, dt);
  diffuse(N, 0, x0, x, diff, dt);
  advect(N, 0, x, x0, u, v, dt);
}

export function vel_step(N, u, v, u0, v0, visc, dt) {
  add_source(N, u, u0, dt);
  add_source(N, v, v0, dt);
  diffuse(N, 1, u0, u, visc, dt);
  diffuse(N, 2, v0, v, visc, dt);
  project(N, u0, v0, u, v);
  advect(N, 1, u, u0, u0, v0, dt);
  advect(N, 2, v, v0, u0, v0, dt);
  project(N, u, v, u0, v0);
}
