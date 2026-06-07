import type { MaterialParams, DeviceGeometry, CalculationConfig, LLGResult, VortexState } from '../types';

const MU0 = 4 * Math.PI * 1e-7;
const VORTEX_THRESHOLD = 0.5;
const DIVERGENCE_THRESHOLD = 1.5;

interface Vec3 { x: number; y: number; z: number; }
const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const norm = (v3: Vec3): number => Math.sqrt(v3.x * v3.x + v3.y * v3.y + v3.z * v3.z);
const normalize = (v3: Vec3): Vec3 => {
  const n = norm(v3);
  return n > 1e-12 ? v(v3.x / n, v3.y / n, v3.z / n) : v(0, 0, 1);
};
const cross = (a: Vec3, b: Vec3): Vec3 => v(
  a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x
);
const add = (a: Vec3, b: Vec3): Vec3 => v(a.x + b.x, a.y + b.y, a.z + b.z);
const scale = (v3: Vec3, s: number): Vec3 => v(v3.x * s, v3.y * s, v3.z * s);
const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;

interface Grid { nx: number; ny: number; nz: number; dx: number; dy: number; dz: number; positions: number[][]; }

function buildGrid(geo: DeviceGeometry): Grid {
  const nx = Math.max(2, Math.round(geo.length / geo.meshSize));
  const ny = Math.max(2, Math.round(geo.width / geo.meshSize));
  const nz = Math.max(1, Math.round(geo.thickness / geo.meshSize));
  const dx = geo.length / nx, dy = geo.width / ny, dz = geo.thickness / nz;
  const positions: number[][] = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++)
      for (let k = 0; k < nz; k++)
        positions.push([(i + 0.5) * dx, (j + 0.5) * dy, (k + 0.5) * dz]);
  return { nx, ny, nz, dx, dy, dz, positions };
}

function idx3(grid: Grid, idx: number): [number, number, number] {
  const { ny, nz } = grid;
  return [Math.floor(idx / (ny * nz)), Math.floor((idx % (ny * nz)) / nz), idx % nz];
}

function computeAnisotropyField(m: Vec3, K1: number, Ms: number): Vec3 {
  const u = v(0, 0, 1);
  return scale(u, (2 * K1 / (MU0 * Ms)) * dot(m, u));
}

function computeExchangeField(mAll: Vec3[], idx: number, grid: Grid, A: number, Ms: number): Vec3 {
  const [i, j, k] = idx3(grid, idx);
  let neighbors = 0;
  let sum = v(0, 0, 0);
  const offsets: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (const [di, dj, dk] of offsets) {
    const ni = i + di, nj = j + dj, nk = k + dk;
    if (ni >= 0 && ni < grid.nx && nj >= 0 && nj < grid.ny && nk >= 0 && nk < grid.nz) {
      sum = add(sum, mAll[ni * grid.ny * grid.nz + nj * grid.nz + nk]);
      neighbors++;
    }
  }
  const lap = scale(add(sum, scale(mAll[idx], -neighbors)), 1 / (grid.dx * grid.dx));
  return scale(lap, 2 * A / (MU0 * Ms));
}

function computeDemagnetizationEnergy(mAll: Vec3[]): number {
  let sumMz2 = 0;
  for (const m of mAll) sumMz2 += m.z * m.z;
  return 0.5 * MU0 * (sumMz2 / mAll.length);
}

function computeDivergence(mAll: Vec3[], idx: number, grid: Grid): number {
  const [i, j, k] = idx3(grid, idx);
  const getM = (di: number, dj: number, dk: number): Vec3 | null => {
    const ni = i + di, nj = j + dj, nk = k + dk;
    if (ni < 0 || ni >= grid.nx || nj < 0 || nj >= grid.ny || nk < 0 || nk >= grid.nz) return null;
    return mAll[ni * grid.ny * grid.nz + nj * grid.nz + nk];
  };
  const mxp = getM(1, 0, 0), mxn = getM(-1, 0, 0);
  const myp = getM(0, 1, 0), myn = getM(0, -1, 0);
  const mzp = getM(0, 0, 1), mzn = getM(0, 0, -1);
  let div = 0;
  if (mxp && mxn) div += (mxp.x - mxn.x) / (2 * grid.dx);
  if (myp && myn) div += (myp.y - myn.y) / (2 * grid.dy);
  if (mzp && mzn) div += (mzp.z - mzn.z) / (2 * grid.dz);
  return Math.abs(div);
}

function llgDerivative(m: Vec3, H_eff: Vec3, gRed: number, gAlphaRed: number, dt: number): Vec3 {
  const mCrossH = cross(m, H_eff);
  const mCrossMCrossH = cross(m, mCrossH);
  return scale(add(scale(mCrossH, -gRed), scale(mCrossMCrossH, -gAlphaRed)), dt);
}

