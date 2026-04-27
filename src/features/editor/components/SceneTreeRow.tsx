import type { Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";

interface SceneTreeRowProps {
  scene: Scene;
  isSelected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  routes: Route[];
  targetRouteId: string;
  onSelectScene: (sceneId: string) => void;
  onMoveSceneUp: (sceneId: string) => void;
  onMoveSceneDown: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onMoveTargetChange: (sceneId: string, targetRouteId: string) => void;
  onMoveToRoute: (sceneId: string, targetRouteId: string) => void;
}

export function SceneTreeRow({
  scene,
  isSelected,
  canMoveUp,
  canMoveDown,
  routes,
  targetRouteId,
  onSelectScene,
  onMoveSceneUp,
  onMoveSceneDown,
  onDeleteScene,
  onMoveTargetChange,
  onMoveToRoute,
}: SceneTreeRowProps) {
  const showRouteMover = routes.length > 1;

  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelectScene(scene.id)}
      >
        {scene.title}
      </button>
      <button
        type="button"
        onClick={() => onMoveSceneUp(scene.id)}
        disabled={!canMoveUp}
      >
        上移
      </button>
      <button
        type="button"
        onClick={() => onMoveSceneDown(scene.id)}
        disabled={!canMoveDown}
      >
        下移
      </button>
      <button type="button" onClick={() => onDeleteScene(scene.id)}>
        删除场景
      </button>
      {showRouteMover ? (
        <>
          <label>
            移动到路线
            <select
              aria-label="移动到路线"
              value={targetRouteId}
              onChange={(event) =>
                onMoveTargetChange(scene.id, event.target.value)
              }
            >
              {routes.map((candidateRoute) => (
                <option key={candidateRoute.id} value={candidateRoute.id}>
                  {candidateRoute.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => onMoveToRoute(scene.id, targetRouteId)}
          >
            移动场景
          </button>
        </>
      ) : null}
    </li>
  );
}
