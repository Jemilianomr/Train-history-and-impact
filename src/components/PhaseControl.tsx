import { useId } from "react";

export default function PhaseControl({
  phase,
  onChange,
}: {
  phase: number;
  onChange: (degrees: number) => void;
}) {
  const id = useId();
  return (
    <div className="phase-control">
      <div>
        <label htmlFor={id}>Estudiar paso a paso</label>
        <output htmlFor={id}>{phase}°</output>
      </div>
      <input
        id={id}
        aria-label="Posición manual del mecanismo"
        type="range"
        min="0"
        max="360"
        step="1"
        value={phase}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="phase-stops">
        {[0, 90, 180, 270, 360].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-label={`Situar mecanismo a ${n} grados`}
          >
            {n}°
          </button>
        ))}
      </div>
      <small>
        Al ajustar se pausa la animación. Ciclo ilustrativo, sin escala temporal
        real.
      </small>
    </div>
  );
}
