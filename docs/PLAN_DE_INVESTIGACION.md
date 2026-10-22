# Atlas de la evolución ferroviaria

> Documento de planificación inicial, conservado como antecedente. El usuario confirmó una web 3D con ocho trenes y una RTX 3060 Laptop de 6 GB, con 16 GB de RAM. El estado de la entrega, las fuentes efectivamente consultadas y sus límites están en [INVESTIGACION.md](INVESTIGACION.md) y [AUDITORIA.md](AUDITORIA.md). La mayoría de los bloqueos de acceso descritos aquí se resolvieron durante la investigación; esta lista inicial no describe el estado final.

## Estado y objetivo

Documento de preparación de la investigación. No constituye una investigación histórica completada ni una certificación de precisión dimensional. Las referencias pendientes deberán consultarse antes de incorporar sus afirmaciones a la aplicación.

Crear una aplicación interactiva en español para graduados en ingeniería mecánica y eléctrica. Permitirá estudiar vehículos de distintas épocas y regiones, seleccionar sus sistemas y componentes, observar su funcionamiento y consultar las fuentes de cada explicación.

## Decisiones propuestas

- Aplicación web de escritorio con renderizado 3D acelerado por GPU, pendiente de la preferencia del usuario.
- Primera colección de 8–10 vehículos; seleccionar el conjunto definitivo después de comprobar la disponibilidad de documentación técnica.
- Modelos didácticos fieles a la arquitectura de cada vehículo. Las reconstrucciones dimensionales requerirán planos contrastados y se identificarán por separado.
- Dirección visual: dioramas ferroviarios con materiales legibles, iluminación cuidada, animaciones pausadas y acercamientos a mecanismos. Civilization VI es una referencia de presentación y legibilidad; no se reutilizarán sus recursos.
- Texto breve en la vista principal y explicación de ingeniería, ecuaciones, variantes y bibliografía en un segundo nivel.

## Investigación y trazabilidad

Para cada vehículo se deberá registrar:

1. Identidad: clase, ejemplar o variante, fabricante, operador, región y configuración representada.
2. Cronología: diseño, construcción, pruebas, entrada en servicio y modificaciones. No confundir estas fechas.
3. Contexto histórico: necesidad de transporte, infraestructura, capacidad industrial y consecuencias sociales. Evitar atribuir cambios sociales a una sola tecnología sin evidencia.
4. Arquitectura: disposición de ejes, fuente de energía, transmisión, frenado, suspensión, estructura y sistemas auxiliares.
5. Prestaciones: velocidad de servicio y de ensayo por separado; potencia con su punto de medición; masa y longitud indicando si corresponden a locomotora, coche o composición.
6. Fabricación: materiales, procesos de unión, fundición, forja, mecanizado y montaje documentados para la variante concreta.
7. Evidencia visual: vistas laterales, frontales y superiores, planos generales, cortes y fotografías de componentes. Registrar procedencia, licencia y restricciones de reutilización.
8. Incertidumbres: diferencias entre unidades, datos contradictorios, elementos ocultos y detalles sin documentación suficiente.

Cada afirmación técnica tendrá identificador, fuente, sección o página, fecha de consulta y alcance. Cada pieza tendrá además un estado de precisión: `documentada`, `reconstruida` o `esquemática`.

Orden de preferencia: planos y manuales originales; documentación de fabricantes y operadores; colecciones de museos y archivos; artículos y libros técnicos; recursos secundarios contrastados. Una fotografía permite justificar formas visibles, pero no dimensiones internas ni materiales por sí sola.

## Colección candidata, pendiente de documentación

La selección buscará diversidad técnica y geográfica, además de hitos famosos. Ningún candidato se considera investigado todavía.

| Familia | Candidatos | Pregunta de ingeniería |
| --- | --- | --- |
| Vapor temprano | Rocket | ¿Cómo se relacionan la caldera, el tiro y la transmisión por bielas? |
| Vapor articulado | Big Boy; una Garratt africana documentada | ¿Cómo se reparte la carga y se negocian curvas con grandes locomotoras? |
| Electrificación temprana | SBB Ce 6/8; PRR GG1 | ¿Cómo evolucionan la alimentación, los motores y la transmisión? |
| Diésel eléctrico | EMD FT o F7 | ¿Por qué convertir energía mecánica en eléctrica antes de mover los ejes? |
| Alta velocidad inicial | Shinkansen serie 0 | ¿Qué cambia al diseñar conjuntamente vehículo e infraestructura? |
| Alta velocidad europea | TGV Sud-Est; ICE 3; Talgo 350 | ¿Qué diferencias hay entre tracción concentrada, distribuida y distintas articulaciones? |
| Levitación magnética | Un sistema EMS o EDS documentado | ¿Cómo cambian sustentación, guiado y propulsión al abandonar el contacto rueda–carril? |

La colección no presentará la historia como una sustitución universal y lineal: tecnologías de distintas épocas conviven y responden a condiciones de operación diferentes.

## Fuentes y estado de acceso

### Recurso técnico consultado

