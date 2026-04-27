import type { LoreSceneAssociation } from "../lib/loreSceneAssociations";

interface LoreSceneAssociationListProps {
  associations: LoreSceneAssociation[];
}

export function LoreSceneAssociationList({
  associations,
}: LoreSceneAssociationListProps) {
  return (
    <section aria-label="与场景的基础关联">
      <h4>与场景的基础关联</h4>
      {associations.length > 0 ? (
        <ul>
          {associations.map((association) => (
            <li key={association.sceneId}>
              <strong>{association.sceneTitle}</strong>
              <div>命中字段：{association.matchedFields.join("、")}</div>
              <div>提及内容：{association.snippet}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>当前设定还没有在场景标题、简介或正文中被提及。</p>
      )}
    </section>
  );
}
