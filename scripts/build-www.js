// Arma la carpeta www/ que Capacitor empaqueta dentro de las apps nativas.
// Copia solo lo que el juego necesita (no el proyecto nativo ni el repo entero).
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "www");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const items = ["index.html", "manifest.webmanifest", "sw.js", "vendor", "icons", "assets"];
for (const item of items) {
  const src = path.join(ROOT, item);
  const dst = path.join(OUT, item);
  fs.cpSync(src, dst, { recursive: true });
}
console.log("www/ listo:", fs.readdirSync(OUT).join(", "));
