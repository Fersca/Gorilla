// El origen del giroscopio del modo paseo es la POSE del teléfono al
// activar: aunque el teléfono esté acostado o inclinado de cualquier
// manera, el personaje arranca mirando al frente y derecho, y la vista
// responde a los movimientos relativos a esa pose.
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

// poses "incómodas": acostado boca arriba, reclinado, torcido
const POSES = [
  { name: "acostado (pantalla a la cara, casi plano)", a: 200, b: 20, g: 5 },
  { name: "reclinado a 45° y girado", a: 123, b: 47, g: -12 },
  { name: "torcido de costado", a: 310, b: 65, g: 35 },
];

for (const pose of POSES) {
  test(`activar ${pose.name}: arranca mirando al frente y derecho`, async ({ page }) => {
    const errors = await gotoGame(page);
    await page.click("#navBtn");
    await page.waitForTimeout(600);
    await fire(page, pose.a, pose.b, pose.g);   // esta pose queda como origen
    await page.waitForTimeout(400);
    await fire(page, pose.a, pose.b, pose.g);   // el teléfono no se movió
    await page.waitForTimeout(1500);
    const d = await camDir(page);
    // mirando al frente (+x, hacia el blanco) y sin inclinación vertical
    expect(d.x).toBeGreaterThan(0.9);
    expect(Math.abs(d.y)).toBeLessThan(0.12);
    expect(errors).toEqual([]);
  });
}
