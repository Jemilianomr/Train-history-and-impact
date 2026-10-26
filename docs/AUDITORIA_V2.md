# Mejora visual y de mecanismos

Esta revisión amplía la calidad gráfica de los ocho vehículos y añade secciones funcionales específicas para estudiar sus mecanismos. Conserva el contenido histórico, social y documental de la entrega inicial. Los resultados de aquella entrega permanecen en [AUDITORIA.md](AUDITORIA.md); la evidencia de esta revisión se guarda por separado en [audit/v2](audit/v2).

## Qué cambia

- Carrocerías con transiciones curvas, ventanillas ajustadas a la superficie, marcos, acristalamiento, pasos de rueda y cabinas más definidos. Los vehículos largos siguen representando el coche o conjunto descrito en su ficha, no una composición completa.
- Ruedas con superficies de rodadura y pestañas, tuberías curvas, puertas de caja de humos, abrazaderas y uniones. Los radios de rueda distintos giran con velocidades angulares inversamente proporcionales al radio para representar el mismo recorrido.
- Materiales diferenciados para pintura, acero, cobre, latón y vidrio. Iluminación ambiental de estudio precalculada, reflejos y sombras adaptadas al tamaño de la pieza seleccionada.
- Botón **Abrir detalle 3D**, leyendas de colores y control manual de fase de 0 a 360°. Cambiar la fase pausa el movimiento y sitúa la geometría y el esquema en la posición elegida. Las velocidades y fases son demostrativas, no valores operativos.

| Sección | Elementos representados y alcance |
| --- | --- |
| Caldera | Envolvente abierta, haz tubular, hogar, parrilla, agua y trazadores del recorrido de gases; sin cálculo térmico ni hidráulico |
| Vapor | Rueda, manivela, biela, cruceta, vástago, pistón y anillos; cierre geométrico de la biela, sin distribución de válvulas |
| Deltic | Tres bancos de seis cilindros y tres ejes de cigüeñal; una sección con seis pistones y bielas móviles; fases idealizadas, sin reproducir el calado Napier |
| Generador | Rotor, estator, devanados, eje, colector y escobillas; un grupo del sistema diésel eléctrico |
| Tracción | Corte de motor CC para serie 0/TGV o rotor de jaula para Velaro; transmisión de engranajes con sentidos opuestos y relación ilustrativa 14:35 |
| Transformador | Núcleo laminado, bobinas, aisladores y refrigeración; no reproduce el esquema eléctrico ni las conexiones del fabricante |
| Pantógrafo | Arquitectura de rombo para serie 0 y un brazo para los otros casos; articulaciones de longitud constante, aisladores y frotador; elevación demostrativa sin dinámica de catenaria |
| Bogie | Dos o tres ejes, pestañas, resortes helicoidales y frenos esquemáticos; dos apoyos indican el bogie compartido de los remolques TGV |
| Maglev | Guía, bobinas EDS en ocho, propulsión y criostatos; el color representa la progresión del campo sin resolver las ecuaciones electromagnéticas |

Los detalles se cargan para los sistemas pertinentes. Los sistemas sin una sección específica conservan el aislamiento del conjunto construido en el tren. En las secciones, la interacción permite girar, acercar y estudiar la fase; la leyenda identifica familias de elementos, pero cada tornillo o devanado no constituye una selección independiente.

## Fidelidad y referencias

Las arquitecturas se apoyan en las [referencias ya documentadas](INVESTIGACION.md). Esta revisión no incorpora nuevos planos de fabricación ni fotografías externas. Las cotas internas, espesores, números de ranuras y polos, relación de engranajes, trazadores de flujo y determinados detalles de suspensión y freno son didácticos. Los colores identifican funciones y no certifican aleaciones.

El detalle ampliado puede utilizar proporciones distintas del vehículo para hacer legible una función. En particular, la sección genérica de caldera y el mecanismo recto biela–manivela no son una réplica dimensional de la instalación inclinada de Rocket. El Deltic expone la arquitectura y el principio de pistones opuestos; no es un modelo de funcionamiento completo del motor real. La ficha de cada tren conserva las referencias de archivo y los límites de reconstrucción.

## Comprobaciones

La ejecución final del **24 de octubre de 2026, 05:42 UTC**, completó **31 de 31 pruebas en 129,2 segundos**, sin fallos, omisiones ni reintentos inestables. La compilación de TypeScript y Vite terminó correctamente.

Se utiliza la compilación de producción, Chromium con SwiftShader y un trabajador de Playwright. La evidencia de ejecución, huellas de archivos y tamaños de los módulos se conserva en [verification.json](audit/v2/verification.json). Se mantienen las 23 comprobaciones iniciales y se añaden ocho para esta revisión:

