# Auditoría de la entrega

El programa está implementado y compilado como web estática. La auditoría comprueba comportamiento, geometría básica, gestión de recursos, accesibilidad automática y presentación. **No certifica fidelidad de fabricación ni rendimiento en una RTX 3060:** faltan juegos completos de planos originales y una sesión de medición en ese equipo.

La ejecución final del 22 de octubre de 2026 a las 04:39 UTC completó **23 de 23 pruebas**, sin fallos, omisiones ni reintentos inestables, en 73,3 segundos. Incluye las regresiones del encuadre adaptable y de la liberación de búferes de instancias.

## Entorno y reproducción

- Linux, Node.js 24.19.0, npm 11.9.0.
- Chromium 154.0.8037.57 con WebGL 2 sobre ANGLE/SwiftShader, sin NVIDIA física disponible.
- Playwright, un trabajador, compilación de producción servida por Vite.
- Vistas de escritorio y móvil de 390 × 844; capturas generales de escritorio a 1600 × 1100.

```bash
npm --cache /workspace/.npm-cache ci
npm run build
npm test
npm --cache /workspace/.npm-cache audit --omit=dev
git diff --check
```

La instalación limpia y la compilación finalizaron correctamente. La consulta de npm informó cero vulnerabilidades conocidas en dependencias de producción en esta revisión; esto no constituye una auditoría completa de seguridad. Las versiones están fijadas en `package-lock.json`.

Los resultados de ejecución y las huellas de los archivos comprobados se conservan en [audit/verification.json](audit/verification.json). El informe detallado de una ejecución local se genera en `test-results/results.json` y `playwright-report/`; estos directorios no forman parte del código versionado.

## Cobertura funcional

| Área | Comprobación |
| --- | --- |
| Contenido | Ocho identificadores únicos, seis países, cinco sistemas por tren y todas las referencias internas resolubles |
| Colección | Búsqueda sin distinguir tildes, filtros combinados, estado vacío y restablecimiento |
| Ocho modelos | Selección de los cuarenta sistemas, desmontaje, aislamiento y notas de fidelidad |
| Interacción 3D | Raycast sobre geometría visible actualiza el inspector |
| Cámara | Matrices enviadas a WebGL coinciden entre encuadre inicial y restaurado; se comprueba también al cambiar a móvil |
| Diálogos | Apertura por teclado, contención de foco, Escape y devolución del foco |
| Contenido ampliado | Contexto histórico, comparación, biblioteca y conservación del tren activo |
| Navegación | Parámetro de URL, identificador desconocido y recorrido automático que avanza y se detiene |
| Movimiento | Movimiento reducido; instrumentación de llamadas WebGL que confirma cese del dibujo continuo en pausa y reanudación |
| Recuperación | Pérdida de contexto WebGL provocada, fichas utilizables y apertura de un visor nuevo |
| Recursos | Dos recorridos completos de cambios de tren; al volver a Rocket, geometrías y búferes WebGL vivos retornan al valor de referencia |
| Accesibilidad | Axe con reglas WCAG 2 A/AA y 2.1 AA en vista inicial y detalle; cero infracciones detectadas en esas vistas |
| Móvil | Sin desbordamiento horizontal del documento a 390 px y detalle operable |

La prueba cinemática recorre 360 grados y comprueba longitud constante de biela, límites de carrera y rechazo de parámetros geométricamente imposibles. La prueba de geometría cuenta ruedas realmente construidas: Rocket 8 incluyendo ténder, Garratt 28, Big Boy 38 incluyendo ténder, Deltic 12, y 8 en los coches representados de serie 0 y Velaro. El conteo no verifica perfil de rueda, geometría exacta de suspensión ni una composición completa.

## Revisión gráfica y correcciones

Se revisaron escenas y diagramas en capturas reales del navegador. Durante la auditoría se corrigieron encuadre de vehículos largos, exposición excesiva, ventanas duplicadas, texto demasiado pequeño, contraste y un encuadre inicial que se calculaba antes de conocer la proporción del visor. La posición inicial de los mecanismos se aplica antes de medir el modelo.

El encuadre utiliza las ocho esquinas proyectadas del volumen del modelo y la base del diorama. Al cambiar la relación de aspecto del visor vuelve a encuadrarse. La cámara se puede girar, acercar, alejar, restaurar y colocar en vista lateral. El detalle Deltic distingue la sección funcional animada de una reconstrucción del motor completo.

Evidencia visual:

- [Escritorio, Rocket](audit/desktop.png).
- [Big Boy](audit/bigboy.png), [Garratt](audit/garratt.png) y [Deltic](audit/deltic.png).
- [Serie 0](audit/shinkansen.png), [TGV](audit/tgv.png), [Velaro](audit/velaro.png) y [L0](audit/maglev.png).
- [Motores Deltic aislados](audit/deltic-isolated.png) y [explicación ampliada](audit/deltic-detail.png).
- [Vista móvil](audit/mobile.png).

