/**
 * A plataforma opera na cidade de Maputo, por isso o pedido recolhe apenas o
 * bairro — nunca rua nem número de porta. É a lista fechada usada no menu
 * USSD, no formulário web e no registo da família.
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

/** Ex.: "Mavalane A" → "Mavalane A, Maputo". */
export function formatLocation(location: string) {
  const bairro = location.trim();
  return bairro ? `${bairro}, ${CITY}` : "Localização não indicada";
}
