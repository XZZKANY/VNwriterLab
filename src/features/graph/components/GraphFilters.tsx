import type { Route } from "../../../lib/domain/project";

interface GraphFiltersProps {
  routes: Route[];
  routeFilter: "all" | "single";
  selectedRouteId: string;
  questionOnly: boolean;
  onRouteFilterChange: (routeFilter: "all" | "single") => void;
  onSelectedRouteIdChange: (routeId: string) => void;
  onQuestionOnlyChange: (questionOnly: boolean) => void;
}

export function GraphFilters({
  routes,
  routeFilter,
  selectedRouteId,
  questionOnly,
  onRouteFilterChange,
  onSelectedRouteIdChange,
  onQuestionOnlyChange,
}: GraphFiltersProps) {
  return (
    <form>
      <label>
        路线筛选
        <select
          aria-label="路线筛选"
          value={routeFilter}
          onChange={(event) =>
            onRouteFilterChange(event.target.value === "single" ? "single" : "all")
          }
        >
          <option value="all">全部路线</option>
          <option value="single">单条路线</option>
        </select>
      </label>
      {routeFilter === "single" ? (
        <label>
          单条路线
          <select
            aria-label="单条路线"
            value={selectedRouteId}
            disabled={routes.length === 0}
            onChange={(event) => onSelectedRouteIdChange(event.target.value)}
          >
            {routes.length > 0 ? (
              routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))
            ) : (
              <option value="">暂无可选路线</option>
            )}
          </select>
        </label>
      ) : null}
      <label>
        <input
          type="checkbox"
          aria-label="只看问题节点"
          checked={questionOnly}
          onChange={(event) => onQuestionOnlyChange(event.target.checked)}
        />
        只看问题节点
      </label>
    </form>
  );
}
