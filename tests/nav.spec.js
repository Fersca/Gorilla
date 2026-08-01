// Modo paseo (primera persona): entrar, caminar, mirar con giroscopio y
// con arrastre, y salir restaurando la cámara orbital.
const { test, expect } = require("@playwright/test");
const { gotoGame } = require("./helpers");

const fire = (page, alpha, beta, gamma) =>
  page.evaluate(([a, b, g]) => {
    window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { alpha: a, beta: b, gamma: g }));
  }, [alpha, beta, gamma]);

const camDir = (page) =>
  page.evaluate(() => {
    const d = window.__game.camera.getWorldDirection(new window.THREE.Vector3());
    return { x: +d.x.toFixed(2), y: +d.y.toFixed(2), z: +d.z.toFixed(2) };
  });

test("modo paseo completo: entrar, caminar, mirar, salir", async ({ page }) => {
  const errors = await gotoGame(page);

  // entrar: aparece el caminante, cámara en primera persona, joystick visible
  await page.click("#navBtn");
  await page.waitForTimeout(800);
  const st = await page.evaluate(() => ({
    nav: document.body.classList.contains("nav"),
    padVisible: getComputedStyle(document.getElementById("navPad")).display !== "none",
    controlsHidden: getComputedStyle(document.getElementById("controls")).display === "none",
    camY: window.__game.camera.position.y,
  }));
  expect(st.nav).toBe(true);
  expect(st.padVisible).toBe(true);
  expect(st.controlsHidden).toBe(true);
  expect(Math.abs(st.camY - 9.8)).toBeLessThan(1.6);   // altura de ojos

  // caminar con W: avanza hacia donde mira (+x al inicio), z estable
  const p0 = await page.evaluate(() => ({ x: window.__game.nav.x, z: window.__game.nav.z }));
  await page.keyboard.down("w");
  await page.waitForTimeout(2500);
  await page.keyboard.up("w");
  const p1 = await page.evaluate(() => ({ x: window.__game.nav.x, z: window.__game.nav.z }));
  expect(p1.x).toBeGreaterThan(p0.x + 1);
  expect(Math.abs(p1.z - p0.z)).toBeLessThan(1);

  // giroscopio: rotar el teléfono 90° gira la vista ~90°
  await fire(page, 50, 5, 0);          // baseline
  await page.waitForTimeout(900);
  const d0 = await camDir(page);
  await fire(page, 50 + 90, 5, 0);
  await page.waitForTimeout(900);
  const d1 = await camDir(page);
  const dot = d0.x * d1.x + d0.z * d1.z;
  expect(Math.abs(dot)).toBeLessThan(0.3);   // perpendicular ≈ giró 90°

  // inclinar el teléfono mira arriba/abajo
  await fire(page, 50, 5 + 25, 0);
  await page.waitForTimeout(900);
  const d2 = await camDir(page);
  expect(Math.abs(d2.y - d1.y)).toBeGreaterThan(0.2);

  // mirar arrastrando el dedo/mouse
  await fire(page, 50, 5, 0);
  const y0 = await page.evaluate(() => window.__game.nav.dragYaw);
  await page.mouse.move(500, 200);
  await page.mouse.down();
  await page.mouse.move(650, 200, { steps: 5 });
  await page.mouse.up();
  const y1 = await page.evaluate(() => window.__game.nav.dragYaw);
  expect(Math.abs(y1 - y0)).toBeGreaterThan(0.2);

  // salir: vuelve la cámara orbital y los controles
  await page.click("#navBtn");
  await page.waitForTimeout(700);
  const out = await page.evaluate(() => ({
    nav: document.body.classList.contains("nav"),
    controlsVisible: getComputedStyle(document.getElementById("controls")).display !== "none",
    padHidden: getComputedStyle(document.getElementById("navPad")).display === "none",
    orbit: window.__game.controls.enabled,
  }));
  expect(out).toEqual({ nav: false, controlsVisible: true, padHidden: true, orbit: true });

  // el juego sigue vivo: un tiro normal
  const t0 = await page.evaluate(() => window.__game.state.tries);
  await page.click("#throwBtn");
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__game.state.tries)).toBe(t0 + 1);
  expect(errors).toEqual([]);
});
