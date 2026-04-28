import type { OutlineRouteSection } from "../lib/outlineView";

interface OutlineViewProps {
  sections: OutlineRouteSection[];
  onOpenScene: (sceneId: string) => void;
}

export function OutlineView({ sections, onOpenScene }: OutlineViewProps) {
  if (sections.length === 0) {
    return <p>暂无路线，创建路线后会显示大纲。</p>;
  }

  return (
    <>
      <h3>大纲视图</h3>
      <ul>
        {sections.map((section) => (
          <li key={section.routeId}>
            <h4>{section.routeName}</h4>
            {section.scenes.length > 0 ? (
              <ol>
                {section.scenes.map((scene) => (
                  <li key={scene.sceneId}>
                    <strong>{scene.title}</strong>
                    <span>
                      {" "}
                      （入边 {scene.incomingCount} / 出边 {scene.outgoingCount}
                      ）
                    </span>
                    {scene.isStartScene ? <span> [起始]</span> : null}
                    {scene.isEndingScene ? <span> [结局]</span> : null}
                    <button
                      type="button"
                      onClick={() => onOpenScene(scene.sceneId)}
                    >
                      返回编辑：{scene.title}
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p>当前路线暂无场景。</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
