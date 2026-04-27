import { useState } from "react";
import type { Route } from "@/lib/domain/project";

interface RouteListPanelProps {
  routes: Route[];
  sceneCountByRoute: Map<string, number>;
  onCreateRoute: (name: string) => void;
  onRenameRoute: (routeId: string, name: string) => void;
}

export function RouteListPanel({
  routes,
  sceneCountByRoute,
  onCreateRoute,
  onRenameRoute,
}: RouteListPanelProps) {
  const [newRouteName, setNewRouteName] = useState("");
  const [routeDrafts, setRouteDrafts] = useState<Record<string, string>>({});

  function handleSaveRouteName(routeId: string, draftValue: string) {
    onRenameRoute(routeId, draftValue);
    setRouteDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[routeId];
      return nextDrafts;
    });
  }

  return (
    <>
      <ul aria-label="项目路线列表">
        {routes.map((route) => {
          const draftValue = routeDrafts[route.id] ?? route.name;

          return (
            <li key={route.id}>
              <strong>{route.name}</strong>
              <span> 场景数：{sceneCountByRoute.get(route.id) ?? 0}</span>
              <label>
                路线名称
                <input
                  aria-label="路线名称"
                  value={draftValue}
                  onChange={(event) =>
                    setRouteDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [route.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <button
                type="button"
                onClick={() => handleSaveRouteName(route.id, draftValue)}
              >
                保存路线名称
              </button>
            </li>
          );
        })}
      </ul>
      <label>
        新路线名称
        <input
          aria-label="新路线名称"
          value={newRouteName}
          onChange={(event) => setNewRouteName(event.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          onCreateRoute(newRouteName);
          setNewRouteName("");
        }}
      >
        新增路线
      </button>
    </>
  );
}
