import type { RouteCard } from "../lib/viewsDashboard";

interface RouteViewProps {
  cards: RouteCard[];
  onOpenScene: (sceneId: string) => void;
}

export function RouteView({ cards, onOpenScene }: RouteViewProps) {
  if (cards.length === 0) {
    return <p>暂无路线。</p>;
  }

  return (
    <>
      <h3>路线视图</h3>
      <ul>
        {cards.map((card) => (
          <li key={card.routeId}>
            <h4>
              {card.routeName}（场景数：{card.sceneCount}）
            </h4>
            {card.scenes.length > 0 ? (
              <ul>
                {card.scenes.map((scene) => (
                  <li key={scene.sceneId}>
                    <button
                      type="button"
                      onClick={() => onOpenScene(scene.sceneId)}
                    >
                      {scene.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>当前路线暂无场景。</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
