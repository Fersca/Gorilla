# 🦍 Gorilla Banana 3D

Un homenaje moderno al clásico **GORILLA.BAS** de QBasic, hecho en HTML + JavaScript con **three.js** (renderizado 3D con WebGL).

Un gorila en un extremo de la ciudad tiene que embocar una banana en un canasto en el otro extremo. Elegís el **ángulo** y la **fuerza** del tiro, y la física (tiro parabólico con gravedad y viento) decide si la banana cae adentro.

## Cómo jugar

Abrí `index.html` en cualquier navegador (funciona directo desde el archivo, sin servidor ni build). En el celular ocupa toda la pantalla; se ve mejor apaisado.

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

- **three.js r147** (vendoreado en `vendor/three.min.js`, no necesita internet) con sombras suaves, niebla atmosférica, tone mapping ACES y pixel ratio adaptado a la pantalla.
- Ciudad nocturna 3D generada proceduralmente en cada nivel: tres filas de edificios con ventanas iluminadas (texturas de canvas), estrellas, luna con halo.
- Gorila y canasto modelados por código (esferas/cápsulas y superficie de revolución con textura de mimbre), banana como toro recortado que gira en vuelo.
- Física por integración de Euler con `dt` real por frame; guía de puntería con puntitos, estela aditiva del tiro, partículas de festejo, screen-shake al fallar.
- **Mobile-first**: pantalla completa (`viewport-fit=cover` + safe areas), cámara que se reencuadra sola según orientación, controles táctiles grandes, vibración háptica y sonidos sintetizados con WebAudio.