1. Igual recorrido de ruedas con radios diferentes.
2. Longitud constante de la biela 3D y pistón dentro del cilindro durante una revolución.
3. Holgura entre pistones opuestos y longitud de las seis bielas visibles del Deltic.
4. Igual recorrido tangencial y sentidos contrarios de los engranajes.
5. Longitud constante de los brazos en las dos arquitecturas de pantógrafo.
6. Control de fase accesible por teclado, pausa y cambio verificable de la imagen 3D y del diagrama.
7. Retorno de los búferes WebGL al valor inicial tras abrir y cerrar sucesivos detalles.
8. Conservación de las métricas gráficas al volver a seleccionar el tren activo.

La auditoría corrigió una cola de veinte fotogramas que retrasaba el cese del dibujo al pausar: ahora bastan dos, y los controles solicitan nuevos fotogramas mientras la cámara se estabiliza. También separa geometrías indexadas y no indexadas antes de agruparlas para evitar combinaciones incompatibles y utiliza el filtro de sombras PCF vigente en la versión instalada de Three.js. La revisión visual ajustó los parabrisas del L0 a su carrocería y unificó el pantógrafo de rombo de la serie 0 en el tren, la sección y el diagrama.

Para reproducir:

```bash
npm run build
npm test
# Con el puerto 4173 libre, después de terminar las pruebas:
npm run preview -- --port 4173
# En otra terminal:
node scripts/audit-visual.mjs
```

El script de revisión registra ocho vistas completas, doce vistas de detalles que incluyen variantes y dos capturas móviles. Comprueba errores y advertencias del navegador, y desbordamiento horizontal a 390 px. Las imágenes permiten revisar encuadre y legibilidad; no constituyen una validación dimensional.

La ejecución final de este recorrido terminó a las 05:45 UTC con **cero errores, cero advertencias y ningún desbordamiento horizontal** en la vista móvil comprobada.

Ejemplos: [tren completo](audit/v2/bigboy.png), [biela y pistón](audit/v2/rocket-drive.png), [Deltic](audit/v2/deltic-power.png), [motor de tracción](audit/v2/velaro-drive.png), [pantógrafo de rombo](audit/v2/shinkansen-supply.png), [bogie](audit/v2/velaro-running.png), [visor móvil](audit/v2/mobile-viewer.png) y [controles móviles](audit/v2/mobile-controls.png).

## Recursos

Se mantiene un único tren cargado y, durante el aislamiento, una única sección adicional. Se reutilizan geometrías y materiales dentro de cada sección, y tornillería, dientes y trazadores emplean instancias. Las piezas estáticas compatibles del modelo completo se agrupan sin absorber bielas, pistones ni elementos giratorios. Los detalles se liberan al cambiar de sistema, modo o tren. El mapa ambiental es de 128 px por cara y se genera una vez por visor.

[render-metrics.json](audit/v2/render-metrics.json) registra contadores de las escenas en pausa, perfil equilibrado y escritorio de 1600 × 1100. Los triángulos y llamadas pueden incluir sombras; las geometrías no equivalen a bytes de memoria. Estos datos no miden VRAM ni rendimiento de la RTX 3060 Laptop. La prueba en esa GPU continúa pendiente; WebGL solicita alto rendimiento y el usuario puede confirmar el renderizador efectivo en **Configuración gráfica**.

| Tren ensamblado | Llamadas anteriores | Llamadas actuales | Triángulos actuales, incluidas pasadas |
| --- | ---: | ---: | ---: |
| Rocket | 175 | 185 | 42.758 |
| Garratt | 399 | 475 | 126.818 |
| Big Boy | 484 | 576 | 170.790 |
| Deltic | 497 | 267 | 87.714 |
| Serie 0 | 333 | 161 | 78.170 |
| TGV | 445 | 193 | 85.662 |
| Velaro | 345 | 149 | 79.450 |
| L0 | 542 | 72 | 85.834 |

El detalle adicional aumenta la geometría en todos los vehículos. La agrupación reduce las llamadas en los cinco casos diésel/eléctricos/maglev, mientras que las ruedas y tuberías adicionales aumentan la carga en los tres de vapor. La comparación usa las muestras de ambas auditorías y no implica una mejora proporcional de fps. Los módulos finales ocupan aproximadamente 335 kB (106 kB gzip) de JavaScript principal y 641 kB (165 kB gzip) de motor; el CSS ocupa 46 kB (13 kB gzip). Las capturas y documentos de auditoría no se incluyen en la aplicación publicada.
