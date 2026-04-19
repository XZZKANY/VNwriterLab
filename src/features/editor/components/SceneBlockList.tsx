import { ChoiceBlockEditor } from "./ChoiceBlockEditor";
import { ConditionBlockEditor } from "./ConditionBlockEditor";
import { NoteBlockEditor } from "./NoteBlockEditor";
import type { SceneBlock } from "../../../lib/domain/block";
import type { Scene } from "../../../lib/domain/scene";
import type { ProjectVariable } from "../../../lib/domain/variable";
import { parseChoiceBlockMeta } from "../store/choiceBlock";
import { parseConditionBlockMeta, type ConditionBlockMeta } from "../store/conditionBlock";
import { parseNoteBlockMeta, type NoteBlockMeta } from "../store/noteBlock";

interface SceneBlockListProps {
  sceneId: string;
  blocks: SceneBlock[];
  scenes: Scene[];
  variables: ProjectVariable[];
  onDeleteBlock: (sceneId: string, blockId: string) => void;
  onMoveBlockUp: (sceneId: string, blockId: string) => void;
  onMoveBlockDown: (sceneId: string, blockId: string) => void;
  onUpdateBlockContent: (
    sceneId: string,
    blockId: string,
    contentText: string,
  ) => void;
  onUpdateChoiceBlock: (
    sceneId: string,
    blockId: string,
    input: {
      label: string;
      targetSceneId: string | null;
      effectVariableId: string | null;
      effectValue: number;
    },
  ) => void;
  onUpdateConditionBlock: (
    sceneId: string,
    blockId: string,
    input: ConditionBlockMeta,
  ) => void;
  onUpdateNoteBlock: (
    sceneId: string,
    blockId: string,
    input: NoteBlockMeta,
  ) => void;
}

function getBlockLabel(blockType: SceneBlock["blockType"]) {
  if (blockType === "narration") {
    return "旁白内容";
  }

  if (blockType === "dialogue") {
    return "对白内容";
  }

  if (blockType === "note") {
    return "注释内容";
  }

  return "内容";
}

export function SceneBlockList({
  sceneId,
  blocks,
  scenes,
  variables,
  onDeleteBlock,
  onMoveBlockUp,
  onMoveBlockDown,
  onUpdateBlockContent,
  onUpdateChoiceBlock,
  onUpdateConditionBlock,
  onUpdateNoteBlock,
}: SceneBlockListProps) {
  return (
    <div>
      {blocks.map((block, index) => {
        const isFirstBlock = index === 0;
        const isLastBlock = index === blocks.length - 1;

        const blockControls = (
          <div>
            <button
              type="button"
              onClick={() => onDeleteBlock(sceneId, block.id)}
            >
              删除
            </button>
            <button
              type="button"
              disabled={isFirstBlock}
              onClick={() => onMoveBlockUp(sceneId, block.id)}
            >
              上移
            </button>
            <button
              type="button"
              disabled={isLastBlock}
              onClick={() => onMoveBlockDown(sceneId, block.id)}
            >
              下移
            </button>
          </div>
        );

        if (block.blockType === "choice") {
          const meta = parseChoiceBlockMeta(block.metaJson);

          return (
            <div key={block.id}>
              {blockControls}
              <ChoiceBlockEditor
                label={meta.label}
                targetSceneId={meta.targetSceneId}
                effectVariableId={meta.effectVariableId}
                effectValue={meta.effectValue}
                currentSceneId={sceneId}
                scenes={scenes}
                variables={variables}
                onChange={(input) =>
                  onUpdateChoiceBlock(sceneId, block.id, input)
                }
              />
            </div>
          );
        }

        if (block.blockType === "condition") {
          const meta = parseConditionBlockMeta(block.metaJson);

          return (
            <div key={block.id}>
              {blockControls}
              <ConditionBlockEditor
                condition={meta}
                variables={variables}
                onChange={(input) =>
                  onUpdateConditionBlock(sceneId, block.id, input)
                }
              />
            </div>
          );
        }

        if (block.blockType === "note") {
          const meta = parseNoteBlockMeta(block.metaJson);

          return (
            <div key={block.id}>
              {blockControls}
              <NoteBlockEditor
                note={meta}
                onChange={(input) => onUpdateNoteBlock(sceneId, block.id, input)}
              />
              <label>
                注释内容
                <textarea
                  value={block.contentText}
                  onChange={(event) =>
                    onUpdateBlockContent(sceneId, block.id, event.target.value)
                  }
                />
              </label>
            </div>
          );
        }

        return (
          <div key={block.id}>
            {blockControls}
            <label>
              {getBlockLabel(block.blockType)}
              <textarea
                value={block.contentText}
                onChange={(event) =>
                  onUpdateBlockContent(sceneId, block.id, event.target.value)
                }
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
