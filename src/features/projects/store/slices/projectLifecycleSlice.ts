import { createEmptyProject, type ProjectTemplate } from "@/lib/domain/project";
import { getProjectRepository } from "@/lib/repositories/projectRepositoryRuntime";
import { getReferenceRepository } from "@/lib/repositories/referenceRepositoryRuntime";
import { getStoryRepository } from "@/lib/repositories/storyRepositoryRuntime";
import { withAutosave } from "@/lib/store/autosave";
import {
  replaceEditorOnProjectCreate,
  replaceEditorOnProjectImport,
} from "../editorSync";
import type {
  ProjectImportInput,
  ProjectLifecycleSlice,
  ProjectSliceCreator,
} from "../projectStore.types";

export const createProjectLifecycleSlice: ProjectSliceCreator<
  ProjectLifecycleSlice
> = (set) => ({
  createProject: withAutosave(
    (name: string, summary: string, template?: ProjectTemplate) => {
      const nextProject = createEmptyProject(name, summary, template);
      set({
        currentProject: nextProject,
      });
      replaceEditorOnProjectCreate(nextProject);

      void getProjectRepository().createProject({
        name,
        summary,
        template,
        project: nextProject,
      });
    },
  ),
  importProject: withAutosave((input: ProjectImportInput) => {
    set({
      currentProject: input.project,
    });
    replaceEditorOnProjectImport({
      scenes: input.scenes,
      links: input.links,
      variables: input.variables,
    });

    // 异步串行落盘：先建项目壳（用 createProject 是因为可能是首次导入），
    // 再把场景/连线/变量分别写回各自的 repository。
    // 任一步失败会被 console 吞掉——本次重构不引入新的错误展示通道。
    void (async () => {
      const projectRepo = getProjectRepository();
      await projectRepo.createProject({
        name: input.project.name,
        summary: input.project.summary,
        project: input.project,
      });

      const storyRepo = getStoryRepository();
      for (const scene of input.scenes) {
        await storyRepo.updateScene(scene);
        await storyRepo.saveBlocks(scene.id, scene.blocks);
      }
      await storyRepo.saveLinks(input.project.id, input.links);

      await getReferenceRepository().saveVariables(
        input.project.id,
        input.variables,
      );
    })();
  }),
  resetProject() {
    set({
      currentProject: null,
    });
  },
});
