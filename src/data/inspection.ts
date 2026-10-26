import type { PartId, Train } from "../types";

export type InspectionKind =
  | "boiler"
  | "steam"
  | "deltic"
  | "motor"
  | "transformer"
  | "pantograph"
  | "bogie"
  | "maglev"
  | "generator";
export function inspectionKind(
  train: Train,
  part: PartId | null,
): InspectionKind | null {
  if (!part || part === "body") return null;
  if (train.id === "maglev")
    return ["power", "drive", "running"].includes(part) ? "maglev" : null;
  if (train.technology === "Vapor")
    return part === "power" ? "boiler" : part === "drive" ? "steam" : null;
  if (part === "running") return "bogie";
  if (train.id === "deltic")
    return part === "power" ? "deltic" : part === "drive" ? "generator" : null;
  return part === "power"
    ? "transformer"
    : part === "drive"
      ? "motor"
      : part === "supply"
        ? "pantograph"
        : null;
}
export const inspectionGuides: Record<
  InspectionKind,
  { title: string; labels: [string, string][]; note: string }
> = {
  boiler: {
    title: "Interior de la caldera",
    labels: [
      ["#a15d36", "Tubos de gases"],
      ["#317b9a", "Agua alrededor"],
      ["#d89b38", "Hogar y tiro"],
    ],
    note: "Corte didáctico · número de tubos y espesores esquemáticos",
  },
  steam: {
    title: "Del pistón a la rueda",
    labels: [
      ["#a15d36", "Pistón y vástago"],
      ["#58666a", "Cruceta y biela"],
      ["#ac812f", "Manivela"],
    ],
    note: "Biela de longitud constante · distribución no representada",
  },
  deltic: {
    title: "Tres bancos, pistones opuestos",
    labels: [
      ["#a15d36", "Pistones"],
      ["#58666a", "Bielas"],
      ["#ac812f", "Tres cigüeñales"],
    ],
    note: "18 cilindros · una sección abierta · fases idealizadas, no calado Napier",
  },
  motor: {
    title: "Máquina de tracción seccionada",
    labels: [
      ["#a15d36", "Devanados"],
      ["#58666a", "Rotor y eje"],
      ["#ac812f", "Transmisión"],
    ],
    note: "Polos, ranuras y relación de engranajes ilustrativos",
  },
  transformer: {
    title: "Transformar y refrigerar",
    labels: [
      ["#a15d36", "Devanados"],
      ["#58666a", "Núcleo laminado"],
      ["#317b9a", "Refrigeración"],
    ],
    note: "Corte funcional · sin esquema de conexiones del fabricante",
  },
  pantograph: {
    title: "Captación articulada",
    labels: [
      ["#58666a", "Brazos y pivotes"],
      ["#ac812f", "Frotador"],
      ["#317b9a", "Aisladores"],
    ],
    note: "Elevación demostrativa · no respuesta dinámica a catenaria",
  },
  bogie: {
    title: "Entre la caja y el carril",
    labels: [
      ["#58666a", "Ejes y rodadura"],
      ["#ac812f", "Suspensión"],
      ["#a15d36", "Frenos"],
    ],
    note: "Módulo funcional · reparto de ejes según arquitectura",
  },
  maglev: {
    title: "La guía forma parte del sistema",
    labels: [
      ["#a15d36", "Bobinas de propulsión"],
      ["#317b9a", "Imanes embarcados"],
      ["#58666a", "Bobinas EDS en ocho"],
    ],
    note: "Campos representados por color · no solución electromagnética",
  },
  generator: {
    title: "Transmisión diésel eléctrica",
    labels: [
      ["#a15d36", "Devanados"],
      ["#58666a", "Eje y rotor"],
      ["#ac812f", "Colector y escobillas"],
    ],
    note: "Un generador seccionado · representa uno de los dos grupos",
  },
};
