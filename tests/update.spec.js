// Versionado y auto-actualización, y visibilidad del botón Instalar.
// El servidor de tests (tests/serve.js) sirve tests/.version-override como
// /version.json, así se simula "el sitio publicó una versión más nueva".
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { GAME_URL, watchErrors } = require("./helpers");

const OVERRIDE = path.join(__dirname, ".version-override");
const setRemoteVersion = (v) => fs.writeFileSync(OVERRIDE, JSON.stringify({ version: v }));

test.afterEach(() => { try { fs.unlinkSync(OVERRIDE); } catch (e) {} });

test("hay versión nueva: recarga UNA sola vez, sin loop", async ({ page }) => {
  setRemoteVersion(9999);
  const errors = watchErrors(page);
  let loads = 0;
  page.on("load", () => loads++);
  await page.goto(GAME_URL);
  await page.waitForTimeout(7000);   // banner (1.6 s) + recarga + margen
  expect(loads).toBe(2);             // carga inicial + una recarga
  const guard = await page.evaluate(() => sessionStorage.getItem("gorilla-update-try"));
  expect(guard).toBe("9999");
  await page.waitForTimeout(4000);   // no sigue recargando
  expect(loads).toBe(2);
  expect(errors).toEqual([]);
});

test("versión al día: no recarga y el botón Instalar se ve en el navegador", async ({ page }) => {
  setRemoteVersion(0);   // menor o igual que GAME_VERSION → sin cambios
  const errors = watchErrors(page);
  let loads = 0;
  page.on("load", () => loads++);
  await page.goto(GAME_URL);
  await page.waitForTimeout(5000);
  expect(loads).toBe(1);
  expect(await page.evaluate(() => document.getElementById("installBtn").style.display !== "none")).toBe(true);
  // la versión se muestra en Acerca de…
  expect(await page.evaluate(() => document.getElementById("verTxt").textContent)).toMatch(/versión \d+/);
  expect(errors).toEqual([]);
});

test("app nativa (Capacitor): el botón Instalar se oculta", async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true }; });
  await page.goto(GAME_URL);
  await page.waitForFunction(() => !!window.__game);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => document.getElementById("installBtn").style.display === "none")).toBe(true);
  expect(errors).toEqual([]);
});

test("PWA instalada (standalone): el botón Instalar se oculta", async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => { Object.defineProperty(navigator, "standalone", { get: () => true }); });
  await page.goto(GAME_URL);
  await page.waitForFunction(() => !!window.__game);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => document.getElementById("installBtn").style.display === "none")).toBe(true);
  expect(errors).toEqual([]);
});
