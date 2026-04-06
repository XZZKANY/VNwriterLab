import { useState } from "react";
import type { Scene } from "../../../lib/domain/scene";
import { parseChoiceBlockMeta } from "../../editor/store/choiceBlock";
import { useEditorStore } from "../../editor/store/useEditorStore";
import {
  applyChoiceEffect,
  canEnterScene,
  resolveNextSceneId,
  resolveVisibleBlocks,
} from "../lib/previewEngine";

function resolveStartScene(scenes: Scene[]) {
  return (
    scenes.find((scene) => scene.isStartScene) ??
    [...scenes].sort((left, right) => left.sortOrder - right.sortOrder)[0] ??
    null
  );
}

export function PreviewPage() {
  const scenes = useEditorStore((state) => state.scenes);
  const links = useEditorStore((state) => state.links);
  const variables = useEditorStore((state) => state.variables);
  const selectedSceneId = useEditorStore((state) => state.selectedSceneId);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [runtimeVariables, setRuntimeVariables] = useState(variables);
  const [entryBlockedMessage, setEntryBlockedMessage] = useState<string | null>(
    null,
  );

  const currentScene =
    scenes.find((scene) => scene.id === currentSceneId) ?? null;
  const visibleBlocks = currentScene
    ? resolveVisibleBlocks(currentScene.blocks, runtimeVariables)
    : [];

  function enterScene(
    nextSceneId: string | null,
    nextRuntimeVariables: typeof runtimeVariables,
    fallbackSceneId: string | null,
  ) {
    const nextScene =
      scenes.find((scene) => scene.id === nextSceneId) ?? null;

    if (!nextScene) {
      setEntryBlockedMessage(null);
      setCurrentSceneId(fallbackSceneId);
      return false;
    }

    if (!canEnterScene(nextScene.blocks, nextRuntimeVariables)) {
      setEntryBlockedMessage("该场景当前无法进入，请先满足进入条件。");
      setCurrentSceneId(fallbackSceneId);
      return false;
    }

    setEntryBlockedMessage(null);
    setCurrentSceneId(nextSceneId);
    return true;
  }

  function startFromBeginning() {
    const nextRuntimeVariables = variables;

    setRuntimeVariables(nextRuntimeVariables);
    enterScene(
      resolveStartScene(scenes)?.id ?? null,
      nextRuntimeVariables,
      null,
    );
  }

  function startFromCurrentScene() {
    const nextRuntimeVariables = variables;

    setRuntimeVariables(nextRuntimeVariables);
    enterScene(selectedSceneId, nextRuntimeVariables, null);
  }

  return (
    <section>
      <h2>预览</h2>
      <div>
        <button type="button" onClick={startFromBeginning}>
          从开头预览
        </button>
        <button type="button" onClick={startFromCurrentScene}>
          从当前节点预览
        </button>
      </div>
      <article>
        <h3>{currentScene?.title ?? "当前场景"}</h3>
        {entryBlockedMessage ? <p>{entryBlockedMessage}</p> : null}
        {currentScene ? (
          <div>
            {visibleBlocks.map((block) => {
              if (block.blockType === "choice") {
                const choice = parseChoiceBlockMeta(block.metaJson);

                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => {
                      const nextRuntimeVariables = applyChoiceEffect(
                        runtimeVariables,
                        block.metaJson,
                      );
                      setRuntimeVariables(nextRuntimeVariables);
                      const nextSceneId = resolveNextSceneId(
                        links,
                        currentScene.id,
                        choice.label,
                      );
                      enterScene(
                        nextSceneId,
                        nextRuntimeVariables,
                        currentScene.id,
                      );
                    }}
                  >
                    {choice.label || "未命名选项"}
                  </button>
                );
              }

              if (!block.contentText.trim()) {
                return null;
              }

              return <p key={block.id}>{block.contentText}</p>;
            })}
          </div>
        ) : (
          <p>请选择“从开头预览”或“从当前节点预览”开始体验剧情。</p>
        )}
      </article>
    </section>
  );
}
