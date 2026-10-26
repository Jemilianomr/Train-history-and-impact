import { useEffect, useId, useRef } from "react";
import type { Part } from "../types";
import { sliderPosition, timeAtPhase, ANGULAR_SPEED } from "../scene/mechanics";

export default function Mechanism({
  part,
  playing,
  speed = 1,
  phase = 0,
  seek = 0,
}: {
  part: Part;
  playing: boolean;
  speed?: number;
  phase?: number;
  seek?: number;
}) {
  const svg = useRef<SVGSVGElement>(null),
    time = useRef(0),
    prefix = useId().replace(/:/g, "");
  const draw = () => {
    const el = svg.current;
    if (!el) return;
    const angle = -time.current * ANGULAR_SPEED;
    if (part.diagram === "steam") {
      const cx = 85,
        cy = 112,
        r = 24,
        l = 101,
        px = cx + r * Math.cos(angle),
        py = cy + r * Math.sin(angle),
        x = cx + sliderPosition(angle, r, l);
      el.querySelector("[data-crank]")?.setAttribute(
        "transform",
        `rotate(${(angle * 180) / Math.PI} ${cx} ${cy})`,
      );
      const rod = el.querySelector("[data-rod]");
      rod?.setAttribute("x1", String(px));
      rod?.setAttribute("y1", String(py));
      rod?.setAttribute("x2", String(x));
      rod?.setAttribute("y2", String(cy));
      el.querySelector("[data-slider]")?.setAttribute(
        "transform",
        `translate(${x - 186} 0)`,
      );
    }
    if (part.diagram === "deltic")
      el.querySelectorAll("[data-piston]").forEach((e, i) => {
        const offset =
          (sliderPosition(
            -angle + (Math.floor(i / 2) * 2 * Math.PI) / 3,
            8,
            32,
          ) -
            32) *
          (i % 2 ? -1 : 1);
        e.setAttribute("transform", `translate(${offset} 0)`);
      });
    el.querySelectorAll<SVGGElement>(".motor-rotor").forEach((e) => {
      e.style.animation = "none";
      e.style.transform = `rotate(${angle}rad)`;
    });
    el.querySelectorAll<SVGElement>(".energy-dash").forEach((e) => {
      e.style.animation = "none";
      e.style.strokeDashoffset = String(angle * 5);
    });
    el.querySelectorAll<SVGElement>(".magnetic-coil").forEach((e, i) => {
      e.style.animation = "none";
      e.style.opacity = String(
        0.35 + (0.65 * (1 + Math.sin(angle - i * 0.7))) / 2,
      );
    });
    el.dataset.phase = String(
      Math.round(
        ((((time.current * ANGULAR_SPEED * 180) / Math.PI) % 360) + 360) % 360,
      ),
    );
  };
  useEffect(() => {
    time.current = timeAtPhase(phase);
    draw();
  }, [phase, seek, part]);
  useEffect(() => {
    if (!playing) {
      draw();
      return;
    }
    let frame = 0,
      last = 0,
      painted = 0;
    const loop = (now: number) => {
      frame = 0;
      if (document.hidden) return;
      time.current += last ? Math.min((now - last) / 1000, 0.06) * speed : 0;
      last = now;
      if (now - painted >= 32) {
        draw();
        painted = now;
      }
      frame = requestAnimationFrame(loop);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!document.hidden) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [playing, speed, part]);
  const animated = playing ? "diagram running" : "diagram";
  return (
    <svg
      ref={svg}
      className={animated}
      viewBox="0 0 320 180"
      role="img"
      aria-label={`Esquema didáctico: ${part.name}`}
      style={{ "--diagram-speed": `${3 / speed}s` } as React.CSSProperties}
    >
      <defs>
        <pattern
          id={`${prefix}-grid`}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".65" fill="#b6c1b0" />
        </pattern>
        <marker
          id={`${prefix}-arrow`}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10z" fill="#bb714c" />
        </marker>
      </defs>
      <rect
        x="0"
        y="0"
        width="320"
        height="180"
        fill={`url(#${prefix}-grid)`}
      />
      {part.diagram === "boiler" && (
        <>
          <path
            d="M43 125V68q0-17 19-17h174v74z"
            fill="#d9dfc8"
            stroke="#71846a"
            strokeWidth="3"
          />
          <path d="M54 94h181v28H54z" fill="#a9c5bf" />
          <rect
            x="235"
            y="62"
            width="48"
            height="70"
            rx="5"
            fill="#b98b60"
            stroke="#7b7757"
            strokeWidth="3"
          />
          <path
            d="M242 121q-4-20 12-29q-1 14 8 12q-1-14 6-23q18 28 4 40z"
            fill="#d99b58"
          />
          {[77, 91, 105, 117].map((y) => (
            <path key={y} d={`M48 ${y}h188`} stroke="#bca16c" strokeWidth="5" />
          ))}
          {[77, 91, 105, 117].map((y) => (
            <path
              key={y}
              className="energy-dash"
              d={`M235 ${y}H49`}
              stroke="#f5ce8c"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
          ))}
          <path
            d="M52 78V27h17v44M173 51V30h44"
            stroke="#71846a"
            fill="none"
            strokeWidth="7"
          />
          <path
            className="energy-dash"
            d="M173 52V30h53"
            stroke="#b07d4d"
            fill="none"
            strokeWidth="2"
            strokeDasharray="5 6"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <text x="82" y="38">
            VAPOR
          </text>
          <text x="89" y="147">
            TUBOS · AGUA ALREDEDOR
          </text>
          <text x="245" y="149">
            HOGAR
          </text>
        </>
      )}
      {part.diagram === "pantograph" && (
        <>
          <path d="M24 36h274" stroke="#667b62" strokeWidth="3" />
          <path d="M24 29h274" stroke="#aab49b" strokeWidth="1" />
          <path
            d={
              part.pantographKind === "diamond"
                ? "M142 137L78 87 142 38 212 87Z"
                : "M68 137l137-52-72-47M85 137l137-52-72-47"
            }
            fill="none"
            stroke="#657b62"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M111 38h62" stroke="#b98c54" strokeWidth="6" />
          <path
            className="energy-dash"
            d={
              part.pantographKind === "diamond"
                ? "M142 38L212 87 142 137"
                : "M141 36l71 48-136 54"
            }
            stroke="#c08a55"
            strokeWidth="2"
            strokeDasharray="5 7"
            fill="none"
          />
          <rect x="56" y="139" width="190" height="13" rx="4" fill="#afbba0" />
          {[78, 219].map((x) => (
            <g key={x}>
              <path d={`M${x} 137v-15`} stroke="#b59b6f" strokeWidth="6" />
              <path
                d={`M${x - 8} 126h16M${x - 8} 132h16`}
                stroke="#b59b6f"
                strokeWidth="3"
              />
            </g>
          ))}
          <circle cx="212" cy="85" r="5" fill="#d0b372" />
          {part.pantographKind === "diamond" && (
            <circle cx="78" cy="87" r="5" fill="#d0b372" />
          )}
          <text x="23" y="19">
            CATENARIA
          </text>
          <text x="96" y="171">
            CONTACTO · AISLAMIENTO
          </text>
        </>
      )}
      {part.diagram === "transformer" && (
        <>
          <path
            d="M68 44h90v94H68zM88 64v54h50V64z"
            fill="#8b9e82"
            fillRule="evenodd"
            stroke="#687f62"
            strokeWidth="2"
          />
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <path
                d={`M59 ${62 + i * 8}h40`}
                stroke="#bb8155"
                strokeWidth="5"
              />
              <path
                d={`M129 ${62 + i * 8}h40`}
                stroke="#d0ad6c"
                strokeWidth="5"
              />
            </g>
          ))}
          <path
            d="M23 76h36M23 116h36M169 76h31M169 116h31"
            fill="none"
            stroke="#849c7a"
            strokeWidth="3"
          />
          <rect
            x="201"
            y="66"
            width="75"
            height="61"
            rx="5"
            fill="#dbe2ce"
            stroke="#8b9d7d"
            strokeWidth="2"
          />
          <path
            d="M214 97h14l11-13v26l11-13h14"
            fill="none"
            stroke="#b88753"
            strokeWidth="2"
          />
          <path
            className="energy-dash"
            d="M18 76h42M170 76h28M278 95h25"
            stroke="#b8814c"
            strokeDasharray="4 6"
            strokeWidth="2"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <text x="37" y="26">
            NÚCLEO Y DEVANADOS
          </text>
          <text x="205" y="151">
            CONVERSIÓN
          </text>
          <text x="72" y="159">
            ESQUEMA FUNCIONAL
          </text>
        </>
      )}
      {part.diagram === "tender" && (
        <>
          <path
            d="M42 127V57h230v70z"
            fill="#bbc9ae"
            stroke="#708866"
            strokeWidth="3"
          />
          <path d="M149 62h118v57H149z" fill="#9abdb9" />
          <path d="M147 59v64" stroke="#6b8461" strokeWidth="4" />
          <path
            d="M48 66l11-10 9 9 13-14 13 10 8-10 12 14 10-9 16 10v49H48z"
            fill="#55694d"
          />
          {[77, 239].map((x) => (
            <g key={x}>
              <circle cx={x} cy="137" r="13" fill="#657c5c" />
              <circle cx={x} cy="137" r="4" fill="#c7b179" />
            </g>
          ))}
          <path
            className="energy-dash"
            d="M264 111h29v-61"
            fill="none"
            stroke="#668f88"
            strokeWidth="3"
            strokeDasharray="5 6"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <text x="59" y="41">
            COMBUSTIBLE
          </text>
          <text x="188" y="41">
            AGUA
          </text>
          <text x="86" y="171">
            AUTONOMÍA Y MASA VARIABLE
          </text>
        </>
      )}
      {part.diagram === "generator" && (
        <>
          <rect
            x="24"
            y="61"
            width="70"
            height="63"
            rx="7"
            fill="#afbea1"
            stroke="#71876a"
            strokeWidth="2"
          />
          <path
            d="M39 74h40M39 83h40M39 92h40M39 101h40"
            stroke="#7c9374"
            strokeWidth="3"
          />
          <path d="M95 91h28" stroke="#a48e64" strokeWidth="6" />
          <circle
            cx="151"
            cy="92"
            r="31"
            fill="#d5c593"
            stroke="#809174"
            strokeWidth="4"
          />
          <g className="motor-rotor">
            <path d="M151 68v48M127 92h48" stroke="#9a865b" strokeWidth="5" />
            <circle cx="151" cy="92" r="8" fill="#667d5f" />
          </g>
          <path
            className="energy-dash"
            d="M184 91h38"
            stroke="#bb8753"
            strokeWidth="3"
            strokeDasharray="4 6"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <rect
            x="231"
            y="66"
            width="62"
            height="50"
            rx="13"
            fill="#c3d1b7"
            stroke="#769268"
            strokeWidth="3"
          />
          <text x="36" y="143">
            DIÉSEL
          </text>
          <text x="119" y="143">
            GENERADOR
          </text>
          <text x="238" y="143">
            MOTORES
          </text>
          <text x="51" y="30">
            MECÁNICA → ELÉCTRICA → MECÁNICA
          </text>
        </>
      )}
      {part.diagram === "cooling" && (
        <>
          <rect
            x="32"
            y="55"
            width="80"
            height="86"
            rx="4"
            fill="#b7c8ac"
            stroke="#7a9270"
            strokeWidth="3"
          />
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d={`M39 ${64 + i * 9}h66`}
              stroke="#839a7b"
              strokeWidth="3"
            />
          ))}
          <path
            d="M113 68h91v64h-91"
            stroke="#b07c51"
            strokeWidth="5"
            fill="none"
          />
          <path
            className="energy-dash"
            d="M113 68h91v64h-91"
            stroke="#f0c98d"
            strokeWidth="2"
            strokeDasharray="6 7"
            fill="none"
          />
          <circle
            cx="240"
            cy="97"
            r="37"
            fill="#dce5ce"
            stroke="#79926f"
            strokeWidth="2"
          />
          <g transform="translate(89 5)">
            <g className="motor-rotor">
              <path
                d="M151 92q-15-43 9-24t-9 24q43-15 24 9t-24-9q15 43-9 24t9-24q-43 15-24-9t24 9"
                fill="#8aa27c"
              />
              <circle cx="151" cy="92" r="7" fill="#bc9b65" />
            </g>
          </g>
          <text x="32" y="36">
            INTERCAMBIADOR
          </text>
          <text x="193" y="153">
            VENTILACIÓN
          </text>
          <text x="122" y="113">
            CALOR →
          </text>
        </>
      )}
      {part.diagram === "steam" && (
        <>
          <rect
            x="207"
            y="89"
            width="81"
            height="47"
            rx="3"
            fill="#c2c9b6"
            stroke="#6d7e6a"
          />
          <rect x="213" y="96" width="67" height="33" fill="#e4d7ae" />
          <path
            d="M220 90V45h-55"
            fill="none"
            stroke="#bb714c"
            strokeWidth="4"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <path
            className="energy-dash"
            d="M220 90V45h-55"
            fill="none"
            stroke="#faebc2"
            strokeWidth="2"
            strokeDasharray="4 8"
          />
          <path d="M62 148h228" stroke="#6c7e69" strokeWidth="3" />
          <circle
            cx="85"
            cy="112"
            r="34"
            fill="#dae0d1"
            stroke="#4e6456"
            strokeWidth="7"
          />
          <g data-crank>
            <path
              d="M85 79v66M52 112h66M62 89l46 46M62 135l46-46"
              stroke="#6a806b"
              strokeWidth="4"
            />
            <circle cx="109" cy="112" r="5" fill="#b57648" />
          </g>
          <g data-slider>
            <path d="M186 112h66" stroke="#627367" strokeWidth="7" />
            <rect x="244" y="96" width="12" height="33" fill="#b3794d" />
          </g>
          <line
            data-rod
            x1="109"
            y1="112"
            x2="210"
            y2="112"
            stroke="#d0ad6b"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="85" cy="112" r="5" fill="#536e5e" />
          <text x="27" y="35">
            BIELA–MANIVELA
          </text>
          <text x="226" y="161">
            PISTÓN
          </text>
        </>
      )}
      {part.diagram === "deltic" && (
        <>
          <path
            d="M160 32L83 147h154z"
            fill="#d8dfce"
            stroke="#627a66"
            strokeWidth="7"
          />
          {[
            { x: 160, y: 32, a: 124 },
            { x: 83, y: 147, a: 0 },
            { x: 237, y: 147, a: -124 },
          ].map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.a})`}>
              <rect
                x="18"
                y="-12"
                width="94"
                height="24"
                fill="#c4ccba"
                stroke="#70836c"
              />
              <g data-piston>
                <rect x="32" y="-10" width="20" height="20" fill="#be9257" />
                <path d="M0 0h45" stroke="#617868" strokeWidth="4" />
              </g>
              <g data-piston>
                <rect x="81" y="-10" width="20" height="20" fill="#be9257" />
                <path d="M89 0h43" stroke="#617868" strokeWidth="4" />
              </g>
            </g>
          ))}
          {[
            [160, 32],
            [83, 147],
            [237, 147],
          ].map(([x, y]) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r="10"
              fill="#567060"
              stroke="#dfc694"
              strokeWidth="4"
            />
          ))}
          <text x="17" y="21">
            TRES BANCOS · PISTONES OPUESTOS
          </text>
          <text x="116" y="104">
            SECCIÓN Δ
          </text>
        </>
      )}
      {part.diagram === "motor" && (
        <>
          {part.motorKind === "dc" && (
            <>
              <rect
                x="135"
                y="83"
                width="32"
                height="18"
                rx="4"
                fill="#bd8251"
              />
              <text x="230" y="28">
                MOTOR CC
              </text>
            </>
          )}
          <circle
            cx="151"
            cy="92"
            r="64"
            fill="#a9b9a5"
            stroke="#5c7562"
            strokeWidth="3"
          />
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x="143"
              y="34"
              width="16"
              height="26"
              rx="4"
              transform={`rotate(${i * 30} 151 92)`}
              fill={i % 2 ? "#b87851" : "#dbc089"}
              stroke="#f1e6ce"
            />
          ))}
          <circle
            cx="151"
            cy="92"
            r="33"
            fill="#e0dfc5"
            stroke="#7c917c"
            strokeWidth="4"
          />
          <g className="motor-rotor">
            <path d="M151 62v60M121 92h60" stroke="#7b9680" strokeWidth="8" />
            <circle cx="151" cy="92" r="12" fill="#486957" />
          </g>
          {part.motorKind === "dc" && (
            <>
              <circle
                cx="151"
                cy="92"
                r="14"
                fill="#bc8658"
                stroke="#705c42"
                strokeWidth="2"
              />
              <path d="M151 78v28" stroke="#ece0c1" strokeWidth="2" />
              <path d="M128 92h10M164 92h10" stroke="#435952" strokeWidth="7" />
            </>
          )}
          <path
            d="M229 62q27 22 0 50"
            stroke="#b67650"
            strokeWidth="3"
            fill="none"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <text x="21" y="20">
            ESTATOR
          </text>
          <path d="M65 24l35 22" stroke="#7d8d79" />
          <text x="235" y="144">
            PAR →
          </text>
          <text x="124" y="172">
            ROTOR
          </text>
        </>
      )}
      {part.diagram === "maglev" && (
        <>
          <path
            d="M38 142h245M53 81v61M267 81v61"
            stroke="#6f8976"
            strokeWidth="10"
            fill="none"
          />
          <rect
            x="91"
            y="40"
            width="138"
            height="62"
            rx="20"
            fill="#e1e6d8"
            stroke="#7d9680"
            strokeWidth="2"
          />
          <path d="M95 77h130" stroke="#537e9e" strokeWidth="6" />
          {[70, 100, 130, 160, 190, 220, 250].map((x, i) => (
            <g key={x}>
              <rect
                className="magnetic-coil"
                style={{ animationDelay: `${i * -0.15}s` }}
                x={x - 9}
                y="115"
                width="19"
                height="13"
                rx="4"
                fill={i % 2 ? "#bd8557" : "#5a8575"}
              />
            </g>
          ))}
          <path
            className="energy-dash"
            d="M68 106h187"
            stroke="#bc784a"
            strokeDasharray="5 7"
            strokeWidth="2"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <text x="18" y="21">
            CAMPO VIAJERO
          </text>
          <text x="93" y="164">
            GUÍA CON BOBINAS
          </text>
          <path d="M148 114v-12M174 114v-12" stroke="#648e70" strokeWidth="2" />
        </>
      )}
      {part.diagram === "bogie" && (
        <>
          <path d="M26 148h269" stroke="#6c7d68" strokeWidth="5" />
          <rect x="49" y="69" width="222" height="20" rx="4" fill="#6d826c" />
          <rect x="137" y="44" width="46" height="25" rx="4" fill="#bfa36a" />
          {[84, 237].map((x) => (
            <g key={x}>
              <circle
                cx={x}
                cy="117"
                r="27"
                fill="#d2dbcb"
                stroke="#4f6857"
                strokeWidth="8"
              />
              <circle cx={x} cy="117" r="8" fill="#b8925b" />
              <path
                d={`M${x - 13} 75l26 4-26 4 26 4-26 4 26 4-26 4`}
                stroke="#465e4d"
                strokeWidth="2"
                fill="none"
              />
              <rect
                x={x + 28}
                y="105"
                width="10"
                height="24"
                rx="3"
                fill="#b57651"
              />
            </g>
          ))}
          <path d="M84 117h153" stroke="#8da18b" strokeWidth="7" />
          <text x="16" y="25">
            SUSPENSIÓN · GUIADO · FRENADO
          </text>
        </>
      )}
      {part.diagram === "structure" && (
        <>
          <path
            d="M38 130V68l34-30h165l43 32v60z"
            fill="#dce2d2"
            stroke="#738971"
            strokeWidth="2"
          />
          <path
            d="M39 130l48-61 49 61 47-61 48 61 48-60M72 38l15 31h144l6-31M39 130h240"
            fill="none"
            stroke="#859b80"
            strokeWidth="3"
          />
          <path
            className="energy-dash"
            d="M39 140h240"
            fill="none"
            stroke="#b67b51"
            strokeWidth="3"
            strokeDasharray="6 5"
          />
          <path
            d="M110 18v32M204 18v32"
            stroke="#b67b51"
            strokeWidth="2"
            markerEnd={`url(#${prefix}-arrow)`}
          />
          <text x="88" y="168">
            CARGAS · ESTRUCTURA · UNIONES
          </text>
        </>
      )}
    </svg>
  );
}
