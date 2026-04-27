import type { CharacterSceneReference } from "../lib/characterReferences";

interface CharacterSceneReferenceListProps {
  references: CharacterSceneReference[];
}

export function CharacterSceneReferenceList({
  references,
}: CharacterSceneReferenceListProps) {
  return (
    <section aria-label="角色场景引用">
      <h4>被哪些场景引用</h4>
      {references.length > 0 ? (
        <>
          <p>当前角色在 {references.length} 个场景中被引用。</p>
          <ul aria-label="场景引用列表">
            {references.map(({ scene, blockCount, isFirstAppearance }) => (
              <li key={scene.id}>
                {`${scene.title}（${blockCount} 处${
                  isFirstAppearance ? "，首次出场" : ""
                }）`}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>当前角色尚未被任何场景块引用。</p>
      )}
    </section>
  );
}
