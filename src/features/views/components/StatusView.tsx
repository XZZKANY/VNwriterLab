import type { StatusCard } from "../lib/viewsDashboard";

interface StatusViewProps {
  cards: StatusCard[];
  onOpenScene: (sceneId: string) => void;
}

export function StatusView({ cards, onOpenScene }: StatusViewProps) {
  return (
    <>
      <h3>状态视图</h3>
      <ul>
        {cards.map((card) => (
          <li key={card.status}>
            <h4>
              {card.label}（{card.scenes.length}）
            </h4>
            {card.scenes.length > 0 ? (
              <ul>
                {card.scenes.map((scene) => (
                  <li key={scene.sceneId}>
                    <button
                      type="button"
                      onClick={() => onOpenScene(scene.sceneId)}
                    >
                      {scene.title}（{scene.routeName}）
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>暂无该状态的场景。</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