- **Open Rails, manual de física**, proyecto Open Rails: <https://github.com/openrails/openrails/blob/master/Source/Documentation/Manual/physics.rst>. Se consultaron apartados sobre resistencia, adherencia y transmisión diésel eléctrica. Sirve como referencia de un simulador y de sus simplificaciones, no como prueba histórica de las especificaciones de un tren.
  - El manual distingue potencia del motor diésel, consumos auxiliares y potencia de tracción: la interfaz deberá conservar esa distinción.
  - Describe el deslizamiento relativo rueda–carril y el coste computacional de modelos de adherencia más complejos. No se deben confundir sus algoritmos con mediciones de un vehículo real.
  - La expresión de Davis mostrada en el texto consultado presenta un término que se vuelve cúbico al expandirse. Debe contrastarse con bibliografía y código antes de reutilizarla; no se incorporará automáticamente a una simulación.

### Fuentes oficiales pendientes

Los siguientes intentos de lectura devolvieron `Tunnel connection failed: 403 Forbidden` desde el entorno. Esto acredita un bloqueo de acceso del entorno, no que las páginas sean inexistentes ni que su contenido haya sido verificado.

| Institución | Recurso solicitado | Estado |
| --- | --- | --- |
| National Railway Museum | <https://www.railwaymuseum.org.uk/objects-and-stories/stephensons-rocket> | Lectura bloqueada |
| Union Pacific | <https://www.up.com/heritage/steam/4014/> | Lectura bloqueada |
| JR Central | <https://global.jr-central.co.jp/en/company/about_shinkansen/> | Lectura bloqueada |
| Alstom | <https://www.alstom.com/solutions/rolling-stock/avelia-high-speed-trains-best-way-travel-fast> | Lectura bloqueada |

También se propone consultar colecciones de Science Museum Group y Smithsonian, documentación de Siemens Mobility y Talgo, recursos de JR Central sobre SCMAGLEV, archivos sudafricanos y documentación de la Federal Railroad Administration. Los destinos de red se guardaron en un borrador de configuración; guardarlo no activa el acceso.

### Bibliografía por localizar y consultar

- Simon Iwnicki, editor, *Handbook of Railway Vehicle Dynamics*.
- A. H. Wickens, *Fundamentals of Rail Vehicle Dynamics*.
- Coenraad Esveld, *Modern Railway Track*.
- E. L. Ahrons, *The British Steam Railway Locomotive from 1825 to 1925*.

Son referencias propuestas. Antes de citar contenido concreto se comprobarán edición, capítulo y páginas; no se afirma haber consultado estos libros.

## Diseño de la experiencia

1. Cronología y catálogo con filtros por región, época y tecnología.
2. Diorama del vehículo con rotación, zoom, pausa y restauración de cámara.
3. Selección de piezas desde el modelo y desde una lista accesible con teclado.
4. Acercamiento a la pieza con aislamiento o vista desmontada, sin ocultar el contexto funcional.
5. Panel con función, diseño, fabricación, evolución, magnitudes relevantes y referencias.
6. Animación del flujo de energía y de mecanismos documentados, con leyenda y control de velocidad.
7. Comparación entre vehículos con definiciones homogéneas de cada magnitud.

En vapor, la cinemática deberá corresponder al mecanismo representado; no basta con hacer girar ruedas y bielas independientemente. En vehículos eléctricos se distinguirán captación, transformación, conversión, motores y retorno de corriente según su arquitectura. En maglev se distinguirán sustentación, guiado y propulsión, y no se mezclarán EMS y EDS.

## Rendimiento y recursos

- El navegador podrá usar la GPU que seleccione el sistema operativo. Tener una NVIDIA no garantiza que el navegador la utilice; se comprobará el renderizador efectivo en el equipo del usuario.
- Cargar geometría detallada al seleccionar una pieza; reutilizar geometrías y materiales; utilizar niveles de detalle e instancias cuando proceda.
- Detener animación cuando la pestaña esté oculta y renderizar bajo demanda en vistas estáticas.
- Limitar resolución de renderizado y sombras según el nivel de calidad elegido.
- Mantener las tareas pesadas de procesamiento fuera del hilo de interacción cuando sean necesarias.
- Medir antes de introducir simulaciones físicas complejas. La GPU acelera gráficos, pero no traslada automáticamente todo el trabajo de JavaScript fuera de la CPU.
- Respetar reducción de movimiento y proporcionar controles equivalentes mediante teclado.

## Auditoría prevista

| Área | Comprobación y evidencia requerida |
| --- | --- |
| Investigación | Afirmaciones enlazadas a fuentes consultadas; incertidumbres y variantes explícitas |
| Geometría | Comparación con vistas y planos; ejes, proporciones, posición y arquitectura de sistemas |
| Mecanismos | Continuidad cinemática, ausencia de interpenetraciones importantes y correspondencia con el mecanismo real |
| Funcionalidad | Selección, filtros, cronología, cámara, comparación y enlaces mediante pruebas de navegador |
| Estabilidad | Cambios repetidos de tren y componente, limpieza de recursos, errores de consola y recuperación ante fallos |
| Rendimiento | Tiempo de carga, tiempos de fotograma y uso de memoria; registrar navegador, resolución y hardware de cada medición |
| Accesibilidad | Teclado, foco visible, contraste, nombres de controles y reducción de movimiento |
| Producción | Compilación reproducible, pruebas de una instalación limpia y funcionamiento sin recursos remotos imprevistos |

El entorno actual dispone de Node.js, Python y Chromium. No se ha detectado `nvidia-smi`; no se afirmará haber auditado la GPU NVIDIA del usuario desde esta máquina. Aún no se ha implementado ni probado una aplicación.
