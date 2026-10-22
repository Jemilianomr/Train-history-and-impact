# Atlas ferroviario

Web interactiva en español sobre ingeniería, historia y sociedad ferroviaria. Incluye ocho vehículos, cuarenta grupos seleccionables, modelos 3D propios, diagramas animados y referencias documentales. Está orientada a graduados en ingeniería mecánica y eléctrica.

## Ejecutar

Requiere Node.js 22.12 o posterior; comprobado con Node 24.19 y npm 11.9.

```bash
npm ci
npm run dev
```

Abre la dirección que indique Vite en tu navegador. El servidor de desarrollo escucha en el puerto 5173 y en todas las interfaces. En el entorno de trabajo, si la caché predeterminada de npm no es escribible, usa `npm --cache /workspace/.npm-cache ci`.

```bash
npm run build
npm run preview -- --port 4173
```

La compilación genera `dist/`, publicable en un alojamiento estático. La aplicación no necesita servidor de datos, credenciales ni servicios de pago. Tipografías, iconos y geometrías se sirven localmente; los enlaces bibliográficos abren las instituciones externas.

## Publicar en GitHub Pages

El repositorio incluye [el flujo de publicación](.github/workflows/deploy-pages.yml). Compila el proyecto y publica `dist/` al actualizar `main`, o al ejecutarlo manualmente. Las rutas relativas de los recursos permiten servir la web bajo la carpeta del repositorio.

1. Abre **Settings → Pages → Build and deployment** del repositorio y selecciona **GitHub Actions** como **Source**.
2. En **Actions → Publicar Atlas ferroviario**, selecciona **Run workflow** para la rama `main`, o sube un cambio a esa rama.
3. Espera a que terminen los trabajos `build` y `deploy`. El entorno `github-pages` y el trabajo de despliegue mostrarán la dirección publicada.

La dirección esperada, si se utiliza el dominio predeterminado de GitHub Pages, es `https://jemilianomr.github.io/Train-history-and-impact/`. Subir el código por sí solo no confirma que esa dirección esté activa: GitHub Pages debe estar habilitado y el despliegue debe finalizar correctamente. La disponibilidad depende de la visibilidad del repositorio, del plan y de las políticas de la cuenta.

El flujo usa Node.js 24, dependencias fijadas y acciones fijadas a commits. El trabajo de compilación tiene permiso de lectura del código; únicamente el de despliegue solicita escritura en Pages y un token OIDC. No necesita un token personal añadido al proyecto.

## Colección

| Vehículo | Hito | País | Pregunta principal |
| --- | --- | --- | --- |
| Rocket | 1829 | Reino Unido | Caldera multitubular, tiro y transmisión por bielas |
| Garratt GL 2352 | 1929 | Sudáfrica | Articulación y reparto de cargas en terreno difícil |
| Union Pacific Big Boy | 1941 | Estados Unidos | Vapor, carga pesada y restricciones de infraestructura |
| English Electric Deltic DP1 | 1955 | Reino Unido | Pistones opuestos y transmisión diésel eléctrica |
| Shinkansen serie 0 | 1964 | Japón | Diseñar conjuntamente tren y línea dedicada |
| TGV Sud-Est | 1981 | Francia | Alta velocidad, tracción y articulación |
| Velaro E, serie 103 | 2007* | España | Equipos bajo el piso y tracción distribuida |
| SCMaglev L0 | 2013 | Japón | Propulsión lineal y sustentación electrodinámica |

*La página de Siemens consultada confirma la configuración Velaro E, pero no la fecha de entrada en servicio. El hito de 2007 queda identificado como pendiente de corroboración documental adicional en la aplicación. Las fechas de familia, ejemplar, servicio y ensayo se distinguen en cada ficha.

## Explorar

- Busca por nombre, país o año y filtra por región o tecnología.
- Gira y acerca la escena; selecciona un sistema directamente o con sus botones accesibles.
- Alterna ensamblado, desmontado y aislamiento. Aislar la caldera muestra sus tubos de forma esquemática.
- Abre el mecanismo para estudiar función, materiales, razones de diseño y evolución. La biela–manivela de vapor mantiene el cierre geométrico; no se simula el ciclo termodinámico.
- Consulta contexto social, compara vehículos y abre referencias de archivo en **Fuentes**.
- Recorre la cronología automáticamente, pausa el movimiento o cambia su velocidad.

