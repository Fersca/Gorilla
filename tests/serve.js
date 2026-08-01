// Servidor estático mínimo para los tests — sin dependencias.
// Sirve el repo entero en http://127.0.0.1:8123 y tiene un truco para el
// sistema de actualizaciones: si existe tests/.version-override, ese archivo
// se sirve como /version.json (así los tests simulan "hay versión nueva").
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OVERRIDE = path.join(__dirname, ".version-override");
const PORT = +(process.env.PORT || 8123);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (pathname === "/version.json" && fs.existsSync(OVERRIDE)) {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(fs.readFileSync(OVERRIDE));
    return;
  }
  const file = path.normalize(path.join(ROOT, pathname === "/" ? "/index.html" : pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("404");
    return;
  }
  res.writeHead(200, {
    "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(fs.readFileSync(file));
}).listen(PORT, "127.0.0.1", () => {
  console.log(`juego servido en http://127.0.0.1:${PORT}/index.html`);
});
