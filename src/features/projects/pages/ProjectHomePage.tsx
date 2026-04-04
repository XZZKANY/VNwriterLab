import { ProjectCreateForm } from "../components/ProjectCreateForm";
import { useProjectStore } from "../store/useProjectStore";

export function ProjectHomePage() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const createProject = useProjectStore((state) => state.createProject);

  return (
    <section>
      <h2>项目首页</h2>
      {!currentProject ? (
        <ProjectCreateForm onSubmit={createProject} />
      ) : (
        <div>
          <h3>{currentProject.name}</h3>
          <p>{currentProject.summary}</p>
          <p>默认路线：{currentProject.routes[0]?.name}</p>
        </div>
      )}
    </section>
  );
}
