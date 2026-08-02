// Modo Living 🛋️: la recreación del living de casa se arma con muebles glTF
// descargados (Kenney Furniture Kit), se puede orbitar, y el modo paseo
// adentro tiene COLISIONES: ni las paredes ni los muebles se atraviesan.
const { test, expect } = require("@playwright/test");
const { gotoGame } = require("./helpers");

test("living: carga los muebles, se orbita, y el paseo choca con muebles y paredes", async ({ page }) => {
  const errors = await gotoGame(page);

  // entrar: cargan todos los .glb del kit
  await page.click("#livingBtn");
  await page.waitForFunction(() => {
    const l = window.__game.living();
    return l.models === l.total;
  }, null, { timeout: 60_000 });
  const st = await page.evaluate(() => ({
    ...window.__game.living(),
    body: document.body.classList.contains("living"),
    controlsHidden: getComputedStyle(document.getElementById("controls")).display === "none",
    orbit: window.__game.controls.enabled,
  }));
  expect(st.on).toBe(true);
  expect(st.models).toBe(st.total);
  expect(st.collisions).toBe(true);   // los rayos anti-atravesar están armados
  expect(st.body).toBe(true);
  expect(st.controlsHidden).toBe(true);
  expect(st.orbit).toBe(true);        // sin paseo, la cámara orbital sigue activa

  // paseo adentro del living
  await page.click("#navBtn");
  await page.waitForTimeout(900);
  const p0 = await page.evaluate(() => ({ x: window.__game.nav.x, z: window.__game.nav.z }));
  expect(p0.x).toBe(32);              // aparece en el hall

  // caminar hacia el estar (−x): avanza… hasta que el puf Tango lo frena
  await page.keyboard.down("w");
  await page.waitForTimeout(6000);
  await page.keyboard.up("w");
  const p1 = await page.evaluate(() => ({ x: window.__game.nav.x, z: window.__game.nav.z }));
  expect(p1.x).toBeLessThan(25);      // caminó de verdad
  expect(p1.x).toBeGreaterThan(-11);  // pero NO atravesó el puf/los muebles

  // media vuelta y caminar hacia la puerta (+x): la pared lo frena
  await page.evaluate(() => { window.__game.nav.dragYaw = 0; window.__game.nav.gyroYaw = 0; });
  await page.waitForTimeout(600);
  await page.keyboard.down("w");
  await page.waitForTimeout(6000);
  await page.keyboard.up("w");
  const p2 = await page.evaluate(() => window.__game.nav.x);
  expect(p2).toBeLessThan(40);        // no atravesó la puerta/pared de entrada
  expect(p2).toBeGreaterThan(p1.x);   // pero sí caminó hacia allá

  // salir del living apaga también el paseo y el juego sigue vivo
  await page.click("#livingBtn");
  await page.waitForTimeout(2600);
  const out = await page.evaluate(() => ({
    on: window.__game.living().on,
    nav: document.body.classList.contains("nav"),
    collisions: window.__game.living().collisions,
    controlsVisible: getComputedStyle(document.getElementById("controls")).display !== "none",
  }));
  expect(out).toEqual({ on: false, nav: false, collisions: false, controlsVisible: true });
  const tries0 = await page.evaluate(() => window.__game.state.tries);
  await page.click("#throwBtn");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__game.state.tries)).toBe(tries0 + 1);
  expect(errors).toEqual([]);
});
