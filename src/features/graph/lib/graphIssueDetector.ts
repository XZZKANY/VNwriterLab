import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import { parseChoiceBlockMeta } from "@/features/editor/store/choiceBlock";
import { parseConditionBlockMeta } from "@/features/editor/store/conditionBlock";
import { parseNoteBlockMeta } from "@/features/editor/store/noteBlock";
import type { SceneGraphIssue, SceneGraphIssueCode } from "./graphData.types";

function createIssue(
  code: SceneGraphIssueCode,
  category: string,
  message: string,
): SceneGraphIssue {
  return { code, category, message };
}

function hasMeaningfulSceneContent(scene: Scene) {
  return scene.blocks.some((block) => {
    if (block.blockType === "dialogue" || block.blockType === "narration") {
      return block.contentText.trim().length > 0;
    }

    if (block.blockType === "choice") {
      return parseChoiceBlockMeta(block.metaJson).label.trim().length > 0;
    }

    return false;
  });
}

/**
 * 扫描所有场景的注释块，对成对的"伏笔/回收"进行匹配，
 * 返回每个场景未被回收的伏笔提示文案。
 */
export function collectUnresolvedForeshadowMessagesByScene(scenes: Scene[]) {
  const foreshadowThreads = new Map<
    string,
    {
      title: string;
      sceneId: string;
    }
  >();
  const payoffThreadIds = new Set<string>();

  scenes.forEach((scene) => {
    scene.blocks.forEach((block) => {
      if (block.blockType !== "note") {
        return;
      }

      const noteMeta = parseNoteBlockMeta(block.metaJson);
      if (!noteMeta.threadId) {
        return;
      }

      if (noteMeta.noteType === "foreshadow") {
        foreshadowThreads.set(noteMeta.threadId, {
          title: block.contentText.trim() || noteMeta.threadId,
          sceneId: scene.id,
        });
        return;
      }

      if (noteMeta.noteType === "payoff") {
        payoffThreadIds.add(noteMeta.threadId);
      }
    });
  });

  const unresolvedMessagesByScene = new Map<string, string[]>();

  for (const [threadId, info] of foreshadowThreads) {
    if (payoffThreadIds.has(threadId)) {
      continue;
    }

    const messages = unresolvedMessagesByScene.get(info.sceneId) ?? [];
    messages.push(`伏笔「${info.title}」尚未找到回收点`);
    unresolvedMessagesByScene.set(info.sceneId, messages);
  }

  return unresolvedMessagesByScene;
}

/**
 * 给定单个场景及其上下文（其他场景、变量、入边/出边数、未回收伏笔列表），
 * 返回该场景上的所有问题列表（空场景、无出口、伏笔未回收、引用了不存在的变量/场景等）。
 */
export function collectSceneIssues(
  scene: Scene,
  sceneById: Map<string, Scene>,
  variablesById: Map<string, ProjectVariable>,
  incomingCount: number,
  outgoingCount: number,
  unresolvedForeshadowMessages: string[],
) {
  const issues: SceneGraphIssue[] = [];

  if (scene.blocks.length === 0) {
    issues.push(
      createIssue("emptyScene", "空场景", "当前场景还没有任何内容块"),
    );
  } else if (!hasMeaningfulSceneContent(scene)) {
    issues.push(
      createIssue(
        "contentGap",
        "内容缺失",
        "当前场景还没有任何有效正文或选项文案",
      ),
    );
  }

  if (!scene.isEndingScene && outgoingCount === 0) {
    issues.push(
      createIssue("noOutgoing", "无出口", "非结局场景且没有任何出边"),
    );
  }

  if (!scene.isStartScene && incomingCount === 0) {
    issues.push(
      createIssue("noIncoming", "无入边", "没有任何入边且不是起始场景"),
    );
  }

  unresolvedForeshadowMessages.forEach((message) => {
    issues.push(createIssue("unresolvedForeshadow", "伏笔未回收", message));
  });

  const sortedBlocks = [...scene.blocks].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  sortedBlocks.forEach((block) => {
    if (block.blockType === "condition") {
      const condition = parseConditionBlockMeta(block.metaJson);
      condition.conditions.forEach((item) => {
        if (!item.variableId) {
          issues.push(
            createIssue(
              "missingConditionVariable",
              "条件异常",
              "条件块未选择变量",
            ),
          );
          return;
        }

        if (!variablesById.has(item.variableId)) {
          issues.push(
            createIssue(
              "deletedConditionVariable",
              "条件异常",
              "条件块引用了已删除变量",
            ),
          );
        }
      });
      return;
    }

    if (block.blockType !== "choice") {
      return;
    }

    const choice = parseChoiceBlockMeta(block.metaJson);
    if (choice.targetSceneId && !sceneById.has(choice.targetSceneId)) {
      issues.push(
        createIssue(
          "missingTargetScene",
          "跳转异常",
          "选项块跳转到不存在的场景",
        ),
      );
    }

    if (
      choice.effectVariableId &&
      !variablesById.has(choice.effectVariableId)
    ) {
      issues.push(
        createIssue(
          "deletedEffectVariable",
          "副作用异常",
          "选项块副作用引用了已删除变量",
        ),
      );
    }
  });

  return issues;
}
