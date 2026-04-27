import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectVariable } from "@/lib/domain/variable";
import { useAutoSaveStore } from "@/lib/store/useAutoSaveStore";
import {
  resetReferenceRepositoryForTesting,
  setReferenceRepositoryForTesting,
} from "@/lib/repositories/referenceRepositoryRuntime";
import { useEditorStore } from "./useEditorStore";

function createVariable(
  overrides: Partial<ProjectVariable> = {},
): ProjectVariable {
  return {
    id: "v1",
    projectId: "p1",
    name: "拥有钥匙",
    variableType: "flag",
    defaultValue: 1,
    ...overrides,
  };
}

function createFakeReferenceRepository(
  initialVariables: ProjectVariable[] = [],
) {
  const variables = new Map(
    initialVariables.map((variable) => [variable.id, variable]),
  );
  const listVariables = vi.fn(async (projectId: string) =>
    [...variables.values()].filter(
      (variable) => variable.projectId === projectId,
    ),
  );
  const saveVariables = vi.fn(
    async (projectId: string, nextVariables: ProjectVariable[]) => {
      for (const variable of [...variables.values()]) {
        if (variable.projectId === projectId) {
          variables.delete(variable.id);
        }
      }

      for (const variable of nextVariables) {
        variables.set(variable.id, variable);
      }
    },
  );

  return {
    repository: {
      listCharacters: vi.fn(async () => []),
      saveCharacter: vi.fn(async () => undefined),
      listLoreEntries: vi.fn(async () => []),
      saveLoreEntry: vi.fn(async () => undefined),
      listVariables,
      saveVariable: vi.fn(async () => undefined),
      saveVariables,
    },
    listVariables,
    saveVariables,
  };
}

describe("useEditorStore variables repository", () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorStore.getState().resetEditor();
    useAutoSaveStore.getState().reset();
    resetReferenceRepositoryForTesting();
  });

  it("hydrateVariables 会从 repository 恢复变量并同步选中项", async () => {
    const fake = createFakeReferenceRepository([createVariable()]);
    setReferenceRepositoryForTesting(fake.repository);

    await useEditorStore.getState().hydrateVariables("p1");

    expect(fake.listVariables).toHaveBeenCalledWith("p1");
    expect(useEditorStore.getState().variables[0]?.name).toBe("拥有钥匙");
    expect(useEditorStore.getState().selectedVariableId).toBe("v1");
    expect(useAutoSaveStore.getState().hasRestoredDraft).toBe(true);
  });

  it("create/update/deleteVariable 会保存当前项目变量快照", () => {
    const fake = createFakeReferenceRepository();
    setReferenceRepositoryForTesting(fake.repository);

    const variable = useEditorStore.getState().createVariable("p1");
    expect(variable).not.toBeNull();

    useEditorStore.getState().updateVariable(variable!.id, {
      name: "拥有钥匙",
      variableType: "number",
      defaultValue: 3,
    });
    useEditorStore.getState().deleteVariable(variable!.id);

    expect(fake.saveVariables).toHaveBeenCalled();
    expect(fake.saveVariables).toHaveBeenLastCalledWith("p1", []);
  });
});
