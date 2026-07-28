# 🦍 Gorilla Banana 3D

Un homenaje moderno al clásico **GORILLA.BAS** de QBasic, hecho en HTML + JavaScript con **three.js** (renderizado 3D con WebGL).

Elegís **ángulo**, **giro** y **fuerza**, y la física (tiro parabólico 3D con gravedad y viento) decide si embocás.

## Escenarios

El botón del HUD (arriba a la izquierda) cambia entre tres escenarios:

| Escenario | Qué pasa |
|-----------|----------|
| 🏙️ **Ciudad** | Un policía practica puntería tirando piedras a un tacho de basura metálico entre los edificios. El tacho se mueve por nivel. |
| 🌴 **Selva** | El gorila en su hábitat: árboles, palmeras, helechos en primer plano y luciérnagas. El canasto (sobre troncos) se mueve por nivel. |
| 🏀 **Básquet** | Un jugador tira al aro (tablero, hierro y red) en un **estadio con tribunas llenas de público**. Acá el aro es fijo: lo que cambia por nivel es **tu posición en la cancha**, cada vez más lejos y con más ángulo. |

## Cómo jugar

Abrí `index.html` en cualquier navegador (funciona directo desde el archivo, sin servidor ni build). En el celular ocupa toda la pantalla; se ve mejor apaisado.

### Instalar como app 📲

El juego es una **PWA**: desde el navegador del celular usá *"Agregar a pantalla de inicio"* / *"Instalar app"* y queda un ícono del gorila en el escritorio. Abierto desde ahí corre en **pantalla completa**, sin barra de direcciones ni controles del navegador, y funciona **offline** (el service worker cachea todo).

- **Ángulo**, **Giro** y **Fuerza**: con los sliders, o con el teclado (`↑`/`↓` ángulo, `Q`/`E` giro, `←`/`→` fuerza).
- **Giro**: rota al gorila sobre su eje — el tiro es balística 3D real (x, y, z), así que además de la parábola tenés que apuntar bien en el plano horizontal, porque el canasto aparece a distintas profundidades.
- **Lanzar**: botón `¡LANZAR!` o barra espaciadora.
- **Cámara estilo Google Earth**: arrastrá para orbitar (verla desde arriba, de costado…), rueda del mouse o pinch para acercar, botón derecho o dos dedos para panear. El botón `📷 Vista` vuelve al encuadre inicial.
- Cada vez que embocás, pasás de nivel y el canasto aparece en otro lado (más lejos, más alto, más al fondo…).
- Mientras no aciertes, seguís en el mismo nivel. La estela tenue del tiro anterior te ayuda a corregir.

## Dificultad progresiva

| Nivel | Novedad |
|-------|---------|
| 1     | Canasto a nivel del piso |
| 2+    | El canasto puede aparecer elevado sobre un pedestal |
| 3+    | Aparece **viento** (mirá el indicador 💨 arriba a la derecha) |

## Detalles técnicos

- **three.js r147** (vendoreado en `vendor/three.min.js` + `vendor/OrbitControls.js`, no necesita internet) con sombras suaves, niebla atmosférica, tone mapping ACES y pixel ratio adaptado a la pantalla.
- Cámara orbital (`OrbitControls`) con amortiguación, límites de zoom y tope para no meterse bajo el piso; cúpula de cielo con gradiente para que el fondo se vea desde cualquier ángulo.
- Entornos procedurales por escenario: ciudad con ventanas iluminadas, selva con árboles/palmeras/helechos/luciérnagas, y estadio con tribunas en U y público de colores (puntos con vertex colors).
- Gorila, policía, jugador, canasto, tacho y aro modelados por código; banana, pelota y piedra girando en vuelo.
- Física determinista: integración con subpasos fijos de 1/120 s y enceste decidido interpolando el cruce del plano del aro — el resultado del tiro es idéntico a cualquier framerate.
- Física por integración de Euler con `dt` real por frame; guía de puntería con puntitos, estela aditiva del tiro, partículas de festejo, screen-shake al fallar.
- **Mobile-first**: pantalla completa (`viewport-fit=cover` + safe areas), cámara que se reencuadra sola según orientación, controles táctiles grandes, vibración háptica y sonidos sintetizados con WebAudio.
