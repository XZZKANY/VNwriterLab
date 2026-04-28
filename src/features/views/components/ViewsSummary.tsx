import type { ViewsDashboard } from "../lib/viewsDashboard";

interface ViewsSummaryProps {
  view: "outline" | "status" | "route";
  dashboard: ViewsDashboard;
}

export function ViewsSummary({ view, dashboard }: ViewsSummaryProps) {
  if (view === "outline") {
    const totalScenes = dashboard.outlineSections.reduce(
      (acc, section) => acc + section.scenes.length,
      0,
    );
    return (
      <ul>
        <li>路线数：{dashboard.outlineSections.length}</li>
        <li>场景总数：{totalScenes}</li>
      </ul>
    );
  }

  if (view === "status") {
    return (
      <ul>
        {dashboard.statusCards.map((card) => (
          <li key={card.status}>
            {card.label}：{card.scenes.length}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul>
      {dashboard.routeCards.map((card) => (
        <li key={card.routeId}>
          {card.routeName}：{card.sceneCount}
        </li>
      ))}
    </ul>
  );
}
