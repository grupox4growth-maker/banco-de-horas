export type Block = { inicio: string; termino: string; titulo: string; pausa?: boolean };

const PAUSA_RE = /almo|pausa|intervalo|descanso/i;

/** Lê os blocos de um texto: uma linha por bloco, "HH:MM-HH:MM Título". */
export function parseBlocks(text: string): Block[] {
  const out: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\d{1,2}:\d{2})\s*[-–—à]+\s*(\d{1,2}:\d{2})\s+(.+)$/);
    if (!m) continue;
    const titulo = m[3].trim();
    out.push({ inicio: m[1], termino: m[2], titulo, pausa: PAUSA_RE.test(titulo) });
  }
  // ordena por horário de início
  out.sort((a, b) => a.inicio.localeCompare(b.inicio));
  return out;
}

export function blocksToText(blocks: Block[]): string {
  return blocks.map((b) => `${b.inicio}-${b.termino} ${b.titulo}`).join("\n");
}

export function asBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) return [];
  return value.filter((b) => b && typeof b === "object" && "inicio" in b) as Block[];
}

// Rotina de exemplo (baseada na imagem enviada — "Time 8AM").
export const EXAMPLE_ROUTINE: { name: string; blocks: Block[] } = {
  name: "Time 8AM",
  blocks: [
    { inicio: "08:00", termino: "09:00", titulo: "Bloco 4: Confirmação + Follow-up (Manhã)" },
    { inicio: "09:00", termino: "09:30", titulo: "Bloco 1: Kickstart + Review" },
    { inicio: "09:30", termino: "11:00", titulo: "Bloco 2: Hora de Ouro (Prospecção)" },
    { inicio: "11:00", termino: "11:30", titulo: "Bloco 3: Pesquisa Ativa" },
    { inicio: "11:30", termino: "12:50", titulo: "Almoço", pausa: true },
    { inicio: "12:50", termino: "14:00", titulo: "Bloco 5: Confirmação + Follow-up (Tarde)" },
    { inicio: "14:00", termino: "15:30", titulo: "Bloco 2: Hora de Ouro (Prospecção)" },
    { inicio: "15:30", termino: "16:00", titulo: "Pausa - intercalada", pausa: true },
    { inicio: "16:00", termino: "17:00", titulo: "Bloco 6: Inteligência Comercial" },
  ],
};
