/**
 * A plataforma opera na cidade de Maputo, por isso o pedido recolhe apenas o
 * bairro — nunca rua nem número de porta.
 *
 * A lista deixou de ser fechada: o relatório pede que o utilizador possa
 * indicar um bairro que não conste da lista, tanto no simulador USSD (§6) como
 * no formulário de criação de conta da plataforma web (§13). Daí a opção
 * «Outro», que abre um campo de texto.
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

/** Valor sentinela da opção «Outro» nos formulários web. */
export const OTHER_LOCATION = "__OUTRO__";

/** Texto da opção «Outro». */
export const OTHER_LOCATION_LABEL = "Outro";

/** O bairro consta da lista fechada? */
export function isListedNeighbourhood(value: string) {
  return (maputoNeighbourhoods as readonly string[]).includes(value.trim());
}

/**
 * Normaliza um bairro escrito à mão: espaços colapsados e inicial maiúscula em
 * cada palavra significativa, para não entrarem "hulene b" e "HULENE B" como
 * dois bairros diferentes.
 */
export function normalizeNeighbourhood(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned === "") return "";

  const listed = (maputoNeighbourhoods as readonly string[]).find(
    (item) => item.toLowerCase() === cleaned.toLowerCase(),
  );
  if (listed) return listed;

  return cleaned
    .split(" ")
    .map((word) =>
      word.length <= 2 && word === word.toUpperCase()
        ? word
        : word[0].toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** Ex.: "Mavalane A" → "Mavalane A, Maputo". */
export function formatLocation(location: string) {
  const bairro = location.trim();
  return bairro ? `${bairro}, ${CITY}` : "Localização não indicada";
}
