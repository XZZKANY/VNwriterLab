# V2 Step 3：characters / lore store repository 驱动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `useCharacterStore` 与 `useLoreStore` 从 `persist + localStorage` 主恢复链迁移为 repository 驱动，并完成页面恢复链与本地验证收口。

**Architecture:** 延续上一轮 `useProjectStore` 的做法：新增 `referenceRepositoryRuntime`，让 store 通过 runtime provider 获取 repository，显式执行 hydrate/save；页面只在当前项目存在且本地状态为空时触发 hydrate。整轮仍保持 repository 负责持久化，store 负责 UI 状态编排，页面不拼接 SQL 或持久化协议。

**Tech Stack:** React 19、TypeScript、Zustand、Vitest、Testing Library、Tauri SQL plugin

---

### Task 1: 建立 reference repository runtime 边界

**Files:**
- Create: `src/lib/repositories/referenceRepositoryRuntime.ts`
- Modify: `src/lib/repositories/referenceRepository.ts`
- Reference: `src/lib/repositories/sqliteReferenceRepository.ts`
- Reference: `src/lib/repositories/projectRepositoryRuntime.ts`

- [ ] **Step 1: 为 runtime provider 写失败测试或最小编译入口检查**

在后续 store 测试里会直接 import：

```ts
import {
  getReferenceRepository,
  resetReferenceRepositoryForTesting,
  setReferenceRepositoryForTesting,
} from "../../../lib/repositories/referenceRepositoryRuntime";
```

- [ ] **Step 2: 运行相关测试，确认当前缺少 runtime provider**

Run: `npm.cmd test -- src/features/characters/pages/CharactersPage.test.tsx src/features/lore/pages/LorePage.test.tsx`
Expected: 若测试先改到引用 runtime provider，应出现模块缺失或导出缺失失败

- [ ] **Step 3: 实现最小 runtime provider**

```ts
import type { Character } from "../domain/character";
import type { LoreEntry } from "../domain/lore";
import type { VariableDefinition } from "../domain/variable";
import type { ReferenceRepository } from "./referenceRepository";
import { createSqliteReferenceRepository } from "./sqliteReferenceRepository";

function createVolatileReferenceRepository(): ReferenceRepository {
  let characters: Character[] = [];
  let loreEntries: LoreEntry[] = [];
  let variables: VariableDefinition[] = [];

  return {
    async listCharacters(projectId) {
      return characters.filter((character) => character.projectId === projectId);
    },
    async saveCharacters(projectId, nextCharacters) {
      characters = [
        ...characters.filter((character) => character.projectId !== projectId),
        ...nextCharacters,
      ];
    },
    async listLoreEntries(projectId) {
      return loreEntries.filter((entry) => entry.projectId === projectId);
    },
    async saveLoreEntries(projectId, nextEntries) {
      loreEntries = [
        ...loreEntries.filter((entry) => entry.projectId !== projectId),
        ...nextEntries,
      ];
    },
    async listVariables(projectId) {
      return variables.filter((variable) => variable.projectId === projectId);
    },
    async saveVariables(projectId, nextVariables) {
      variables = [
        ...variables.filter((variable) => variable.projectId !== projectId),
        ...nextVariables,
      ];
    },
  };
}
```

- [ ] **Step 4: 补齐 provider 控制函数**

```ts
let referenceRepositoryOverride: ReferenceRepository | null = null;
let referenceRepositorySingleton: ReferenceRepository | null = null;

export function getReferenceRepository() {
  if (referenceRepositoryOverride) {
    return referenceRepositoryOverride;
  }

  if (!referenceRepositorySingleton) {
    referenceRepositorySingleton =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
        ? createSqliteReferenceRepository()
        : createVolatileReferenceRepository();
  }

  return referenceRepositorySingleton;
}

export function setReferenceRepositoryForTesting(repository: ReferenceRepository) {
  referenceRepositoryOverride = repository;
}

export function resetReferenceRepositoryForTesting() {
  referenceRepositoryOverride = null;
  referenceRepositorySingleton = null;
}
```
- [ ] **Step 5: 运行最小定向验证**

