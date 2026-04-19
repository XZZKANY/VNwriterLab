export type NoteBlockType = "general" | "foreshadow" | "payoff";

export interface NoteBlockMeta {
  noteType: NoteBlockType;
  threadId: string | null;
}

export function createDefaultNoteBlockMeta(): NoteBlockMeta {
  return {
    noteType: "general",
    threadId: null,
  };
}

function normalizeNoteType(value: unknown): NoteBlockType {
  if (value === "foreshadow" || value === "payoff") {
    return value;
  }

  return "general";
}

export function parseNoteBlockMeta(metaJson: string | null): NoteBlockMeta {
  if (!metaJson) {
    return createDefaultNoteBlockMeta();
  }

  try {
    const parsed = JSON.parse(metaJson) as Partial<NoteBlockMeta>;
    const threadId =
      typeof parsed.threadId === "string" && parsed.threadId.trim().length > 0
        ? parsed.threadId.trim()
        : null;

    return {
      noteType: normalizeNoteType(parsed.noteType),
      threadId,
    };
  } catch {
    return createDefaultNoteBlockMeta();
  }
}

export function stringifyNoteBlockMeta(input: NoteBlockMeta) {
  const normalized = {
    noteType: normalizeNoteType(input.noteType),
    threadId: input.threadId?.trim() ? input.threadId.trim() : null,
  };

  return JSON.stringify(normalized);
}
