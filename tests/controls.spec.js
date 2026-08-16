// Controles y HUD: sliders con botones −/+, teclado, menú plegable
// y cambio de escenario por el selector.
const { test, expect } = require("@playwright/test");
const { gotoGame, goScen } = require("./helpers");

test("botones −/+ y teclado mueven los sliders", async ({ page }) => {
  const errors = await gotoGame(page);
  const val = (id) => page.evaluate((i) => +document.getElementById(i).value, id);

  const a0 = await val("angle");
  await page.click('.stepBtn[data-t="angle"][data-d="1"]');
  expect(await val("angle")).toBe(a0 + 1);
  await page.click('.stepBtn[data-t="angle"][data-d="-1"]');
  expect(await val("angle")).toBe(a0);

  const p0 = await val("power");
  await page.keyboard.press("ArrowRight");
  expect(await val("power")).toBe(p0 + 1);
  const y0 = await val("yaw");
  await page.keyboard.press("q");
  expect(await val("yaw")).toBe(y0 + 1);
  expect(errors).toEqual([]);
});

test("la flechita pliega y despliega el menú del HUD", async ({ page }) => {
  const errors = await gotoGame(page);
  const visible = () => page.evaluate(() => document.getElementById("hudMenu").style.display !== "none");
  expect(await visible()).toBe(true);
  await page.click("#menuToggle");
  expect(await visible()).toBe(false);
  // plegado, los chips informativos siguen a la vista
  expect(await page.isVisible("#levelTxt")).toBe(true);
  await page.click("#menuToggle");
  expect(await visible()).toBe(true);
  expect(errors).toEqual([]);
});

test("el selector de escenarios salta directo y resetea el nivel", async ({ page }) => {
  const errors = await gotoGame(page);
  await goScen(page, "granja");
  const st = await page.evaluate(() => ({
    scen: window.__game.state.scenKey,
    level: window.__game.state.level,
    label: document.getElementById("scenBtn").textContent,
  }));
  expect(st.scen).toBe("granja");
  expect(st.level).toBe(1);
  expect(st.label).toContain("Granja");
  expect(errors).toEqual([]);
});

test("el botón de viento OFF garantiza viento cero", async ({ page }) => {
  const errors = await gotoGame(page);
  await page.click("#windBtn");   // ON → OFF
  await page.evaluate(() => window.__game.newLevel());
  await page.waitForTimeout(2200);
  const w = await page.evaluate(() => ({ x: window.__game.state.wind, z: window.__game.state.windZ }));
  expect(w.x).toBe(0);
  expect(w.z).toBe(0);
  expect(errors).toEqual([]);
});
