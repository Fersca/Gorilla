// Genera los íconos de launcher de Android a partir de icons/icon-512.png
// y las pantallas splash a partir del color de fondo del juego.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "icons/icon-512.png");
const RES = path.join(ROOT, "android/app/src/main/res");

const densities = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

(async () => {
  for (const [dir, size] of Object.entries(densities)) {
    const out = path.join(RES, dir);
    await sharp(SRC).resize(size, size).png().toFile(path.join(out, "ic_launcher.png"));
    await sharp(SRC).resize(size, size).png().toFile(path.join(out, "ic_launcher_round.png"));
    // foreground adaptativo: el arte al 60% centrado (zona segura)
    const fg = Math.round(size * 108 / 48);
    const art = Math.round(fg * 0.6);
    await sharp(SRC)
      .resize(art, art)
      .extend({
        top: Math.floor((fg - art) / 2),
        bottom: Math.ceil((fg - art) / 2),
        left: Math.floor((fg - art) / 2),
        right: Math.ceil((fg - art) / 2),
        background: { r: 11, g: 15, b: 36, alpha: 1 },
      })
      .png()
      .toFile(path.join(out, "ic_launcher_foreground.png"));
  }
  // splash: fondo del color del juego con el ícono centrado
  const splashDirs = fs.readdirSync(RES).filter((d) => d.startsWith("drawable"));
  for (const dir of splashDirs) {
    const file = path.join(RES, dir, "splash.png");
    if (!fs.existsSync(file)) continue;
    const meta = await sharp(file).metadata();
    const iconSize = Math.round(Math.min(meta.width, meta.height) * 0.35);
    const icon = await sharp(SRC).resize(iconSize, iconSize).png().toBuffer();
    await sharp({
      create: { width: meta.width, height: meta.height, channels: 4, background: { r: 11, g: 15, b: 36, alpha: 1 } },
    })
      .composite([{ input: icon, gravity: "center" }])
      .png()
      .toFile(file + ".tmp");
    fs.renameSync(file + ".tmp", file);
  }
  console.log("íconos y splash de Android generados");
})();