Run: `npm.cmd test -- src/features/characters/pages/CharactersPage.test.tsx src/features/lore/pages/LorePage.test.tsx`
Expected: 进入 store / 页面行为断言阶段，不再因缺少 runtime provider 失败

- [ ] **Step 6: Commit**

```bash
git add src/lib/repositories/referenceRepositoryRuntime.ts src/lib/repositories/referenceRepository.ts docs/superpowers/plans/2026-04-11-v2-reference-store-repository-drive.md
git commit -m "新增 reference repository runtime"
```

### Task 2: 先用测试锁定 character / lore repository 驱动行为

**Files:**
- Create: `src/features/characters/store/useCharacterStore.repository.test.ts`
- Create: `src/features/lore/store/useLoreStore.repository.test.ts`
- Modify: `src/features/characters/pages/CharactersPage.test.tsx`
- Modify: `src/features/lore/pages/LorePage.test.tsx`
- Reference: `src/features/projects/store/useProjectStore.repository.test.ts`

- [ ] **Step 1: 为 character store 写 hydrate/save 失败测试**

```ts
it("hydrateCharacters 会从 repository 恢复角色并保留当前选中项", async () => {
  const fake = createFakeReferenceRepository({
    characters: [
      {
        id: "c1",
        projectId: "p1",
        name: "林夏",
        identity: "学生会长",
        appearance: "",
        personality: "",
        goal: "",
        secret: "",
        routeId: null,
        notes: "",
      },
    ],
  });
  setReferenceRepositoryForTesting(fake.repository);

  await useCharacterStore.getState().hydrateCharacters("p1");

  expect(fake.listCharacters).toHaveBeenCalledWith("p1");
  expect(useCharacterStore.getState().characters[0]?.name).toBe("林夏");
  expect(useCharacterStore.getState().selectedCharacterId).toBe("c1");
});
```

- [ ] **Step 2: 为 lore store 写 hydrate/save 失败测试**

```ts
it("hydrateLoreEntries 会从 repository 恢复设定并同步当前选中项", async () => {
  const fake = createFakeReferenceRepository({
    loreEntries: [
      {
        id: "l1",
        projectId: "p1",
        name: "旧校舍",
        category: "location",
        description: "深夜会传来脚步声。",
        tags: [],
      },
    ],
  });
  setReferenceRepositoryForTesting(fake.repository);

  await useLoreStore.getState().hydrateLoreEntries("p1");

  expect(fake.listLoreEntries).toHaveBeenCalledWith("p1");
  expect(useLoreStore.getState().entries[0]?.name).toBe("旧校舍");
  expect(useLoreStore.getState().selectedLoreId).toBe("l1");
});
```

- [ ] **Step 3: 在页面测试里补显式 hydrate 恢复用例**

Characters 页面示例：

```ts
it("当前项目已恢复时会自动 hydrate 角色列表", async () => {
  const fake = createFakeReferenceRepository({
    characters: [expect.objectContaining({ name: "林夏", projectId: "p1" })],
  });
  setReferenceRepositoryForTesting(fake.repository);
  useProjectStore.setState({
    currentProject: expect.objectContaining({ id: "p1" }),
  });

  render(<CharactersPage />);

  expect(await screen.findByRole("button", { name: "林夏" })).toBeInTheDocument();
});
```

Lore 页面示例同理，断言 `旧校舍`。

- [ ] **Step 4: 运行测试确认 red**

Run: `npm.cmd test -- src/features/characters/store/useCharacterStore.repository.test.ts src/features/lore/store/useLoreStore.repository.test.ts src/features/characters/pages/CharactersPage.test.tsx src/features/lore/pages/LorePage.test.tsx`
Expected: 至少 1 个测试因 `hydrateCharacters` / `hydrateLoreEntries` 或 repository save 未实现而失败

- [ ] **Step 5: Commit**

