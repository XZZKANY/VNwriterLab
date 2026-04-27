import type { ProjectStats } from "../lib/projectStats";

interface ProjectStatsPanelProps {
  stats: ProjectStats;
}

export function ProjectStatsPanel({ stats }: ProjectStatsPanelProps) {
  return (
    <section aria-label="项目统计">
      <h4>项目统计</h4>
      <ul>
        <li>路线数：{stats.routeCount}</li>
        <li>场景总数：{stats.sceneCount}</li>
        <li>结局场景数：{stats.endingSceneCount}</li>
        <li>变量数：{stats.variableCount}</li>
        <li>角色数：{stats.characterCount}</li>
        <li>设定数：{stats.loreCount}</li>
        <li>问题场景数：{stats.issueSceneCount}</li>
      </ul>
    </section>
  );
}
