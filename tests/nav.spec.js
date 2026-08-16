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

  // giroscopio relativo a la pose inicial: la referencia es como esté el
  // teléfono al activar (acá: parado en vertical, beta=90)
  await fire(page, 50, 90, 0);         // pose de origen
  await page.waitForTimeout(400);
  await fire(page, 50, 90, 0);         // sin mover el teléfono…
  await page.waitForTimeout(1200);
  const d0 = await camDir(page);
  expect(Math.abs(d0.y)).toBeLessThan(0.15);   // …se mira al frente y derecho

  // girar el teléfono 90° gira la vista ~90° (suavizado: esperar que llegue)
  await fire(page, 50 + 90, 90, 0);
  await page.waitForTimeout(2600);
  const d1 = await camDir(page);
  const dot = d0.x * d1.x + d0.z * d1.z;
  expect(Math.abs(dot)).toBeLessThan(0.35);    // perpendicular ≈ giró 90°

  // el teléfono es una "ventana": inclinarlo hacia plano mira abajo,
  // pasarlo de la vertical (top hacia la cara) mira arriba
  await fire(page, 50, 90 - 30, 0);
  await page.waitForTimeout(2600);
  const down = await camDir(page);
  expect(down.y).toBeLessThan(-0.25);
  await fire(page, 50, 90 + 30, 0);
  await page.waitForTimeout(3400);
  const up = await camDir(page);
  expect(up.y).toBeGreaterThan(0.25);

  // el filtro suaviza: justo después de un salto grande del sensor, la
  // vista todavía no llegó al destino (persigue de a poco)
  await fire(page, 50, 90, 0);         // vuelve a la pose de origen
  await page.waitForTimeout(2600);
  await fire(page, 50 + 80, 90, 0);    // salto brusco de 80°
  await page.waitForTimeout(120);
  const mid = await page.evaluate(() => window.__game.nav.gyroYaw);
  expect(Math.abs(mid)).toBeLessThan(1.0);     // 80° ≈ 1.4 rad: aún en camino

  // mirar arrastrando el dedo/mouse
  await fire(page, 50, 90, 0);
  const y0 = await page.evaluate(() => window.__game.nav.dragYaw);
  await page.mouse.move(500, 200);
  await page.mouse.down();
  await page.mouse.move(650, 200, { steps: 5 });
  await page.mouse.up();
  const y1 = await page.evaluate(() => window.__game.nav.dragYaw);
  expect(Math.abs(y1 - y0)).toBeGreaterThan(0.2);

  // salir: vuelve la cámara orbital y los controles
  await page.waitForTimeout(1500);
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
