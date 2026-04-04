export interface SceneLink {
  id: string;
  projectId: string;
  fromSceneId: string;
  toSceneId: string;
  linkType: "default" | "choice" | "conditional" | "fallback";
  sourceBlockId: string | null;
  label: string;
  conditionId: string | null;
  priorityOrder: number;
}

export function buildChoiceLink(input: {
  projectId: string;
  fromSceneId: string;
  toSceneId: string;
  sourceBlockId: string;
  label: string;
}): SceneLink {
  return {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    fromSceneId: input.fromSceneId,
    toSceneId: input.toSceneId,
    linkType: "choice",
    sourceBlockId: input.sourceBlockId,
    label: input.label,
    conditionId: null,
    priorityOrder: 0,
  };
}
