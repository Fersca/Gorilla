// Utilidades compartidas de la suite: carga del juego, watchdog de errores
// y el "solver" — una réplica exacta de la física del juego que calcula un
// ángulo/giro/fuerza ganador para el nivel que esté en pantalla.
//
// La puerta de entrada a todo es window.__game (definida en index.html):
//   { state, CFG, SCENARIOS, HOOP, camera, controls, switchScenario, newLevel, nav }
const { expect } = require("@playwright/test");

const GAME_URL = "http://127.0.0.1:8123/index.html";

// -------------------------------------------------- carga y watchdog
// Colecciona errores de página/consola; los tests los assertan al final.
// Se ignoran los fallos de red del detector de actualizaciones (version.json
// puede no existir o estar bloqueado por proxy: es el camino "sin conexión").
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const url = (m.location() && m.location().url) || "";
    const text = m.text();
    if (/version\.json/.test(url) || /version\.json|ERR_TUNNEL|ERR_CONNECTION/.test(text)) return;
    if (/Failed to load resource/.test(text) && /version\.json|github\.io/.test(url)) return;
    errors.push(`console(${url}): ${text}`);
  });
  return errors;
}

async function gotoGame(page, url = GAME_URL) {
  const errors = watchErrors(page);
  await page.goto(url);
  await page.waitForFunction(() => !!window.__game, null, { timeout: 30_000 });
  await page.waitForTimeout(2500); // que termine de armar el entorno y el banner
  return errors;
}

// cambia de escenario usando el selector real de la UI
async function goScen(page, key) {
  await page.click("#scenBtn");
  await page.waitForTimeout(400);
  await page.click(`[data-scen="${key}"]`);
  await page.waitForTimeout(2600);
}

// -------------------------------------------------- solver de física
// Réplica de stepBanana() con los mismos subpasos de 1/120 s y las mismas
// fórmulas de colisión (con márgenes de seguridad para exigir tiros limpios).
function simulate(cfg, info, angleDeg, yawDeg, power) {
  const dt = 1 / 120;
  const { basket: k, wind, windZ, thrower, handOffset, target, targetMesh, hoopBoardDX, gk, wall } = info;
  const a = (angleDeg * Math.PI) / 180;
  const yaw = (yawDeg * Math.PI) / 180;
  const hd = (info.dir || 1) < 0 ? Math.PI - yaw : yaw; // granja: el perrito tira hacia -x
  const v0 = power * cfg.powerToV;
  const h = Math.cos(a) * v0;
  let x = thrower.x + handOffset.x * Math.cos(hd);
  let z = thrower.z - handOffset.x * Math.sin(hd);
  let y = handOffset.y, px, py, pz;
  let vx = h * Math.cos(hd), vz = -h * Math.sin(hd), vy = Math.sin(a) * v0;
  for (let t = 0; t < 15; t += dt) {
    px = x; py = y; pz = z;
    vx += wind * dt; vz += (windZ || 0) * dt; vy -= cfg.gravity * dt;
    x += vx * dt; y += vy * dt; z += vz * dt;
    const dh = Math.hypot(x - k.x, z - k.z);
    if (target === "plush") {
      if (y < k.bodyH - 0.8 && y > 1 && dh < k.bodyR + 0.3) return true;
      if (y < 0.55 || Math.abs(x) > cfg.boundsX || Math.abs(z) > cfg.boundsX) return false;
      continue;
    }
    if (target === "goal") {
      if (wall.n > 0 && px <= wall.x && x > wall.x) {
        const f = (wall.x - px) / (x - px);
        const cy = py + (y - py) * f, cz = pz + (z - pz) * f;
        if (cy < 7.6 && Math.abs(cz - wall.z) < wall.half + 0.8) return false;
      }
      if (px <= k.x && x > k.x) {
        const f = (k.x - px) / (x - px);
        const cy = py + (y - py) * f, cz = pz + (z - pz) * f;
        if (cy < gk.h + 0.5 && Math.abs(cz - gk.z) < gk.half + 0.5) return false;
        if (cy < k.gh - 1 && Math.abs(cz - k.z) < k.gw - 1) return true;
        if (cy < k.gh + 0.6 && Math.abs(cz - k.z) < k.gw + 0.6) return false;
      }
      if (y < 0.45 || Math.abs(x) > cfg.boundsX || Math.abs(z) > cfg.boundsX) return false;
      continue;
    }
    if (target === "bullseye") {
      const c = Math.cos(k.rot || 0), s = Math.sin(k.rot || 0);
      const lx = c * (x - k.x) - s * (z - k.z);
      const lpx = c * (px - k.x) - s * (pz - k.z);
      if (lpx <= 0 && lx > 0) {
        const lz = s * (x - k.x) + c * (z - k.z);
        const lpz = s * (px - k.x) + c * (pz - k.z);
        const f = -lpx / (lx - lpx);
        const cy = py + (y - py) * f;
        const clz = lpz + (lz - lpz) * f;
        const dr = Math.hypot(cy - k.cy, clz);
        if (dr < k.rimR * 0.55) return true;
        if (targetMesh === "ring") {
          if (dr < k.rimR + 1.3) return false;
        } else if (cy >= 0 && Math.pow(cy / 9, 2) + Math.pow(clz / 5.2, 2) < 1) return false;
      }
      if (y < 0.45 || Math.abs(x) > cfg.boundsX || Math.abs(z) > cfg.boundsX) return false;
      continue;
    }
    // aro horizontal (canasto/tacho/aro de básquet): cruce interpolado
    if (vy < 0 && py >= k.rimY && y < k.rimY) {
      const f = (py - k.rimY) / (py - y);
      const cx = px + (x - px) * f;
      const cz = pz + (z - pz) * f;
      const dhc = Math.hypot(cx - k.x, cz - k.z);
      if (dhc < k.rimR * 0.55) return true;
      const edgeR = target === "hoop" ? k.rimR * 1.35 : k.rimR * 1.15;
      if (dhc < edgeR) return false;
    }
    if (target === "basket") {
      if (y < k.rimY && dh < k.rimR * 1.15) return false;
      if (k.pedestalH > 0 && y < k.baseY && y > 0 && dh < 2.7) return false;
    } else {
      const boardX = k.x + hoopBoardDX;
      if (x > boardX - 0.4 && x < boardX + 0.8 && Math.abs(z - k.z) < 3.9 && y > 10.9 && y < 16.6) return false;
      if (y < 14 && Math.hypot(x - (k.x + 4.6), z - k.z) < 1) return false;
    }
    if (y < 0.45 || Math.abs(x) > cfg.boundsX || Math.abs(z) > cfg.boundsX) return false;
  }
  return false;
}

