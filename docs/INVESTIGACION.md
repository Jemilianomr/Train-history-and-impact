# Investigación: ocho arquitecturas ferroviarias

Esta edición reúne ocho estudios de caso para relacionar energía, mecánica, fabricación, infraestructura y sociedad. La investigación precedió a la construcción de los modelos. Las consultas registradas corresponden al 20 de octubre de 2026, con fecha local de Ciudad de México. El registro [research-access.json](research-access.json) conserva URL, resultado de acceso, tamaño y huella del contenido recuperado; un HTTP 200 acredita recuperación, no la veracidad de todas las afirmaciones de una página.

## Método y alcance

Se priorizaron colecciones y catálogos de archivo, operadores y fabricantes. La aplicación reúne 17 referencias seleccionadas: Science Museum Group, Union Pacific, JR Central, Alstom, Siemens y el manual técnico abierto de Open Rails. La documentación de fabricantes permite identificar productos y arquitecturas, pero sus mensajes comerciales no equivalen a evaluaciones independientes de impacto económico o ambiental.

Se distinguen tres niveles:

1. **Hecho documentado:** fecha, disposición, material o magnitud que la fuente identifica para una configuración concreta.
2. **Explicación de ingeniería o interpretación contextual:** relación funcional razonada, marcada como tal cuando se explican decisiones, costes y consecuencias sociales. No pretende demostrar una motivación histórica sin evidencia.
3. **Reconstrucción esquemática:** forma, ubicación o movimiento que permite enseñar una función sin disponer de planos completos. Se declara en el detalle del mecanismo y en la pestaña Fuentes.

Las afirmaciones y magnitudes enlazan a identificadores de fuente en [trains.ts](../src/data/trains.ts). [sources.ts](../src/data/sources.ts) registra institución, localizador y límites de cada referencia. La trazabilidad es por ficha, sistema y pasaje; no existe todavía una matriz dimensional pieza por pieza.

## 1. Rocket: hacer viable un sistema de transporte

