/** Position along the slider axis for a rigid, planar slider-crank. */
export function sliderPosition(angle: number, radius: number, length: number): number {
  if (length <= radius || radius <= 0) throw new RangeError('La biela debe ser más larga que la manivela.');
  return radius * Math.cos(angle) + Math.sqrt(length * length - radius * radius * Math.sin(angle) ** 2);
}