Las pruebas de accesibilidad no cubren todos los estados, lectores de pantalla ni combinaciones de navegador y dispositivo. La revisión visual tampoco sustituye una evaluación con usuarios.

## Recursos y rendimiento

La aplicación carga el motor 3D como módulo separado. La compilación revisada genera aproximadamente 330 kB de JavaScript principal y 586 kB del motor, unos 104 y 148 kB respectivamente con gzip. El CSS ocupa unos 44 kB, 12 kB con gzip. `dist/` completo, incluidas fuentes y avisos, ronda 1,2 MB. Son tamaños de artefacto; la transferencia depende de la compresión del alojamiento y de los subconjuntos tipográficos utilizados.

Solo existe un modelo activo; al sustituirlo se liberan sus geometrías, materiales, atributos de instancias y la lista de renderizado. Traviesas, vegetación y algunos remaches usan instancias. La auditoría detectó que liberar únicamente la geometría dejaba los búferes de instancias sin liberar: el contador WebGL crecía de 377 a 505 tras dos recorridos. Se añadió la liberación explícita de `InstancedMesh` y una prueba de regresión que instrumenta `createBuffer` y `deleteBuffer` para comprobar que no se acumulen. El perfil equilibrado limita la densidad de píxel a 1,25 y las sombras a 1024 px; alta calidad usa límites de 2 y 2048 px. Los objetivos de 30/60 fps no son mínimos garantizados.

La animación 3D se detiene cuando el documento está oculto. En pausa, tras estabilizar los controles de cámara, no continúa enviando dibujos a WebGL. Al interactuar se renderizan los cambios. Los diagramas que no requieren cinemática JavaScript no mantienen un bucle de animación JavaScript independiente.

[render-metrics.json](audit/render-metrics.json) registra una muestra breve por tren en perfil equilibrado, con resolución y renderizador. Los triángulos y llamadas proceden de `renderer.info` y pueden incluir pasadas de sombras; no equivalen al número de polígonos únicos del modelo. El número de geometrías es un contador de recursos, no bytes. Los fps corresponden a software de la nube y no deben extrapolarse a la RTX 3060.

La estabilidad de los contadores tras cambiar de tren descarta acumulación de geometrías y búferes en el recorrido probado, pero no demuestra ausencia de toda fuga de memoria. No se midieron VRAM, RAM máxima, temperatura, batería ni cargas concurrentes durante sesiones prolongadas.

## Cumplimiento técnico y documental

| Objetivo | Resultado y alcance |
| --- | --- |
| Web 3D con ocho trenes | Implementado; cuarenta grupos de sistemas seleccionables |
| Animaciones y detalle | Cinemática de biela–manivela, diagramas funcionales, aislamiento y desmontaje; no simulación integral |
| Historia y dimensión social | Tres pasajes por vehículo, materiales y decisiones; se separa evidencia de interpretación |
| Fuentes explícitas | Diecisiete referencias consultadas y cuatro libros recomendados, sin presentar estos como leídos |
| Planos exactos | Referencias exactas de archivo donde se localizaron; **no se obtuvieron planos originales completos de los ocho casos** |
| Precisión geométrica | Arquitecturas, rodajes y algunas magnitudes documentadas; proporciones y equipos internos parcialmente esquemáticos |
| GPU NVIDIA | WebGL solicita alto rendimiento; selección efectiva a cargo de Windows y el navegador; **sin prueba física en la RTX del usuario** |
| Estabilidad | Pruebas de navegación, sustitución de modelos, pausa y recuperación de contexto |
| Calidad gráfica | Dioramas propios, materiales, sombras, diagramas y diseño adaptable revisados en navegador |

No se considera resuelta la validación de tolerancias, aleaciones por pieza, uniones, distribución de válvulas, fase real Deltic, bobinados, dinámica rueda–carril ni campos magnéticos. La aplicación los identifica como esquemas o límites de la reconstrucción. El hito de 2007 del Velaro E sigue pendiente de corroboración en una fuente adicional accesible.

Para completar la validación sobre el equipo objetivo, hay que abrir la aplicación con aceleración gráfica y comprobar el renderizador, recorrer los ocho casos en ambos perfiles y registrar fps y memoria con las herramientas del navegador y Windows. El registro debe indicar resolución y estado ensamblado/desmontado/aislado. No se presenta esta comprobación pendiente como un fallo observado.

## Entorno en la nube

Se guardó un borrador con instalación reproducible y guía de arranque, preservando la red y los demás ajustes existentes. En ese momento, la herramienta confirmó el guardado con `requires_publish: true`. Una consulta posterior encontró las instrucciones en una versión de configuración sin borrador pendiente. Publicar el entorno no publica el sitio web ni confirma por sí solo la restauración en una tarea nueva.

La preparación para GitHub Pages se describe en el [README](../README.md#publicar-en-github-pages). La verificación del sitio bajo la carpeta del repositorio y su estado de publicación se registran por separado en [audit/github-pages-check.json](audit/github-pages-check.json), sin sustituir las pruebas de la aplicación descritas arriba.
