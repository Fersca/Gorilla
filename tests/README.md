# Tests de Apunto y Tiro

Suite de tests end-to-end con **Playwright Test** que carga el `index.html`
real en Chromium headless (render por software, sin GPU) y verifica el juego
completo: física, escenarios, controles, giroscopio, modo paseo y el sistema
de versiones.

## Cómo correr todo

```bash
npm install                              # deps (incluye @playwright/test)
npx playwright install chromium          # solo si no hay un Chromium ya instalado*
npm test                                 # corre toda la suite
npx playwright test tests/gyro.spec.js   # un archivo suelto
npx playwright test -g "granja"          # un test por nombre
```

\* En los entornos remotos de Claude Code ya hay un Chromium preinstalado en
`/opt/pw-browsers` y **no hace falta (ni funciona) descargar otro**:
`playwright.config.js` lo detecta y lo usa solo. En una máquina nueva o en CI,
el `npx playwright install chromium` estándar alcanza.

No hace falta levantar nada a mano: la config arranca `tests/serve.js`
(servidor estático sin dependencias) en `http://127.0.0.1:8123`.

## Cómo funciona la suite

La puerta de entrada a todo es **`window.__game`**, el objeto que `index.html`
expone para los tests: `{ state, CFG, SCENARIOS, HOOP, camera, controls,
switchScenario, newLevel, nav }`. No hay que parsear la UI: el estado del
juego se lee y se manipula por ahí.

- **`helpers.js`** — lo compartido: carga del juego con watchdog de errores
  de consola (cualquier `pageerror` hace fallar el test), y el **solver**:
  una réplica exacta de la física (`stepBanana` con subpasos de 1/120 s y las
  mismas fórmulas de colisión) que barre ángulo/giro/fuerza hasta encontrar
  un tiro ganador para el nivel aleatorio que tocó. Como la física del juego
  es determinista e independiente del framerate, si el solver dice que un
  tiro emboca, el juego tiene que subir de nivel — eso es el assert.
- **`scenarios.spec.js`** — emboques en los 7 escenarios, incluidos niveles
  altos forzados (viento fuerte, blancos girados, barrera larga, aro alto) y
  el cambio de turno de la granja (vaquita → perrito → vaquita, con el
  perrito tirando de derecha a izquierda).
- **`controls.spec.js`** — sliders/−/+/teclado, menú plegable, selector de
  escenarios, viento OFF.
- **`gyro.spec.js`** — modo giroscopio de puntería: mapeo de ejes
  (**Y→ángulo, Z→giro, X→fuerza**), panel oculto, botoncito redondo, salida.
  Los sensores se simulan despachando `DeviceOrientationEvent` sintéticos.
- **`nav.spec.js`** — modo paseo en primera persona: entrar, caminar (WASD),
  mirar con giroscopio y con arrastre, salir.
- **`update.spec.js`** — versionado: si `/version.json` anuncia una versión
  mayor que `GAME_VERSION`, el juego recarga **una sola vez** (guardián
  anti-loop en sessionStorage); botón Instalar visible solo en navegador
  (oculto simulando Capacitor y PWA standalone). El servidor de tests sirve
  `tests/.version-override` como `/version.json` para simular versiones.
- **`tools/screenshots.js`** — utilitario (no es un test): regenera las
  capturas del README (`screenshots/*.png`), una por escenario.

## Cosas a saber para mantenerla

- **SwiftShader es lento**: el juego corre a pocos FPS en headless. Por eso
  los timeouts son generosos (`timeout: 300s`, esperas de 2-3 s tras cambiar
  de escenario) y `workers: 1`. No los achiques sin probar.
- La física usa **subpasos fijos de 1/120 s** justamente para que el
  framerate no cambie las trayectorias — si tocás la física del juego, el
  solver de `helpers.js` tiene que cambiar **igual** (son espejo).
- Si agregás un **escenario nuevo**: sumá su colisión a `simulate()` en
  `helpers.js` (copiando la rama nueva de `stepBanana` de `index.html`, con
  margen de seguridad) y un test en `scenarios.spec.js`.
- Si agregás **UI nueva**: exponé lo que necesites en `window.__game` en vez
  de scrapear el DOM.
- El fetch de actualizaciones a `github.io` está **bloqueado por proxy** en
  los entornos remotos: el watchdog de errores ya lo ignora (es el camino
  "sin conexión" del juego, manejado a propósito).
- CI: `.github/workflows/tests.yml` corre la suite en cada push (no bloquea
  los deploys; para que los bloquee, agregá `needs: test` a los otros
  workflows). El Chromium de Playwright queda **cacheado entre corridas**
  (clave = versión de Playwright): solo se re-descarga al actualizar la
  dependencia; en el resto de las corridas solo corre `install-deps` (apt).
