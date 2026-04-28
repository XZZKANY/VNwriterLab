import { useLocation, useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useEditorStore } from "@/features/editor/store/useEditorStore";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import { resolveRouteMeta } from "./appShell.config";

export function AppTopbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentProject = useProjectStore((state) => state.currentProject);

  const { scenes, selectedSceneId, selectScene } = useEditorStore(
    useShallow((state) => ({
      scenes: state.scenes,
      selectedSceneId: state.selectedSceneId,
      selectScene: state.selectScene,
    })),
  );

  const meta = resolveRouteMeta(location.pathname);
  const currentScene =
    scenes.find((scene) => scene.id === selectedSceneId) ?? null;

  const handlePrimaryAction = () => {
    if (currentScene) {
      selectScene(currentScene.id);
    }
    navigate("/editor");
  };

  return (
    <header className="app-shell__topbar" role="banner">
      <div className="app-shell__topbar-main">
        <p className="app-shell__eyebrow">{meta.title}</p>
        <h1 className="app-shell__topbar-title">
          {currentProject?.name ?? "VN Writer Lab"}
        </h1>
        <p className="app-shell__context">
          当前项目：{currentProject?.name ?? "暂无项目"}
        </p>
        <p className="app-shell__context">
          {currentScene ? `最近场景：${currentScene.title}` : "最近场景：暂无"}
        </p>
      </div>
      <div className="app-shell__topbar-actions">
        <input
          aria-label="全局搜索入口"
          placeholder="搜索场景、角色、设定"
          className="app-shell__topbar-search"
        />
        <button
          type="button"
          className="app-shell__topbar-primary"
          onClick={handlePrimaryAction}
        >
          {meta.primaryActionLabel}
        </button>
      </div>
    </header>
  );
}
