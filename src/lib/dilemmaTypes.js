/**
 * Dilemma Module Types & Helper Functions
 */

export function createEmptyDilemma(index = 1) {
  return {
    id: crypto.randomUUID(),
    title: `Dilemma ${index}`,
    leftOption: {
      text: "",
      icon: "👈",
      imagePath: "",
    },
    rightOption: {
      text: "",
      icon: "👉",
      imagePath: "",
    },
  };
}

export function createEmptyDilemmaSession(title = "Ny dilemma-økt") {
  return {
    id: crypto.randomUUID(),
    title,
    description: "",
    dilemmas: [
      {
        id: crypto.randomUUID(),
        title: "Ville du helst...",
        leftOption: { text: "Alternativ A", icon: "👈", imagePath: "" },
        rightOption: { text: "Alternativ B", icon: "👉", imagePath: "" },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const PRESET_DILEMMA_SESSIONS = [
  {
    id: "preset-ville-du-helst",
    title: "Ville du helst...? (Isknuser)",
    description: "Morsomme og engasjerende dilemmaer for å starte timen eller oppstartsaktivitet.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dilemmas: [
      {
        id: "v1",
        title: "Superkrefter",
        leftOption: { text: "Kunne fly superraskt overalt", icon: "🦅" },
        rightOption: { text: "Være usynlig når du vil", icon: "🥷" },
      },
      {
        id: "v2",
        title: "Tidsreise",
        leftOption: { text: "Reise 500 år tilbake i tid", icon: "🏰" },
        rightOption: { text: "Reise 500 år frem i tid", icon: "🚀" },
      },
      {
        id: "v3",
        title: "Mat for resten av livet",
        leftOption: { text: "Spise kun pizza til alle måltider", icon: "🍕" },
        rightOption: { text: "Spise kun taco til alle måltider", icon: "🌮" },
      },
      {
        id: "v4",
        title: "Kommunikasjon",
        leftOption: { text: "Forstå og snakke med alle dyr", icon: "🐶" },
        rightOption: { text: "Snakke og forstå alle menneskelige språk flytende", icon: "🗣️" },
      },
      {
        id: "v5",
        title: "Klima og omgivelser",
        leftOption: { text: "Bo på et sted der det alltid er sommer og 30°C", icon: "☀️" },
        rightOption: { text: "Bo på et sted der det alltid er vinter og snø", icon: "❄️" },
      },
    ],
  },
  {
    id: "preset-etikk-hverdag",
    title: "Etikk og hverdagsvalg",
    description: "Dilemmaer som inviterer til etisk refleksjon og klassesamtale.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dilemmas: [
      {
        id: "e1",
        title: "Sannhet vs. Vennskap",
        leftOption: { text: "Si sannheten selv om en venn blir lei seg", icon: "🗣️" },
        rightOption: { text: "Beskytte vennen selv om du må fortelle en hvit løgn", icon: "🛡️" },
      },
      {
        id: "e2",
        title: "Inkludering i friminuttet",
        leftOption: { text: "Invitere noen som sitter alene, selv om leken må endres", icon: "🤝" },
        rightOption: { text: "Fortsette leken slik den var avtalt med gruppen", icon: "⚽" },
      },
      {
        id: "e3",
        title: "Bærekraft og forbruk",
        leftOption: { text: "Kjøpe kun brukte klær og ting for å spare miljøet", icon: "♻️" },
        rightOption: { text: "Kjøpe nye ting, men kaste og resirkulere ekstra nøye", icon: "🛍️" },
      },
      {
        id: "e4",
        title: "Rettferdighet",
        leftOption: { text: "Alle elever får nøyaktig samme oppgaver og støtte", icon: "⚖️" },
        rightOption: { text: "De som trenger ekstra hjelp får mer tid og tilpasning", icon: "🌱" },
      },
    ],
  },
  {
    id: "preset-teknologi-fremtid",
    title: "Teknologi og fremtid",
    description: "Diskusjonstemaer om kunstig intelligens, skjermtid og teknologi.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dilemmas: [
      {
        id: "t1",
        title: "Læring i skolen",
        leftOption: { text: "Bruke AI-verktøy til å forklare og skrive utkast i alle fag", icon: "🤖" },
        rightOption: { text: "Skrive alt for hånd i bøker uten digitale hjelpemidler", icon: "✏️" },
      },
      {
        id: "t2",
        title: "Fritid og skjerm",
        leftOption: { text: "Spille dataspill og kommunisere på nett med venner", icon: "🎮" },
        rightOption: { text: "Være ute i naturen eller drive med fysisk sport", icon: "🌲" },
      },
      {
        id: "t3",
        title: "Fremtidens transport",
        leftOption: { text: "Selvkjørende elektriske biler overalt", icon: "🚗" },
        rightOption: { text: "Superraske tog og mer gange/sykling i byene", icon: "🚆" },
      },
    ],
  },
];