El parámetro `?tren=deltic`, por ejemplo, conserva un vehículo al recargar o compartir una dirección. La aplicación respeta la preferencia de movimiento reducido y permite explorar sin animación.

## GPU y recursos

Three.js utiliza WebGL 2. No se requiere CUDA. En Windows, selecciona tu navegador en **Configuración → Sistema → Pantalla → Gráficos → Alto rendimiento**, activa su aceleración gráfica y reinícialo. El panel **Configuración gráfica** muestra el renderizador que expone el navegador; comprueba que corresponda a la NVIDIA y no a un renderizador de software.

| Perfil | Objetivo de animación | Límite de densidad de píxel | Sombras |
| --- | --- | --- | --- |
| Equilibrado | 30 fps | 1,25 | 1.024 × 1.024 |
| Alta calidad | 60 fps | 2 | 2.048 × 2.048 |

Solo permanece cargado el modelo actual. Se liberan geometrías y materiales al cambiar de tren; la escena se detiene al ocultar la pestaña y se dibuja bajo demanda cuando está pausada. Los contadores de geometrías y llamadas de dibujo ayudan a inspeccionar la carga, pero **no miden VRAM**. Los objetivos de fps no son garantías.

La validación de esta entrega se realizó con Chromium y SwiftShader en la nube. No se ha medido el rendimiento, consumo de memoria o temperatura en tu RTX 3060 Laptop de 6 GB y 16 GB de RAM.

## Investigación y precisión

Consulta [la investigación y sus referencias](docs/INVESTIGACION.md), [la auditoría](docs/AUDITORIA.md) y [el registro de recuperación documental](docs/research-access.json). La biblioteca distingue 17 fuentes consultadas de cuatro libros recomendados cuyo texto completo no se consultó.

Los modelos son reconstrucciones didácticas procedurales. Se documentan arquitecturas, disposiciones de ejes y determinadas magnitudes; las formas internas, cotas no verificadas, distribución de equipos y algunos movimientos son esquemáticos. **No son CAD certificados ni planos de fabricación.** Se aportan referencias exactas de archivo cuando se localizaron; no se obtuvieron juegos completos de planos originales de los ocho trenes. Cada ficha explica su alcance y las diferencias entre variantes.

La selección no constituye una historia universal: quedan fuera, entre otros, electrificación temprana, transporte urbano y casos latinoamericanos, indios y chinos. Los ocho casos conectan problemas técnicos con trabajo, industria, territorio, accesibilidad, segregación y patrimonio sin atribuir impactos económicos cuantitativos que las fuentes no demuestran.

## Verificación

```bash
npm run build
npm test
```

Las pruebas utilizan la compilación de producción y abren automáticamente el servidor de previsualización en el puerto 4173; este puerto debe estar libre. Si no hay Chromium instalado, ejecuta `npx playwright install chromium`. También puedes indicar el ejecutable mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

En Linux con `/usr/bin/chromium` se emplea SwiftShader para las pruebas de la nube. `PLAYWRIGHT_SOFTWARE_GPU=1` permite solicitarlo explícitamente. Esta configuración pertenece a las pruebas: no fuerza software en el navegador del usuario. Los informes se generan en `test-results/` y `playwright-report/`.

## Organización

- `src/data/`: casos, sistemas, contexto y referencias.
- `src/scene/`: construcción geométrica, cinemática, cámara y gestión de recursos WebGL.
- `src/components/`: visor, diagramas, miniaturas y diálogos.
- `src/App.tsx` y `src/style.css`: experiencia y diseño adaptable.
- `tests/`: comprobaciones funcionales, cinemáticas, de recursos y accesibilidad.
- `docs/`: investigación, auditoría y capturas.

Las geometrías, ilustraciones y composición visual se crearon para este proyecto. No se incorporan recursos de Civilization VI ni fotografías o planos de terceros. Las licencias de bibliotecas, iconos y tipografías se conservan en [public/licenses](public/licenses/README.md).
