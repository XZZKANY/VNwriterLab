import type { SceneLink } from "../../editor/store/linkUtils";

export function resolveNextSceneId(
  links: SceneLink[],
  currentSceneId: string,
  selectedLabel: string,
) {
  const nextLink = links.find(
    (link) =>
      link.fromSceneId === currentSceneId &&
      link.linkType === "choice" &&
      link.label === selectedLabel,
  );

  return nextLink?.toSceneId ?? null;
}
