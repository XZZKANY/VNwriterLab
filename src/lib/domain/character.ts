export interface Character {
  id: string;
  projectId: string;
  name: string;
  identity: string;
  appearance: string;
  personality: string;
  goal: string;
  secret: string;
  routeId: string | null;
  notes: string;
}

export function createEmptyCharacter(input: {
  projectId: string;
  index: number;
}): Character {
  const nextIndex = input.index + 1;

  return {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    name: `未命名角色 ${nextIndex}`,
    identity: "",
    appearance: "",
    personality: "",
    goal: "",
    secret: "",
    routeId: null,
    notes: "",
  };
}
