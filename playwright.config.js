// Configuración de la suite de tests (Playwright Test).
//
// El navegador se resuelve solo:
//  1. Si el Chromium que @playwright/test tiene "pinneado" está instalado
//     (caso normal en CI tras `npx playwright install chromium`), se usa ese.
//  2. Si no, se busca uno preinstalado (p. ej. /opt/pw-browsers/chromium en
//     los entornos remotos de Claude Code) — sin descargar nada.
// Siempre se corre con render por software (SwiftShader): funciona en
// cualquier máquina/CI sin GPU y hace los screenshots reproducibles.
const fs = require("fs");
const path = require("path");
const { defineConfig } = require("@playwright/test");

function resolveChromium() {
  try {
    const pinned = require("@playwright/test").chromium.executablePath();
    if (fs.existsSync(pinned)) return undefined; // usar el default del runner
  } catch (e) { /* sigue el fallback */ }
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers"].filter(Boolean);
  for (const root of roots) {
    const direct = path.join(root, "chromium");
    if (fs.existsSync(direct)) return direct;
    let dirs = [];
    try { dirs = fs.readdirSync(root); } catch (e) { continue; }
    for (const d of dirs) {
      for (const c of [
        path.join(root, d, "chrome-linux", "headless_shell"),
        path.join(root, d, "chrome-linux", "chrome"),
        path.join(root, d, "chrome-linux64", "chrome"),
      ]) {
        if (fs.existsSync(c)) return c;
      }
    }
  }
  return undefined; // que Playwright falle con su mensaje estándar (hay que instalar)
}

module.exports = defineConfig({
  testDir: "./tests",
  // SwiftShader es lento: los tests de emboque simulan niveles enteros
  timeout: 300_000,
  workers: 1,                 // el render por software satura CPU: de a uno
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    viewport: { width: 844, height: 390 },   // celular apaisado
    launchOptions: {
      executablePath: resolveChromium(),
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  // servidor estático que sirve el juego (y permite falsear version.json)
  webServer: {
    command: "node tests/serve.js",
    url: "http://127.0.0.1:8123/index.html",
    reuseExistingServer: !process.env.CI,
  },
});
