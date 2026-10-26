/** Position along the slider axis for a rigid, planar slider-crank. */
export function sliderPosition(
  angle: number,
  radius: number,
  length: number,
): number {
  if (length <= radius || radius <= 0)
    throw new RangeError("La biela debe ser más larga que la manivela.");
  return (
    radius * Math.cos(angle) +
    Math.sqrt(length * length - radius * radius * Math.sin(angle) ** 2)
  );
}

/** One illustrative revolution; not a real vehicle operating speed. */
export const ANGULAR_SPEED = 1.7;
export const timeAtPhase = (degrees: number) =>
  (degrees * Math.PI) / 180 / ANGULAR_SPEED;

/** Equal rolling distance for wheels of different diameters. */
export function rollingAngle(
  time: number,
  radius: number,
  referenceRadius: number,
) {
  return (-time * ANGULAR_SPEED * referenceRadius) / radius;
}

/** Two opposed, equal slider-cranks. Phasing is a teaching idealization. */
export function opposedSliders(
  angle: number,
  span: number,
  radius: number,
  rod: number,
) {
  const left = sliderPosition(angle, radius, rod);
  const right = span - sliderPosition(angle, radius, rod);
  if (span <= 2 * (rod + radius))
    throw new RangeError("Los pistones necesitan separación central.");
  return { left, right };
}