export async function solveLLG(
  materialParams: MaterialParams, geometry: DeviceGeometry, config: CalculationConfig
): Promise<LLGResult> {
  const { saturationMagnetization: Ms, anisotropyConstant: K1, exchangeStiffness: A,
    dampingCoefficient: alpha, gyromagneticRatio: gamma } = materialParams;
  const { externalField, simulationTime, timeStep } = config;

  const grid = buildGrid(geometry);
  const N = grid.positions.length;
  const nSteps = Math.min(200, Math.max(100, Math.round(simulationTime / timeStep)));
  const dt = simulationTime / nSteps * 1e-9;
  const H_ext = scale(normalize(v(externalField.directionX, externalField.directionY, externalField.directionZ)),
    externalField.magnitude);

  let m: Vec3[] = Array.from({ length: N }, () =>
    normalize(v(0.01 * (Math.random() - 0.5), 0.01 * (Math.random() - 0.5), 1))
  );

  const time: number[] = [], mx: number[] = [], my: number[] = [], mz: number[] = [];
  const exchangeEnergy: number[] = [], demagnetizationEnergy: number[] = [];
  const zeemanEnergy: number[] = [], totalEnergy: number[] = [];
  const domainStates: { position: number[]; magnetization: number[]; time: number }[] = [];
  const vortexStates: VortexState[] = [];
  const flipTimes: number[][] = Array.from({ length: N }, () => []);
  const flipped = new Set<number>();
  const snapInt = Math.max(1, Math.floor(nSteps / 10));
  const vortexInt = Math.max(1, Math.floor(nSteps / 5));
  const gRed = gamma / (1 + alpha * alpha), gAlphaRed = gamma * alpha / (1 + alpha * alpha);

  for (let step = 0; step <= nSteps; step++) {
    const tNs = step * dt * 1e9;
    let avgMx = 0, avgMy = 0, avgMz = 0, exEnergy = 0;
    for (let idx = 0; idx < N; idx++) {
      avgMx += m[idx].x; avgMy += m[idx].y; avgMz += m[idx].z;
      const H_ex = computeExchangeField(m, idx, grid, A, Ms);
      exEnergy += -0.5 * MU0 * Ms * dot(m[idx], H_ex) * grid.dx * grid.dy * grid.dz;
    }
    avgMx /= N; avgMy /= N; avgMz /= N; exEnergy /= N;
    const demag = computeDemagnetizationEnergy(m);
    const zeeman = -MU0 * Ms * dot(v(avgMx, avgMy, avgMz), H_ext);
    const total = exEnergy + demag + zeeman;

    time.push(tNs); mx.push(avgMx); my.push(avgMy); mz.push(avgMz);
    exchangeEnergy.push(exEnergy); demagnetizationEnergy.push(demag);
    zeemanEnergy.push(zeeman); totalEnergy.push(total);

    for (let idx = 0; idx < N; idx++)
      if (!flipped.has(idx) && m[idx].z < 0) { flipped.add(idx); flipTimes[idx].push(tNs); }

    if (step % snapInt === 0)
      for (let idx = 0; idx < N; idx += Math.max(1, Math.floor(N / 50)))
        domainStates.push({ position: grid.positions[idx], magnetization: [m[idx].x, m[idx].y, m[idx].z], time: tNs });

    if (config.vortexDetectionEnabled && step % vortexInt === 0)
      for (let idx = 0; idx < N; idx++) {
        const div = computeDivergence(m, idx, grid);
        const topo = norm(cross(m[idx], v(0, 0, 1)));
        if (div > DIVERGENCE_THRESHOLD && topo > VORTEX_THRESHOLD) {
          vortexStates.push({ time: tNs, position: grid.positions[idx], topologicalCharge: m[idx].z > 0 ? 1 : -1 });
          break;
        }
      }

    if (step === nSteps) break;
    const mPred: Vec3[] = new Array(N), mNew: Vec3[] = new Array(N);

    for (let idx = 0; idx < N; idx++) {
      const H_eff = add(add(H_ext, computeAnisotropyField(m[idx], K1, Ms)),
        computeExchangeField(m, idx, grid, A, Ms));
      mPred[idx] = normalize(add(m[idx], llgDerivative(m[idx], H_eff, gRed, gAlphaRed, dt)));
    }
    for (let idx = 0; idx < N; idx++) {
      const H1 = add(add(H_ext, computeAnisotropyField(m[idx], K1, Ms)),
        computeExchangeField(m, idx, grid, A, Ms));
      const H2 = add(add(H_ext, computeAnisotropyField(mPred[idx], K1, Ms)),
        computeExchangeField(mPred, idx, grid, A, Ms));
      const dm1 = llgDerivative(m[idx], H1, gRed, gAlphaRed, dt);
      const dm2 = llgDerivative(mPred[idx], H2, gRed, gAlphaRed, dt);
      mNew[idx] = normalize(add(m[idx], scale(add(dm1, dm2), 0.5)));
    }
    m = mNew;
  }
  return { time, mx, my, mz, exchangeEnergy, demagnetizationEnergy, zeemanEnergy, totalEnergy,
    flipTimes, domainStates, vortexStates };
}
