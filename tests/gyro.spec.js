// Modo giroscopio de puntería: la POSE del teléfono al activar es el origen
// (quaterniones) y los movimientos se miden sobre los ejes del propio
// teléfono: Y→ángulo, Z→giro, X→fuerza. La señal pasa por un filtro
// atenuador, así que los tests repiten cada lectura hasta converger.
// Los sensores se simulan con DeviceOrientationEvent sintéticos.
const { test, expect } = require("@playwright/test");
const { gotoGame } = require("./helpers");

// dispara la misma lectura n veces (el filtro converge: 0.7^20 ≈ 0)
const fire = async (page, alpha, beta, gamma, n = 1) => {
  for (let i = 0; i < n; i++) {
    await page.evaluate(([a, b, g]) => {
      window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { alpha: a, beta: b, gamma: g }));
    }, [alpha, beta, gamma]);
  }
};

const vals = (page) => page.evaluate(() => ({
  angle: +document.getElementById("angle").value,
  yaw: +document.getElementById("yaw").value,
  power: +document.getElementById("power").value,
}));

test("giroscopio: ejes Y→ángulo, Z→giro, X→fuerza; el botón redondo dispara", async ({ page }) => {
  const errors = await gotoGame(page);
  await page.click("#gyroBtn");
  await page.waitForTimeout(400);

  const ui = await page.evaluate(() => ({
    gyro: document.body.classList.contains("gyro"),
    controlsHidden: getComputedStyle(document.getElementById("controls")).display === "none",
    roundVisible: getComputedStyle(document.getElementById("gyroThrowBtn")).display !== "none",
  }));
  expect(ui).toEqual({ gyro: true, controlsHidden: true, roundVisible: true });

  const before = await vals(page);
  await fire(page, 100, 10, -5);            // pose de origen

  await fire(page, 100, 10, -5 + 20, 20);   // eje Y del teléfono +20° → ángulo +24
  let v = await vals(page);
  expect(v.angle).toBe(before.angle + 24);
  expect(v.yaw).toBe(before.yaw);           // los otros ejes no se mueven
  expect(v.power).toBe(before.power);

  await fire(page, 100, 10, -5, 20);        // vuelve al origen
  await fire(page, 100, 10 + 20, -5, 20);   // eje X +20° → fuerza +16
  v = await vals(page);
  expect(v.power).toBe(before.power + 16);

  await fire(page, 100, 10, -5, 20);
  await fire(page, 100 + 25, 10, -5, 20);   // eje Z (≈vertical, teléfono casi plano) +25° → giro ≈ +20
  v = await vals(page);
  expect(Math.abs(v.yaw - (before.yaw + 20))).toBeLessThanOrEqual(2);

  // un giro enorme no rompe: clampea al rango del slider
  await fire(page, 100 - 110, 10, -5, 25);
  v = await vals(page);
  expect(v.yaw).toBe(-45);

  // el botoncito redondo dispara de verdad
  const tries0 = await page.evaluate(() => window.__game.state.tries);
  await page.click("#gyroThrowBtn");
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__game.state.tries)).toBe(tries0 + 1);
  expect(errors).toEqual([]);
});

test("giroscopio acostado: la pose rara es el origen y los ejes siguen al teléfono", async ({ page }) => {
  const errors = await gotoGame(page);
  await page.click("#gyroBtn");
  await page.waitForTimeout(400);
  const before = await vals(page);

  // teléfono acostado/reclinado y torcido: esa pose queda como origen…
  await fire(page, 217, 38, 24);
  await fire(page, 217, 38, 24, 20);        // …y sin moverlo, nada cambia
  let v = await vals(page);
  expect(v).toEqual(before);

  // rotar +20° sobre el eje Y DEL TELÉFONO desde esa pose → ángulo +24 igual
  await fire(page, 217, 38, 24 + 20, 20);
  v = await vals(page);
  expect(v.angle).toBe(before.angle + 24);
  expect(v.power).toBe(before.power);
  expect(errors).toEqual([]);
});

test("giroscopio OFF: vuelven los sliders", async ({ page }) => {
  const errors = await gotoGame(page);
  await page.click("#gyroBtn");
  await page.waitForTimeout(300);
  await page.click("#gyroBtn");
  await page.waitForTimeout(300);
  const ui = await page.evaluate(() => ({
    gyro: document.body.classList.contains("gyro"),
    controlsVisible: getComputedStyle(document.getElementById("controls")).display !== "none",
    roundHidden: getComputedStyle(document.getElementById("gyroThrowBtn")).display === "none",
  }));
  expect(ui).toEqual({ gyro: false, controlsVisible: true, roundHidden: true });
  expect(errors).toEqual([]);
});
