import { useNavigate } from "react-router-dom";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { buildOutlineView } from "../lib/outlineView";

export function ViewsPage() {
  const navigate = useNavigate();
  const currentProject = useProjectStore((state) => state.currentProject);
  const scenes = useEditorStore((state) => state.scenes);
  const links = useEditorStore((state) => state.links);
  const selectScene = useEditorStore((state) => state.selectScene);

  if (!currentProject) {
    return (
      <section>
        <h2>多视图</h2>
        <p>请先创建项目。</p>
      </section>
    );
  }

  const projectScenes = scenes.filter(
    (scene) => scene.projectId === currentProject.id,
  );
  const projectLinks = links.filter(
    (link) => link.projectId === currentProject.id,
  );
  const sections = buildOutlineView(
    currentProject.routes,
    projectScenes,
    projectLinks,
  );

  return (
    <section>
      <h2>多视图</h2>
      <h3>大纲视图</h3>
      {sections.length > 0 ? (
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
                        （入边 {scene.incomingCount} / 出边{" "}
                        {scene.outgoingCount}）
                      </span>
                      {scene.isStartScene ? <span> [起始]</span> : null}
                      {scene.isEndingScene ? <span> [结局]</span> : null}
                      <button
                        type="button"
                        onClick={() => {
                          selectScene(scene.sceneId);
                          navigate("/editor");
                        }}
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
      ) : (
        <p>暂无路线，创建路线后会显示大纲。</p>
      )}
    </section>
  );
}
