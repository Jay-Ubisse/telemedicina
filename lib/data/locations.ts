/**
 * A plataforma opera na cidade de Maputo, por isso o pedido recolhe apenas
 * "Localização" (bairro / avenida) em vez de província + distrito.
 */
export const maputoNeighbourhoods = [
  "Mavalane A",
  "Mavalane B",
  "Hulene A",
  "Hulene B",
  "Costa do Sol",
  "Ferroviário",
  "Laulane",
  "Magoanine",
  "Malhangalene",
  "Maxaquene",
  "Polana Caniço A",
  "Polana Caniço B",
  "Alto Maé",
  "Chamanculo",
  "Xipamanine",
  "Zimpeto",
] as const;

export const CITY = "Maputo";

/** Ex.: "Mavalane A, Av. de Moçambique" → mostrado tal e qual no dashboard. */
export function formatLocation(location: string) {
  return location.trim() || "Localização não indicada";
}
