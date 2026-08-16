// Regenera las capturas del README (screenshots/*.png), una por escenario.
// Uso:  node tests/tools/screenshots.js   (con `node tests/serve.js` corriendo,
// o directamente: se sirve solo si el puerto está libre)
//
// Requiere el Chromium de Playwright (mismo mecanismo que playwright.config.js).
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const SCENS = ["ciudad", "selva", "basquet", "arquero", "futbol", "auto", "granja"];

function resolveChromium() {
  try {
    const pinned = chromium.executablePath();
    if (fs.existsSync(pinned)) return undefined;
  } catch (e) {}
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"].filter(Boolean);
  for (const root of roots) {
    const direct = path.join(root, "chromium");
    if (fs.existsSync(direct)) return direct;
  }
  return undefined;
}

(async () => {
  const srv = spawn("node", [path.join(ROOT, "tests", "serve.js")], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 1200));
  const browser = await chromium.launch({
    executablePath: resolveChromium(),
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1.5 });
  await page.goto("http://127.0.0.1:8123/index.html");
  await page.waitForFunction(() => !!window.__game);
  await page.waitForTimeout(3000);
  for (const key of SCENS) {
    await page.evaluate((k) => window.__game.switchScenario(k), key);
    await page.waitForTimeout(3500);   // entorno + banner que se va
    const out = path.join(ROOT, "screenshots", `${key}.png`);
    await page.screenshot({ path: out });
    console.log("✓", out);
  }
  await browser.close();
  srv.kill();
})();
