import { WorkspacePanel } from "@/app/components/workspace/WorkspacePanel";
import type { Character } from "@/lib/domain/character";
import type { LoreEntry } from "@/lib/domain/lore";
import type { Project, Route } from "@/lib/domain/project";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import type { SceneLink } from "@/features/editor/store/linkUtils";
import { ExportPanel } from "./ExportPanel";
import { ImportPanel } from "./ImportPanel";
import { ProjectStatsPanel } from "./ProjectStatsPanel";
import { RouteListPanel } from "./RouteListPanel";
import { SearchPanel } from "./SearchPanel";
import type { ProjectStats } from "../lib/projectStats";
import type { ProjectImportInput } from "../store/projectStore.types";

interface ProjectWorkbenchSidebarProps {
  project: Project;
  stats: ProjectStats;
  routes: Route[];
  sceneCountByRoute: Map<string, number>;
  availableScenes: Scene[];
  projectLinks: SceneLink[];
  projectVariables: ProjectVariable[];
  editorScenes: Scene[];
  characters: Character[];
  loreEntries: LoreEntry[];
  onCreateRoute: (name: string) => void;
  onRenameRoute: (routeId: string, name: string) => void;
  onImport: (input: ProjectImportInput) => void;
}

export function ProjectWorkbenchSidebar({
  project,
  stats,
  routes,
  sceneCountByRoute,
  availableScenes,
  projectLinks,
  projectVariables,
  editorScenes,
  characters,
  loreEntries,
  onCreateRoute,
  onRenameRoute,
  onImport,
}: ProjectWorkbenchSidebarProps) {
  return (
    <aside className="project-home__sidebar">
      <ProjectStatsPanel stats={stats} />
      <WorkspacePanel title="路线管理" ariaLabel="路线管理">
        <RouteListPanel
          routes={routes}
          sceneCountByRoute={sceneCountByRoute}
          onCreateRoute={onCreateRoute}
          onRenameRoute={onRenameRoute}
        />
      </WorkspacePanel>
      <ExportPanel
        project={project}
        scenes={availableScenes}
        links={projectLinks}
        variables={projectVariables}
      />
      <ImportPanel onImport={onImport} />
      <SearchPanel
        project={project}
        editorScenes={editorScenes}
        characters={characters}
        loreEntries={loreEntries}
      />
    </aside>
  );
}
