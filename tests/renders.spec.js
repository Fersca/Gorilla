// Modo Renders 🦌: la vitrina de modelos glTF descargados (assets/models/)
// se carga con GLTFLoader, los 5 animales aparecen animados, los controles
// de tiro se ocultan, y al salir el juego vuelve a jugarse normal.
const { test, expect } = require("@playwright/test");
const { gotoGame } = require("./helpers");

test("renders: carga los 5 modelos glTF animados y el juego sigue vivo al salir", async ({ page }) => {
  const errors = await gotoGame(page);

  // entrar: se cargan los .glb (Horse, Fox, Flamingo, Parrot, Stork)
  await page.click("#rendersBtn");
  await page.waitForFunction(() => window.__game.renders().models === 5, null, { timeout: 60_000 });
  const st = await page.evaluate(() => ({
    ...window.__game.renders(),
    body: document.body.classList.contains("renders"),
    controlsHidden: getComputedStyle(document.getElementById("controls")).display === "none",
    btn: document.getElementById("rendersBtn").textContent,
  }));
  expect(st.on).toBe(true);
  expect(st.models).toBe(5);
  expect(st.mixers).toBe(5);            // todos con su animación andando
  expect(st.body).toBe(true);
  expect(st.controlsHidden).toBe(true);
  expect(st.btn).toContain("ON");

  // los animales se mueven de verdad: la posición orbital de uno cambia
  const x0 = await page.evaluate(() => window.__game.renders().x0);
  await page.waitForTimeout(2500);
  const x1 = await page.evaluate(() => window.__game.renders().x0);
  expect(x1).not.toBe(x0);

  // en modo renders no se puede tirar
  const tries0 = await page.evaluate(() => window.__game.state.tries);
  await page.keyboard.press(" ");
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__game.state.tries)).toBe(tries0);

  // salir: vuelve el juego normal y se puede tirar
  await page.click("#rendersBtn");
  await page.waitForTimeout(2600);
  const out = await page.evaluate(() => ({
    on: window.__game.renders().on,
    body: document.body.classList.contains("renders"),
    controlsVisible: getComputedStyle(document.getElementById("controls")).display !== "none",
  }));
  expect(out).toEqual({ on: false, body: false, controlsVisible: true });
  await page.click("#throwBtn");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__game.state.tries)).toBe(tries0 + 1);
  expect(errors).toEqual([]);
});
