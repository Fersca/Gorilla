// Modo giroscopio de puntería: mapeo de ejes (Y=ángulo, Z=giro, X=fuerza),
// panel oculto con botoncito redondo, y salida limpia.
// Los eventos del sensor se simulan con DeviceOrientationEvent sintéticos.
const { test, expect } = require("@playwright/test");
const { gotoGame } = require("./helpers");

const fire = (page, alpha, beta, gamma) =>
  page.evaluate(([a, b, g]) => {
    window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { alpha: a, beta: b, gamma: g }));
  }, [alpha, beta, gamma]);

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

  const vals = () => page.evaluate(() => ({
    angle: +document.getElementById("angle").value,
    yaw: +document.getElementById("yaw").value,
    power: +document.getElementById("power").value,
  }));
  const before = await vals();

  await fire(page, 100, 10, -5);        // baseline: el teléfono como esté al activar
  await fire(page, 100, 10, -5 + 20);   // eje Y (gamma) +20° → ángulo +24
  let v = await vals();
  expect(v.angle).toBe(before.angle + 24);
  expect(v.yaw).toBe(before.yaw);
  expect(v.power).toBe(before.power);

  await fire(page, 100 + 25, 10, -5);   // eje Z (alpha) +25° → giro +20
  v = await vals();
  expect(v.yaw).toBe(before.yaw + 20);

  await fire(page, 100, 10 + 20, -5);   // eje X (beta) +20° → fuerza +16
  v = await vals();
  expect(v.power).toBe(before.power + 16);

  // el cruce 0/360 del sensor no rompe: clampea al mínimo del slider
  await fire(page, 350, 10, -5);
  v = await vals();
  expect(v.power).toBeGreaterThanOrEqual(20);

  // el botoncito redondo dispara de verdad
  const tries0 = await page.evaluate(() => window.__game.state.tries);
  await page.click("#gyroThrowBtn");
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__game.state.tries)).toBe(tries0 + 1);
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
