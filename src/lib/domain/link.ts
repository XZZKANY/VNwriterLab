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