// barre ángulo/giro/fuerza hasta encontrar un tiro que emboque
function solve(cfg, info) {
  const { basket: k, thrower } = info;
  const hd0 = (Math.atan2(-(k.z - thrower.z), k.x - thrower.x) * 180) / Math.PI;
  const raw = (info.dir || 1) < 0 ? 180 - hd0 : hd0;
  const yaw0 = Math.round(((((raw + 180) % 360) + 360) % 360) - 180);
  for (let dyaw = 0; dyaw <= 14; dyaw++) {
    for (const s of dyaw === 0 ? [0] : [-dyaw, dyaw]) {
      const yaw = Math.max(-45, Math.min(45, yaw0 + s));
      for (let angle = 25; angle <= 80; angle += 1) {
        for (let power = 22; power <= 100; power += 1) {
          if (simulate(cfg, info, angle, yaw, power)) return { angle, yaw, power };
        }
      }
    }
  }
  return null;
}

// fotografía del estado del nivel actual, para alimentar el solver
async function readInfo(page) {
  return page.evaluate(() => {
    const g = window.__game;
    const sc = g.SCENARIOS[g.state.scenKey];
    return {
      scen: g.state.scenKey,
      level: g.state.level,
      basket: JSON.parse(JSON.stringify(g.state.basket)),
      wind: g.state.wind,
      windZ: g.state.windZ,
      thrower: JSON.parse(JSON.stringify(g.state.thrower)),
      handOffset: sc.handOffset,
      target: sc.target,
      targetMesh: sc.targetMesh,
      hoopBoardDX: g.HOOP.boardDX,
      gk: JSON.parse(JSON.stringify(g.state.gk)),
      wall: JSON.parse(JSON.stringify(g.state.wall)),
      dir: g.state.dir || 1,
      farmTurn: g.state.farm && g.state.farm.turn,
      cfg: JSON.parse(JSON.stringify(g.CFG)),
    };
  });
}

// resuelve el nivel en pantalla, tira, y ASSERTA que el nivel sube
async function playLevel(page) {
  const info = await readInfo(page);
  const sol = solve(info.cfg, info);
  expect(sol, `sin solución para ${info.scen} nivel ${info.level} — blanco (${info.basket.x}, ${info.basket.z})`).toBeTruthy();
  await page.fill("#angle", String(sol.angle));
  await page.fill("#yaw", String(sol.yaw));
  await page.fill("#power", String(sol.power));
  await page.waitForTimeout(400);
  await page.click("#throwBtn");
  await page.waitForFunction((lvl) => window.__game.state.level === lvl + 1, info.level, { timeout: 120_000 });
  await page.waitForTimeout(500);
  return info;
}

// fuerza un nivel alto (dificultad: lejos + viento + blancos girados)
async function forceLevel(page, level) {
  await page.evaluate((lvl) => { window.__game.state.level = lvl; window.__game.newLevel(); }, level);
  await page.waitForTimeout(2400);
}

module.exports = { GAME_URL, watchErrors, gotoGame, goScen, simulate, solve, readInfo, playLevel, forceLevel };
