import { useState } from "react";
import type { Route } from "../../../lib/domain/project";
import type { Scene } from "../../../lib/domain/scene";
import { useProjectStore } from "../../projects/store/useProjectStore";
import { useEditorStore } from "../store/useEditorStore";

interface SceneTreeProps {
  routes?: Route[];
  scenes: Scene[];
  selectedSceneId: string | null;
  onCreateScene: (routeId?: string) => void;
  onSelectScene: (sceneId: string) => void;
}

function sortByRouteAndSceneOrder(left: Scene, right: Scene) {
  if (left.routeId !== right.routeId) {
    return left.routeId.localeCompare(right.routeId);
  }

  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.id.localeCompare(right.id);
}

function buildRouteGroups(routes: Route[], scenes: Scene[]) {
  return [...routes]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((route) => ({
      route,
      scenes: scenes
        .filter((scene) => scene.routeId === route.id)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    }));
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
              <button
                type="button"
                onClick={() =>
                  currentProject
                    ? deleteProjectScene(scene.id)
                    : deleteLocalScene(scene.id)
                }
              >
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
              {routeScenes.map((scene, index) => {
                const targetRouteId = moveTargets[scene.id] ?? scene.routeId;
                const canMoveUp = index > 0;
                const canMoveDown = index < routeScenes.length - 1;

                return (
                  <li key={scene.id}>
                    <button
                      type="button"
                      aria-pressed={scene.id === selectedSceneId}
                      onClick={() => onSelectScene(scene.id)}
                    >
                      {scene.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSceneUp(scene.id)}
                      disabled={!canMoveUp}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSceneDown(scene.id)}
                      disabled={!canMoveDown}
                    >
                      下移
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        currentProject
                          ? deleteProjectScene(scene.id)
                          : deleteLocalScene(scene.id)
                      }
                    >
                      删除场景
                    </button>
                    {routes.length > 1 ? (
                      <>
                        <label>
                          移动到路线
                          <select
                            aria-label="移动到路线"
                            value={targetRouteId}
                            onChange={(event) =>
                              setMoveTargets((currentTargets) => ({
                                ...currentTargets,
                                [scene.id]: event.target.value,
                              }))
                            }
                          >
                            {routes.map((candidateRoute) => (
                              <option
                                key={candidateRoute.id}
                                value={candidateRoute.id}
                              >
                                {candidateRoute.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            moveSceneToRoute(scene.id, targetRouteId);
                            setMoveTargets((currentTargets) => ({
                              ...currentTargets,
                              [scene.id]: targetRouteId,
                            }));
                          }}
                        >
                          移动场景
                        </button>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  );
}
