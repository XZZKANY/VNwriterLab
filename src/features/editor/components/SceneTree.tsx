import { useState } from "react";
import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import { useProjectStore } from "@/features/projects/store/useProjectStore";
import {
  buildRouteGroups,
  sortByRouteAndSceneOrder,
} from "../lib/sceneTreeUtils";
import { useEditorStore } from "../store/useEditorStore";
import { SceneTreeRow } from "./SceneTreeRow";

interface SceneTreeProps {
  routes?: Route[];
  scenes: Scene[];
  selectedSceneId: string | null;
  onCreateScene: (routeId?: string) => void;
  onSelectScene: (sceneId: string) => void;
}

export function SceneTree({
  routes = [],
  scenes,
  selectedSceneId,
  onCreateScene,
  onSelectScene,
}: SceneTreeProps) {
  const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});
  const currentProject = useProjectStore((state) => state.currentProject);
  const moveSceneUp = useProjectStore((state) => state.moveSceneUp);
  const moveSceneDown = useProjectStore((state) => state.moveSceneDown);
  const moveSceneToRoute = useProjectStore((state) => state.moveSceneToRoute);
  const deleteProjectScene = useProjectStore((state) => state.deleteScene);
  const deleteLocalScene = useEditorStore((state) => state.deleteScene);

  function handleDeleteScene(sceneId: string) {
    if (currentProject) {
      deleteProjectScene(sceneId);
      return;
    }
    deleteLocalScene(sceneId);
  }

  function handleMoveTargetChange(sceneId: string, targetRouteId: string) {
    setMoveTargets((currentTargets) => ({
      ...currentTargets,
      [sceneId]: targetRouteId,
    }));
  }

  function handleMoveToRoute(sceneId: string, targetRouteId: string) {
    moveSceneToRoute(sceneId, targetRouteId);
    setMoveTargets((currentTargets) => ({
      ...currentTargets,
      [sceneId]: targetRouteId,
    }));
  }

  const routeGroups = buildRouteGroups(routes, scenes);

  if (routeGroups.length === 0) {
    return (
      <aside>
        <button type="button" onClick={() => onCreateScene()}>
          新建场景
        </button>
        <ul>
          {[...scenes].sort(sortByRouteAndSceneOrder).map((scene) => (
            <li key={scene.id}>
              <button
                type="button"
                aria-pressed={scene.id === selectedSceneId}
                onClick={() => onSelectScene(scene.id)}
              >
                {scene.title}
              </button>
              <button type="button" onClick={() => handleDeleteScene(scene.id)}>
                删除场景
              </button>
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  return (
    <aside>
      <ul>
        {routeGroups.map(({ route, scenes: routeScenes }) => (
          <li key={route.id}>
            <div>
              <strong>{route.name}</strong>
              <button type="button" onClick={() => onCreateScene(route.id)}>
                在此路线新建场景
              </button>
            </div>
            <ul>
              {routeScenes.map((scene, index) => (
                <SceneTreeRow
                  key={scene.id}
                  scene={scene}
                  isSelected={scene.id === selectedSceneId}
                  canMoveUp={index > 0}
                  canMoveDown={index < routeScenes.length - 1}
                  routes={routes}
                  targetRouteId={moveTargets[scene.id] ?? scene.routeId}
                  onSelectScene={onSelectScene}
                  onMoveSceneUp={moveSceneUp}
                  onMoveSceneDown={moveSceneDown}
                  onDeleteScene={handleDeleteScene}
                  onMoveTargetChange={handleMoveTargetChange}
                  onMoveToRoute={handleMoveToRoute}
                />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  );
}
