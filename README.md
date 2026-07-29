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
| 🏹 **Arquero** | Un arquero con túnica y capucha medieval dispara flechas a un **blanco de aros sobre un montículo de paja**, en un bosque con prado, pinos, robles y casitas medievales. La flecha vuela orientada a su trayectoria y queda clavada en el blanco. Si pega en la paja fuera de los aros, es fallo. |
| ⚽ **Fútbol** | Tiro libre en un estadio: un jugador con la 10 patea al **arco con red**, custodiado por un **arquero que ataja** (cambia de palo en cada nivel). Con el nivel te alejás, aparece una **barrera de rivales** cada vez más larga y **el arco se achica**. Pegarle a la barrera, al arquero o al palo es fallo. |
| 🚗 **Auto** | Salto acrobático en un desierto del viejo oeste (mesetas, cactus, cuervos, rodadoras): un auto toma la **rampa** — que se inclina con el Ángulo y gira con el Giro — y tiene que **pasar volando por dentro de un aro elevado**. La Fuerza es la velocidad. El aro sube y se gira con el nivel; rozar el borde es fallo. |

El botón de escenario del HUD abre un **selector con la lista completa** para saltar directo a cualquiera.

## Cómo jugar

Abrí `index.html` en cualquier navegador (funciona directo desde el archivo, sin servidor ni build). En el celular ocupa toda la pantalla; se ve mejor apaisado.

### Instalar como app 📲

El juego es una **PWA**: el botón **📲 Instalar** del HUD dispara la instalación nativa donde el navegador la soporta (Chrome/Android), y en el resto (iPhone, Firefox…) muestra las instrucciones del navegador correspondiente. Instalada queda con el ícono del gorila y abre en **pantalla completa**, sin controles del navegador, y funciona **offline**. Jugando desde el navegador, el botón **⛶ Pantalla** pone el juego en pantalla completa sin instalar nada.

- **Ángulo**, **Giro** y **Fuerza**: con los sliders, con los botones **−/+** al lado de cada uno (mantenelos apretados para repetir), o con el teclado (`↑`/`↓` ángulo, `Q`/`E` giro, `←`/`→` fuerza).
- **Ranking** (botón `🏆`): récords guardados en el dispositivo por escenario — mejor nivel, emboques, intentos y efectividad. Cuando superás tu mejor nivel, el festejo lo anuncia.
- **Giro**: rota al gorila sobre su eje — el tiro es balística 3D real (x, y, z), así que además de la parábola tenés que apuntar bien en el plano horizontal, porque el canasto aparece a distintas profundidades.
- **Lanzar**: botón `¡LANZAR!` o barra espaciadora.
- **Cámara estilo Google Earth**: arrastrá para orbitar (verla desde arriba, de costado…), rueda del mouse o pinch para acercar, botón derecho o dos dedos para panear. El botón `📷 Vista` vuelve al encuadre inicial.
- **Viento**: el botón `💨` del HUD lo prende y apaga. Es un **vector 2D**: empuja adelante/atrás y también **hacia los costados**, desviando el proyectil lateralmente — el indicador muestra la dirección con flechas de 8 rumbos (→ ↗ ↑ ↖ ← ↙ ↓ ↘) y las **hojitas vuelan en esa dirección**. Cambia de fuerza y rumbo por nivel; OFF garantiza tiro limpio.
- **Sonidos**: cada proyectil silba distinto al salir (banana aguda, pelota grave, piedra pesada) y cada blanco suena distinto al embocar: *plop* en el mimbre, *¡clang!* metálico en el tacho, *swish* de red en el aro. Todo sintetizado con WebAudio, sin archivos.
- Cada vez que embocás, pasás de nivel y el canasto aparece en otro lado (más lejos, más alto, más al fondo…).
- Mientras no aciertes, seguís en el mismo nivel. La estela tenue del tiro anterior te ayuda a corregir.

## Dificultad progresiva

Con cada nivel, en todos los escenarios:

- **El lanzador retrocede**: arranca cerca y termina contra el borde del escenario.
- **El viento sopla más fuerte** (si está ON): sube el máximo y también el mínimo.
- **El blanco queda más desviado**: aparece cada vez más corrido a los costados (más Giro necesario), puede subirse a pedestales más altos (ciudad/selva), y el blanco de arquería aparece **girado sobre su eje** — la zona útil se achica con el ángulo.
- En básquet, tu posición en la cancha se aleja y se corre cada vez más del eje del aro.

## Detalles técnicos

- **three.js r147** (vendoreado en `vendor/three.min.js` + `vendor/OrbitControls.js`, no necesita internet) con sombras suaves, niebla atmosférica, tone mapping ACES y pixel ratio adaptado a la pantalla.
- Cámara orbital (`OrbitControls`) con amortiguación, límites de zoom y tope para no meterse bajo el piso; cúpula de cielo con gradiente para que el fondo se vea desde cualquier ángulo.
- Entornos procedurales por escenario: ciudad con ventanas iluminadas, farolas encendidas y antenas con balizas rojas titilantes; selva con árboles/palmeras/helechos/luciérnagas, laguna espejada y rocas; estadio con tribunas en U, público de colores, banderines y marcador "GORILLA ARENA"; bosque medieval con fogata parpadeante y estandartes.
- Personajes con detalles propios: orejas del gorila, bigote y placa del policía, vincha y camiseta 23 del jugador, pluma y carcaj del arquero.
- Gorila, policía, jugador, canasto, tacho y aro modelados por código; banana, pelota y piedra girando en vuelo.
- Física determinista: integración con subpasos fijos de 1/120 s y enceste decidido interpolando el cruce del plano del aro — el resultado del tiro es idéntico a cualquier framerate.
- Física por integración de Euler con `dt` real por frame; guía de puntería con puntitos, estela aditiva del tiro, partículas de festejo, screen-shake al fallar.
- **Mobile-first**: pantalla completa (`viewport-fit=cover` + safe areas), cámara que se reencuadra sola según orientación, controles táctiles grandes, vibración háptica y sonidos sintetizados con WebAudio.
