# Apunto y Tiro — guía para agentes

Juego 3D (homenaje a GORILLA.BAS) hecho **entero en `index.html`**
(HTML+CSS+JS, ~6.000 líneas) con three.js r147 **vendoreado** en `vendor/`
(UMD, sin CDN ni build: se abre hasta con doble click). La UI y los textos
son en **español rioplatense**. Publicado en <https://fersca.github.io/Gorilla/>.

## Cómo trabajar acá

1. Editá `index.html` (todo vive ahí: escena, física, escenarios, UI, sonido).
2. **Corré los tests**: `npm install && npm test` (ver `tests/README.md`;
   en los entornos remotos de Claude Code el Chromium ya está preinstalado y
   la config lo detecta sola — no corras `playwright install`).
3. Si el cambio afecta el contenido del juego, **subí `GAME_VERSION`** (la
   constante en `index.html`): es lo que dispara la auto-actualización en los
   dispositivos ya instalados. El deploy genera `version.json` desde ahí.
4. Commit + push a la rama de trabajo. **No crear PRs salvo pedido explícito.**
5. El push dispara 3 workflows: tests, deploy a Pages (rama `gh-pages`) y
   build del APK (release `app-latest`). Verificá que queden en verde.

## Mapa del código (`index.html`)

- `SCENARIOS`: config de los 7 escenarios (ciudad/selva/basquet/arquero/
  futbol/auto/granja) — thrower, projectile, target, dificultad, textos.
- `state`: todo el estado vivo (nivel, viento 2D, proyectil en vuelo,
  `dir` ±1 para el sentido del tiro, `farm.turn` para los turnos de granja).
- Física: `stepBanana()` con **subpasos fijos de 1/120 s** (determinista,
  independiente del framerate — no romper eso) y colisiones interpoladas por
  cruce de plano. `throwHeading()` invierte el tiro cuando tira el perrito.
- Modelos y entornos: 100 % procedurales por código (`buildCity`,
  `buildJungle`, `buildFarm`…; personajes `gorilla`, `police`, `cowPlush`…).
- Modos: giroscopio de puntería (ejes **Y→ángulo, Z→giro, X→fuerza**), modo
  paseo en primera persona (`setNav`, joystick táctil + WASD + sensor), modo
  Renders (`setRenders`: vitrina de .glb importados de `assets/models/` vía
  `THREE.GLTFLoader` vendoreado — ojo: no cargan por `file://`, usar http) y
  modo Living (`setLiving`: el living de la casa con muebles Kenney CC0 en
  `assets/models/living/`, paseo con colisiones vía `navObstacles`+raycast).
- **Gotcha**: el `boxGeo` compartido está **anclado a la base**
  (`translate(0, 0.5, 0)`, va de y=0 a 1): al escalarlo, posicionar en y=0,
  NO en h/2. Los materiales de Kenney usan textura-atlas + colores por
  vértice: para teñirlos hay que sacar `map` y `vertexColors` (ver
  `loadLiving`).
- Actualizaciones: `GAME_VERSION` + `checkForUpdate()` (consulta
  `version.json`, nunca cacheado por el SW; guardián anti-loop por sesión).
- **`window.__game`** expone estado y funciones: es la costura de test —
  cualquier feature nueva debería exponer ahí lo que los tests necesiten.

## Tests

Suite Playwright en `tests/` (`npm test`). El corazón es un **solver** que
replica la física y emboca niveles reales en los 7 escenarios; si tocás la
física, actualizá su espejo en `tests/helpers.js`. Detalles y convenciones:
`tests/README.md`. Para regenerar las capturas del README:
`node tests/tools/screenshots.js`.

## Infra

- `manifest.webmanifest` + `sw.js`: PWA offline (al cambiar assets, subir la
  versión del caché `apunto-y-tiro-vN` en `sw.js`).
- Capacitor (`capacitor.config.json`, `android/`): APK nativo; el build de CI
  hace `npm run sync:android` y publica `apunto-y-tiro.apk` en el release
  `app-latest`. `allowNavigation` permite que la app nativa cargue el sitio
  al auto-actualizarse. iOS quedó descartado a propósito (se usa la PWA).
- Workflows en `.github/workflows/`: `tests.yml`, `deploy-pages.yml` (genera
  `version.json` y hace force-push huérfano a `gh-pages`), `build-android.yml`.

## Entorno remoto (Claude Code)

- El proxy **bloquea `github.io` y unpkg**: no intentes fetchear el sitio
  publicado; verificá los deploys por la API de GitHub Actions. npm sí anda.
- Chromium para tests: preinstalado en `/opt/pw-browsers` (SwiftShader, pocos
  FPS — por eso los timeouts generosos de la suite).
- No usar `gh` CLI: usar las tools MCP de GitHub.
