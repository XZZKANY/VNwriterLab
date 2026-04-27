import type { SceneLink } from "@/lib/domain/link";

export type { SceneLink };

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
