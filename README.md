# 🦍 Gorilla Banana

Un homenaje moderno al clásico **GORILLA.BAS** de QBasic, hecho en HTML + JavaScript puro (sin dependencias).

Un gorila en un extremo de la ciudad tiene que embocar una banana en un canasto en el otro extremo. Elegís el **ángulo** y la **fuerza** del tiro, y la física (tiro parabólico con gravedad y viento) decide si la banana cae adentro.

## Cómo jugar

Abrí `index.html` en cualquier navegador. Nada que instalar ni buildear.

- **Ángulo** y **Fuerza**: con los sliders, o con el teclado (`↑`/`↓` ángulo, `←`/`→` fuerza).
- **Lanzar**: botón `¡LANZAR!` o barra espaciadora.
- Cada vez que embocás, pasás de nivel y el canasto aparece en otro lado (más lejos, más alto…).
- Mientras no aciertes, seguís en el mismo nivel. La estela tenue del tiro anterior te ayuda a corregir.

## Dificultad progresiva

| Nivel | Novedad |
|-------|---------|
| 1     | Canasto a nivel del piso |
| 2+    | El canasto puede aparecer elevado sobre un pedestal |
| 3+    | Aparece **viento** (mirá el indicador 💨 arriba a la derecha) |

## Detalles técnicos

- Canvas 2D a 60 fps con física por integración de Euler (`dt` real por frame).
- Ciudad nocturna generada proceduralmente en cada nivel (edificios, ventanas iluminadas, estrellas que titilan, luna).
- Estela de la banana, partículas de festejo, screen-shake al fallar y sonidos sintetizados con WebAudio (sin archivos de audio).
- Un solo archivo: `index.html`.
