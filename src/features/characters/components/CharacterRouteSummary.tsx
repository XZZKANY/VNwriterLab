import type { CharacterRouteSummary as CharacterRouteSummaryData } from "../lib/characterReferences";

interface CharacterRouteSummaryProps {
  summary: CharacterRouteSummaryData | null;
}

export function CharacterRouteSummary({ summary }: CharacterRouteSummaryProps) {
  return (
    <section aria-label="角色关联展示">
      <h4>与路线的关联</h4>
      {summary ? (
        <>
          <p>{summary.title}</p>
          <p>{summary.description}</p>
          {summary.scenes.length > 0 ? (
            <ul aria-label="路线场景列表">
              {summary.scenes.map((scene) => (
                <li key={scene.id}>{scene.title}</li>
              ))}
            </ul>
          ) : (
            <p>当前路线下暂无场景。</p>
          )}
        </>
      ) : (
        <p>当前角色尚未关联路线。</p>
      )}
    </section>
  );
}
