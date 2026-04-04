import { GraphFilters } from "../components/GraphFilters";
import { SceneGraphCanvas } from "../components/SceneGraphCanvas";

export function GraphPage() {
  return (
    <section>
      <h2>分支图</h2>
      <div
        style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}
      >
        <GraphFilters />
        <SceneGraphCanvas />
      </div>
    </section>
  );
}