El [objeto 1862-5 del Science Museum Group](https://collection.sciencemuseumgroup.org.uk/objects/co26704/rocket-locomotive) documenta la locomotora de Robert Stephenson de 1829, su disposición 0-2-2 y la combinación de caldera multitubular y escape que favorece el tiro. Los tubos aumentan superficie de intercambio; la descarga de vapor contribuye al movimiento de gases de combustión. Esta asociación entre combustión, transferencia de calor y mecánica explica más que una simple comparación de velocidades.

El éxito en Rainhill forma parte de la adopción de locomotoras en una red de transporte público. La apertura Liverpool–Manchester y la muerte de William Huskisson muestran también que nuevas capacidades introducían riesgos y exigían prácticas de operación. El catálogo identifica hierro, acero, latón y pino en el objeto conservado. No permite asignar automáticamente esos materiales a cada pieza del estado original.

Rocket fue modificada tras Rainhill: el objeto actual no debe tratarse como una fotografía tridimensional intacta de 1829. Los [diez dibujos 2000-812](https://collection.sciencemuseumgroup.org.uk/objects/co531700/model-of-the-rocket-locomotive-drawings), de 1970–1979, corresponden a un modelo 1:8 basado en dibujos anteriores. El [modelo seccionado de Stuart Turner de 1909](https://collection.sciencemuseumgroup.org.uk/objects/co26970/sectioned-conjectural-model-of-rocket-steam-locomotive) es expresamente conjetural. Ambos son referencias útiles, no planos originales de fábrica.

## 2. Garratt GL: la infraestructura condiciona la máquina

La [GL 2352, Y1984.873](https://collection.sciencemuseumgroup.org.uk/objects/co8405990/beyer-garratt-south-african-railways-locomotive), se fabricó en Manchester en 1929 para South African Railways. Sus 27,6 m y disposición 4-8-2 + 2-8-4 responden a carga pesada en un trazado difícil. Dos grupos motores sostienen un puente central con caldera; la articulación facilita inscribir la locomotora en curvas y repartir cargas. No son dos locomotoras independientes unidas por una caldera rígida convencional.

Su función en el transporte de carbón relaciona extracción, industria, fabricación británica y redes sudafricanas. La fuente documenta segregación racial de pasajeros en South African Railways, además de la participación de la unidad en el tren real de 1947. Conectar territorios no garantiza acceso equitativo: conviene estudiar qué mercancías y grupos reciben mejores servicios y quién realiza el trabajo.

El catálogo menciona hierro fundido, latón y metales no identificados; no justifica declarar una aleación concreta para todo el bastidor. La referencia [ESCOX/5/98092[A], dibujo 98092](https://collection.sciencemuseumgroup.org.uk/documents/aa110100184/drawing-of-beyer-garratt-patent-locomotive) describe la arquitectura Beyer-Garratt, pero su correspondencia con la clase GL no está confirmada. Se localizaron también dibujos de una Garratt de Ceilán: no se emplearon como planos de la GL porque corresponden a otro rodaje y variante.

## 3. Big Boy: potencia, logística y patrimonio

[Union Pacific](https://www.up.com/about-us/history/steam/big-boy-4014) describe las primeras unidades de 1941 y el transporte pesado entre Ogden y Cheyenne. Su disposición 4-8-8-4 permite distribuir esfuerzo entre dos grupos motores. La fuente da 300 psi de presión nominal, ruedas motrices de 68 pulgadas y un ténder de 14 ruedas, magnitudes que se conservan separadas de las proporciones aproximadas de la ilustración.

La guerra y el transporte de mercancías forman parte del contexto documentado por el operador. Una máquina de gran capacidad necesita carbón, agua, talleres, personal y vía adecuada. La economía del conjunto incluye abastecimiento y mantenimiento, no solo potencia nominal. Se presentan estas relaciones como análisis de sistema, sin inventar cifras de ahorro o empleo.

La configuración representada es la etapa original a carbón. La unidad 4014 restaurada pasó a combustible líquido para su regreso en 2019: mezclar ambos estados produciría una reconstrucción incoherente. El caso permite estudiar cómo el patrimonio operativo conserva y modifica un objeto. No se obtuvieron planos originales ALCO ni especificaciones completas de tratamientos térmicos, tolerancias o distribución de válvulas.

## 4. Deltic DP1: llevar la generación eléctrica a bordo

La [ficha 1963-80](https://collection.sciencemuseumgroup.org.uk/objects/co207717/english-electric-company-diesel-electric-locomotive-deltic-co-co-3300hp-1955) identifica el prototipo de 1955: 3.300 hp, rodaje Co-Co y motores compactos de pistones opuestos con bancos dispuestos en triángulo. La conversión diésel–generador–motor eléctrico permite controlar el esfuerzo sin una transmisión mecánica única de gran potencia entre el motor térmico y todos los ejes. La potencia nominal del motor no equivale a potencia útil en el carril.

English Electric presentó una alternativa al coste de electrificar las líneas. El diseño exterior, inspirado en locomotoras estadounidenses, acompañaba una expectativa exportadora que no se materializó como se esperaba. El prototipo condujo a 22 unidades británicas de producción; no se confunde DP1 con la clase 55. Cambiar vapor por diésel transforma las habilidades de mantenimiento y las instalaciones necesarias, además de la fuente de energía.

El catálogo confirma acero y aluminio, pero no su distribución exacta por panel. Se excluyó la longitud de 3.531 mm que aparece como longitud entre topes: es incompatible con una locomotora Co-Co de este tipo. No se sustituyó por otra cifra supuestamente documentada. La longitud visual del modelo es aproximada.

El [motor seccionado 1989-7252](https://collection.sciencemuseumgroup.org.uk/objects/co207586/sectioned-deltic-diesel-engine) y el [libro GEC/3/7/4](https://collection.sciencemuseumgroup.org.uk/documents/aa110072578/a-diagram-book-for-overseas-and-uk-locomotives-including-the-deltic-prototype) son referencias identificables. Se consultaron sus registros, no todas las láminas del libro. La animación explica pistones opuestos en una sección triangular, pero no reproduce la fase real, la distribución ni todos los cilindros.

## 5. Shinkansen serie 0: tren e infraestructura como proyecto conjunto

El [coche 22-141, 2001-7500](https://collection.sciencemuseumgroup.org.uk/objects/co8001129/west-japan-railways-shinkansen-bullet-train-1976), es un ejemplar de 1976 de la familia iniciada en 1964. El museo registra caja de acero y longitud de 24.994 mm. No se atribuye al ejemplar la fecha de nacimiento de la familia. La nueva línea dedicada de ancho estándar modificó las restricciones de capacidad y velocidad respecto de la red convencional.

[JR Central](https://global.jr-central.co.jp/en/company/about_shinkansen/) sitúa el corredor Tokio–Nagoya–Osaka como una arteria económica. Tiempo de viaje, frecuencia, tarifas y conexión con estaciones condicionan el acceso a trabajo, negocios y ocio; no se deduce un beneficio social uniforme de la velocidad máxima. Tampoco se atribuyen las cifras actuales de puntualidad del operador a la serie 0 de 1964.

El acero documentado permite discutir experiencia industrial, fabricación, reparación y masa. Esa explicación funcional no prueba por sí sola una decisión contractual de materiales. El museo describe la restauración del coche por más de cien trabajadores de JR West, evidencia de conocimiento colectivo y patrimonio. En el modelo, los equipos eléctricos representan funciones de la composición: su posición no afirma que todos estuvieran en el coche 22-141. No se obtuvieron sus planos de fabricación.

## 6. TGV Sud-Est: arquitectura y experiencia del viaje

El [balance histórico de Alstom de 2006](https://www.alstom.com/press-releases-news/2006/9/TGV--25-years-of-success-to-share-ALSTOM-continues-to-innovate-20060922) identifica la entrada en servicio de 1981, motores de corriente continua y servicio inicial a 260 km/h. Se mantiene la cifra de esa fuente y su contexto temporal; los equipos síncronos posteriores del Atlantique no se trasladan al Sud-Est.

La composición combina motrices con remolques articulados. Un bogie compartido entre remolques cambia el número de conjuntos, la distribución de cargas y el mantenimiento. Las motrices tienen bogies propios y no toda la composición responde a una única disposición. La [página Avelia](https://www.alstom.com/solutions/rolling-stock/avelia-high-speed-trains-best-way-travel-fast) sirve para estudiar la evolución de la arquitectura, sin aplicar porcentajes contemporáneos de mejora a 1981.

La relación París–Lyon y una experiencia interior comparable con la aviación permiten abordar competencia interurbana y cultura del viaje. La [restauración del TGV 001 en Belfort](https://www.alstom.com/press-releases-news/2016/4/alstom-the-city-of-belfort-and-mader-team-up-to-renovate-the-tgv-001-power-car) documenta memoria industrial: el prototipo 001 no es el Sud-Est de serie. Esta fuente no se utiliza para demostrar una explicación causal sobre la crisis del petróleo. El modelo muestra una motriz y el comienzo de los remolques, no una composición completa certificada.

## 7. Velaro E: repartir la tracción y adaptar una plataforma

La [documentación de Siemens Mobility](https://www.mobility.siemens.com/global/en/portfolio/rolling-stock/high-speed-and-intercity-trains/velaro.html) confirma para la configuración española ocho coches, 200 m y 8 MW. La distribución de equipos bajo el piso libera volumen superior y relaciona ingeniería eléctrica, capacidad de pasajeros y accesibilidad para mantenimiento. Las variantes de una plataforma responden a distintas redes, climas y requisitos; no comparten necesariamente todos los sistemas eléctricos.

La alta velocidad española permite discutir relaciones territoriales y oportunidades, pero la página del fabricante no mide causalmente impacto sobre empleo, desigualdad o emisiones. La aplicación identifica ese razonamiento como interpretación y señala variables necesarias: frecuencia, precio, interconexiones y localidades atendidas.

El acceso a la ficha S-103 de Renfe fue bloqueado por la política de red del entorno. La fuente Siemens consultada no confirma la fecha de 2007, que se conserva como hito pendiente de corroboración adicional y se declara así en Fuentes. Tampoco se especifica una aleación por panel sin documentación. La geometría es representativa; no se obtuvieron planos de fabricación del Velaro E.

## 8. SCMaglev L0: cambiar la interfaz vehículo–infraestructura

El documento [The Review: Superconducting Maglev, JR Central, mayo de 2017](https://global.jr-central.co.jp/en/company/_pdf/superconducting_maglev.pdf) explica propulsión, sustentación y guiado en las páginas 1–2, y la secuencia de ensayos en las páginas 5–6. Describe imanes de Nb-Ti, helio líquido a aproximadamente −269 °C y levitación de unos 10 cm. El L0 comenzó ensayos en la línea ampliada de Yamanashi en 2013 y alcanzó 603 km/h en 2015: es un récord experimental, no una velocidad comercial.

Las bobinas de la guía y los imanes embarcados forman un sistema electrodinámico EDS. El movimiento induce corrientes de sustentación y guiado; las bobinas de propulsión crean el campo viajero del motor lineal. El apoyo a baja velocidad requiere ruedas. No se confunde este principio con la atracción electromagnética EMS ni se representa una levitación estática sin apoyo como si fuera el comportamiento real.

La selección de un superconductor habilita el principio, pero añade criogenia, aislamiento y mantenimiento. Evitar transmisión por adherencia no elimina resistencia aerodinámica ni consumo. La comparación económica debe incluir guía, alimentación y construcción. El récord no prueba rentabilidad, acceso universal o menor impacto ambiental. Se evita afirmar una fecha actual de apertura que el documento de 2017 no puede verificar.

## Planos: qué se localizó y qué falta

| Caso | Referencia verificable | Naturaleza y límite |
| --- | --- | --- |
| Rocket | SMG 2000-812, diez láminas, 1970–1979 | Dibujos de modelo 1:8; no originales de 1829 |
| Garratt | ESCOX/5/98092[A], dibujo 98092 | Arquitectura patentada; clase GL no confirmada |
| Big Boy | Union Pacific, Vital Statistics | Cotas y datos principales; no planos ALCO |
| Deltic | GEC/3/7/4 | Registro de libro que incluye DP1; láminas completas no consultadas |
| Serie 0 | SMG 2001-7500, coche 22-141 | Dimensiones y fotografías; no juego de planos |
| TGV Sud-Est | Alstom, balance histórico de 2006 | Arquitectura e historia; no planos de fabricación |
| Velaro E | Siemens, plataforma Velaro | Configuración general; planos específicos pendientes |
| L0 | JR Central, PDF 2017, pp. 1–2 | Diagramas funcionales; no cotas de fabricación |

No se denomina «plano exacto» a una fotografía, una reconstrucción ni un diagrama funcional. Las referencias de archivo identifican documentos para una consulta posterior; no implican haber visto o medido láminas no digitalizadas. Obtenerlas, comprobar licencias y contrastar variantes es necesario antes de certificar precisión dimensional.

## Materiales y fabricación: preguntas transversales

| Subsistema | Restricciones que explican la elección | Evidencia necesaria para ir más allá |
| --- | --- | --- |
| Caldera y hogar | Presión, transferencia de calor, corrosión y ciclos térmicos | Plano, espesores, uniones, material y fecha de reforma |
| Bielas, ejes y ruedas | Fatiga, desgaste, masa, contacto y ajustes | Especificación de forja/fundición, tratamiento y tolerancias |
| Máquinas eléctricas | Conductividad, flujo magnético, aislamiento y refrigeración | Bobinado, laminación, aislamiento y régimen térmico |
| Caja y bastidor | Rigidez, masa, uniones, reparación y coste industrial | Material por pieza, proceso de unión y requisitos de carga |
| Imanes superconductores | Corriente, campo, temperatura y estabilidad | Diseño de bobina, criostato, protección y revisión tecnológica |

Las explicaciones de forja, mecanizado, laminación magnética y selección de materiales son funcionales. No se atribuye a una fábrica un proceso exacto sin la correspondiente evidencia. El esquema de vapor satisface la geometría de una biela de longitud constante; esto no valida presión, rendimiento térmico ni distribución real de válvulas.

## Fuentes técnicas y bibliografía pendiente

Se consultaron secciones de adherencia, transmisión diésel eléctrica y frenos del [manual Open Rails](https://github.com/openrails/openrails/blob/056ba09d3701948a2da4b23e65de0a0f102eb6d2/Source/Documentation/Manual/physics.rst). Sirve para reconocer simplificaciones de simulación; no prueba especificaciones de los vehículos. La expresión de resistencia de Davis mostrada en ese texto presenta un exponente que requiere contraste, por lo que no se incorporó al programa.

Se recomiendan estas obras para ampliar el proyecto. **No se consultó su texto completo**, ni se inventan citas, ediciones o páginas:

- Simon Iwnicki (ed.), *Handbook of Railway Vehicle Dynamics*.
- A. H. Wickens, *Fundamentals of Rail Vehicle Dynamics*.
- Coenraad Esveld, *Modern Railway Track*.
- E. L. Ahrons, *The British Steam Railway Locomotive from 1825 to 1925*.

## Límites de esta edición

La selección es un itinerario de arquitecturas, no una sustitución tecnológica universal y lineal. Vapor, diésel, electrificación y levitación responden a condiciones distintas y pueden coexistir. Faltan casos de electrificación temprana, redes urbanas y amplias regiones del mundo. Para una investigación académica exhaustiva se necesitan además fuentes sobre trabajadores y pasajeros, archivos locales, estudios históricos independientes y evaluaciones económicas y ambientales con métodos explícitos.

El siguiente nivel de precisión requiere obtener los planos específicos, construir una matriz de cotas y revisiones por unidad, revisar cada mecanismo con especialistas y documentar las diferencias entre el modelo y el plano. Ese trabajo no se declara completado en esta entrega.