```bash
git add src/features/characters/store/useCharacterStore.repository.test.ts src/features/lore/store/useLoreStore.repository.test.ts src/features/characters/pages/CharactersPage.test.tsx src/features/lore/pages/LorePage.test.tsx
git commit -m "为 reference store repository 驱动补失败测试"
```
### Task 3: 实现 useCharacterStore 的 repository hydrate/save 契约

**Files:**
- Modify: `src/features/characters/store/useCharacterStore.ts`
- Reference: `src/lib/domain/character.ts`
- Reference: `src/lib/repositories/referenceRepositoryRuntime.ts`
- Test: `src/features/characters/store/useCharacterStore.repository.test.ts`

- [ ] **Step 1: 移除 character store 对 persist 的主恢复责任，补 hydrate action 签名**

```ts
interface CharacterState {
  characters: Character[];
  selectedCharacterId: string | null;
  hydrateCharacters: (projectId: string) => Promise<void>;
  createCharacter: (projectId: string) => Character | null;
  selectCharacter: (characterId: string) => void;
  updateCharacter: (characterId: string, input: Partial<...>) => void;
  resetCharacters: () => void;
}
```

- [ ] **Step 2: 实现 hydrateCharacters 最小逻辑**

```ts
async hydrateCharacters(projectId) {
  const trimmedProjectId = projectId.trim();
  if (!trimmedProjectId) {
    useAutoSaveStore.getState().markHydrated(false);
    return;
  }

  const characters = await getReferenceRepository().listCharacters(trimmedProjectId);
  set({
    characters,
    selectedCharacterId: characters[0]?.id ?? null,
  });
  useAutoSaveStore.getState().markHydrated(characters.length > 0);
}
```

- [ ] **Step 3: createCharacter 改为更新内存后保存 repository**

```ts
const nextCharacter = createEmptyCharacter({ ... });
const nextCharacters = [...get().characters, nextCharacter];
set({
  characters: nextCharacters,
  selectedCharacterId: nextCharacter.id,
});
void getReferenceRepository().saveCharacters(trimmedProjectId, nextCharacters);
```

- [ ] **Step 4: updateCharacter 改为更新内存后保存 repository**

```ts
const nextCharacters = get().characters.map((character) =>
  character.id === characterId ? { ...character, ...input } : character,
);
set({ characters: nextCharacters });
void getReferenceRepository().saveCharacters(targetCharacter.projectId, nextCharacters);
```

- [ ] **Step 5: 运行 character store 定向测试**

Run: `npm.cmd test -- src/features/characters/store/useCharacterStore.repository.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/characters/store/useCharacterStore.ts src/features/characters/store/useCharacterStore.repository.test.ts
git commit -m "实现 character store repository 驱动"
```

### Task 4: 实现 useLoreStore 的 repository hydrate/save 契约

**Files:**
- Modify: `src/features/lore/store/useLoreStore.ts`
- Reference: `src/lib/domain/lore.ts`
- Reference: `src/lib/repositories/referenceRepositoryRuntime.ts`
- Test: `src/features/lore/store/useLoreStore.repository.test.ts`

- [ ] **Step 1: 移除 lore store 对 persist 的主恢复责任，补 hydrate action 签名**

```ts
interface LoreState {
  entries: LoreEntry[];
  selectedLoreId: string | null;
  hydrateLoreEntries: (projectId: string) => Promise<void>;
  createLoreEntry: (projectId: string) => LoreEntry | null;
  selectLoreEntry: (entryId: string) => void;
  updateLoreEntry: (entryId: string, input: Partial<...>) => void;
  resetLoreEntries: () => void;
}
```

- [ ] **Step 2: 实现 hydrateLoreEntries 最小逻辑**

```ts
async hydrateLoreEntries(projectId) {
  const trimmedProjectId = projectId.trim();
  if (!trimmedProjectId) {
    useAutoSaveStore.getState().markHydrated(false);
    return;
  }

  const entries = await getReferenceRepository().listLoreEntries(trimmedProjectId);
  set({
    entries,
    selectedLoreId: entries[0]?.id ?? null,
  });
  useAutoSaveStore.getState().markHydrated(entries.length > 0);
}
```

