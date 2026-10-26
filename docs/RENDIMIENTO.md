# Optimización de animación y cambios de vista

Esta revisión responde a las pausas reportadas en Alta calidad al mover la cámara y alternar entre detalle y despiece. Mantiene las piezas y el detalle gráfico de la versión `678c8fd`.

## Causa reproducida

El bucle marcaba su callback como consumido al comenzar. Durante ese callback, `OrbitControls.update()` emitía un evento de cambio que programaba el siguiente fotograma. Al terminar, el bucle programaba otro sin comprobar el que ya existía. Con la animación activa, ambas cadenas seguían ejecutándose. La prueba instrumentada reprodujo **101 callbacks del motor pendientes** después de arrastrar la cámara. El indicador no mide 101 fotogramas visibles: son callbacks que competían por el mismo estado y recursos.

Además, una invalidación de cámara permitía dibujar ignorando el presupuesto temporal. En pantallas de 120/144/165 Hz, los perfiles de 30/60 fps podían exceder su frecuencia prevista durante la interacción.

## Cambios

- Un único callback pendiente del motor, incluido el caso en que los controles solicitan otro desde dentro del fotograma actual.
- Presupuesto de 30/60 fps también durante el movimiento de cámara; se conserva la fracción temporal para pantallas de alta frecuencia sin dibujar una cola de fotogramas atrasados.
- Un detalle reutilizable por tren. Volver de despiece o ensamblado al mismo detalle conserva geometrías, materiales y búferes. Los tres sistemas maglev que utilizan la misma sección también comparten esa sección.
- Preparación de los shaders con `compileAsync` cuando está disponible `KHR_parallel_shader_compile`. Sin esa extensión se mantiene la compilación normal de Three.js en el primer dibujo, sin añadir una precompilación síncrona ni un temporizador. El visor indica preparación y descarta las terminaciones de solicitudes anteriores al cambiar rápidamente de tren. Esto no convierte la construcción de geometría en un trabajo de otro hilo ni elimina todo coste inicial.
- Las sombras se actualizan al cambiar pose, geometría, visibilidad, iluminación de encuadre o calidad. Girar una escena pausada reutiliza el mapa existente, ya que la cámara no cambia la profundidad vista desde la luz. Durante la animación se siguen actualizando las sombras.
- Cambiar velocidad o pausar evita recorridos innecesarios sobre todas las piezas. La telemetría conserva su última muestra sin volver a renderizar toda la interfaz cada segundo cuando el panel gráfico está cerrado.

La caché tiene un límite explícito: **un tren y un detalle**. Retener ese único detalle intercambia una cantidad acotada de memoria por cambios más rápidos. Se libera al sustituirlo, cambiar de tren o cerrar el visor; no se acumulan las secciones visitadas.

## Conservación del detalle

Los archivos `src/scene/model.ts`, `inspection.ts`, `geometry.ts`, `mechanics.ts` y `src/data/trains.ts` conservan exactamente sus huellas de la revisión visual anterior. No se redujeron polígonos, segmentos, instancias, materiales, piezas ni resoluciones de los perfiles. Alta calidad mantiene límite de densidad de píxel 2 y sombras de 2048 × 2048.

La revisión compara las capturas de los ocho trenes y de doce detalles, además de las dos vistas móviles, con la evidencia de [la versión anterior](audit/v2). La comparación visual y las huellas complementan las pruebas de interacción, ruedas, bielas, pistones y engranajes.

La comparación final encontró **20 capturas idénticas píxel por píxel**. Las dos móviles solo difieren en 52 y 69 píxeles de texto, respectivamente, por un nivel de un canal de color de 8 bits; no hay diferencias en el dibujo 3D. El [informe de comparación](audit/performance/visual-comparison.json) conserva igualdad exacta, error máximo, zonas de diferencia y huellas para que esa tolerancia sea revisable.

## Pruebas de regresión

Se conservan las 31 pruebas anteriores y se añaden seis:

1. Arrastre de cámara con animación activa en Alta calidad: un solo callback pendiente del motor.
2. Reloj de pantalla simulado a 144 Hz con cambios de cámara continuos: se respetan los presupuestos de 30 y 60 dibujos por segundo. En esta prueba se sustituye únicamente el envío a la GPU por un contador; verifica planificación, no rendimiento físico.
3. Cámara en pausa sin recalcular sombras, y actualización de sombras al cambiar de fase.
4. Alternancias entre detalle y despiece con identidad de objeto conservada y cero nuevas cargas de búferes al reabrirlo; selección por raycast al volver al conjunto y liberación al cambiar de tren.
5. Una compilación anterior no termina prematuramente la preparación del tren actual.
6. Cambios rápidos entre trenes, despiece y detalles: el modelo visible corresponde al último estado solicitado.

La comprobación del encuadre observa las matrices del programa que efectivamente dibuja al framebuffer principal. Esto evita confundir la última carga de uniformes de la cámara de sombras con la cámara visible cuando Three.js reutiliza uniformes sin volver a enviarlos. También verifica que la proyección observada sea perspectiva.

Los informes de ejecución, perfiles instrumentados y comparación visual se guardan en [audit/performance](audit/performance). Las capturas regeneradas se excluyen de Git para evitar duplicar imágenes idénticas: el informe conserva sus huellas y las referencias a las imágenes originales. Las auditorías anteriores se conservan con su alcance y fecha originales.

## Resultado medido

La compilación final y **37 de 37 pruebas** finalizaron correctamente; la suite tardó 165,2 segundos, sin fallos, omisiones ni reintentos inestables. El recorrido visual completo no registró errores ni advertencias de navegador, ni desbordamiento horizontal en móvil.

| Contador del mismo recorrido instrumentado | Antes | Después |
| --- | ---: | ---: |
| Máximo de callbacks del motor pendientes | 101 | 1 |
| Callbacks del motor ejecutados | 669 | 75 |
| Llamadas WebGL de dibujo | 30.213 | 12.549 |
| Bytes enviados mediante `bufferData` durante el recorrido | 9.553.144 | 9.150.024 |
| Programas WebGL creados | 26 | 25 |

Los bytes son transferencias acumuladas, no VRAM residente. La prueba específica de reabrir el detalle confirmó **cero nuevas cargas de búferes** y el mismo objeto conservado. El perfil instrumentado completo muestra menos trabajo redundante, pero sus secuencias de primera apertura tardaron más en esta muestra de software: Big Boy 1.969 → 2.751 ms, Deltic 1.897 → 2.355 ms y Velaro 1.782 → 2.374 ms. No se presenta esa medición como una mejora de latencia en frío. Los tiempos incluyen clics automatizados, preparación, esperas y renderizado; la corrección verificable es la eliminación de cadenas duplicadas y la reutilización al volver al detalle. Falta medir latencia, fps y memoria en la NVIDIA del usuario.

## Reproducción

```bash
npm run build
npm test
# Después de terminar las pruebas, con el puerto 4173 libre:
npm run preview -- --port 4173
# En otra terminal:
node scripts/profile-runtime.mjs docs/audit/performance/after-runtime.json
node scripts/audit-visual.mjs docs/audit/performance/visual
# Comparación opcional; requiere Python y Pillow:
python scripts/compare-visuals.py
```

La medición utiliza Chromium con SwiftShader en la nube, perfil Alta calidad, 1440 × 1000 para interacción y 1600 × 1100 para capturas. No dispone de la RTX 3060 Laptop del usuario. Los tiempos incluyen automatización, esperas, compilación inicial y renderizado por software; no son una predicción de fps, VRAM, temperatura o consumo eléctrico en la laptop.

Para utilizar la versión local, actualiza el código, ejecuta `npm ci`, `npm run build` y `npm run preview`. La compilación evita la sobrecarga propia del entorno de desarrollo, aunque la corrección de animación también se aplica a `npm run dev`.