- [ ] **Step 3: createLoreEntry / updateLoreEntry 改为 repository 保存**

对称于 character store：

```ts
void getReferenceRepository().saveLoreEntries(trimmedProjectId, nextEntries);
```

- [ ] **Step 4: 运行 lore store 定向测试**

Run: `npm.cmd test -- src/features/lore/store/useLoreStore.repository.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/lore/store/useLoreStore.ts src/features/lore/store/useLoreStore.repository.test.ts
git commit -m "实现 lore store repository 驱动"
```
### Task 5: 页面显式 hydrate 与回归测试收口

**Files:**
- Modify: `src/features/characters/pages/CharactersPage.tsx`
- Modify: `src/features/lore/pages/LorePage.tsx`
- Modify: `src/features/characters/pages/CharactersPage.test.tsx`
- Modify: `src/features/lore/pages/LorePage.test.tsx`
- Modify: `src/lib/store/persistence.test.ts`

- [ ] **Step 1: 在 CharactersPage 中补显式 hydrate effect**

```ts
const currentProject = useProjectStore((state) => state.currentProject);
const characters = useCharacterStore((state) => state.characters);
const hydrateCharacters = useCharacterStore((state) => state.hydrateCharacters);

useEffect(() => {
  if (currentProject && characters.length === 0) {
    void hydrateCharacters(currentProject.id);
  }
}, [currentProject, characters.length, hydrateCharacters]);
```

- [ ] **Step 2: 在 LorePage 中补对称 hydrate effect**

```ts
const currentProject = useProjectStore((state) => state.currentProject);
const entries = useLoreStore((state) => state.entries);
const hydrateLoreEntries = useLoreStore((state) => state.hydrateLoreEntries);

useEffect(() => {
  if (currentProject && entries.length === 0) {
    void hydrateLoreEntries(currentProject.id);
  }
}, [currentProject, entries.length, hydrateLoreEntries]);
```

- [ ] **Step 3: persistence.test.ts 调整为 repository 恢复断言**

示例方向：

```ts
const fake = createFakeReferenceRepository({
  characters: [...],
  loreEntries: [...],
});
setReferenceRepositoryForTesting(fake.repository);
await reloadedProjectStore.getState().hydrateLatestProject();
render(<ReloadedCharactersPage />);
expect(await screen.findByRole("button", { name: "林夏" })).toBeInTheDocument();
```

- [ ] **Step 4: 运行相关回归测试**

Run: `npm.cmd test -- src/features/characters/pages/CharactersPage.test.tsx src/features/lore/pages/LorePage.test.tsx src/lib/store/persistence.test.ts`
Expected: PASS

- [ ] **Step 5: 运行整轮收口验证**

Run: `npm.cmd test -- src/features/characters/store/useCharacterStore.repository.test.ts src/features/lore/store/useLoreStore.repository.test.ts src/features/characters/pages/CharactersPage.test.tsx src/features/lore/pages/LorePage.test.tsx src/lib/store/persistence.test.ts`
Expected: PASS

- [ ] **Step 6: 运行全量测试与构建**

Run: `npm.cmd test`
Expected: PASS

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 7: 更新日志与验证报告**

把以下内容写入：
- `.codex/operations-log.md`
- `.codex/verification-report.md`

要求记录：
- 本轮 repository runtime / character store / lore store / 页面 hydrate 的关键设计
- 定向测试、全量测试、构建结果
- 综合评分与是否通过

- [ ] **Step 8: Commit**

```bash
git add src/features/characters/pages/CharactersPage.tsx src/features/lore/pages/LorePage.tsx src/features/characters/pages/CharactersPage.test.tsx src/features/lore/pages/LorePage.test.tsx src/lib/store/persistence.test.ts .codex/operations-log.md .codex/verification-report.md
git commit -m "完成 reference store repository 驱动"
```
