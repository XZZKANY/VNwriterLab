import type { SceneBlock } from "@/lib/domain/block";
import type { Scene } from "@/lib/domain/scene";
import type { ProjectVariable } from "@/lib/domain/variable";
import { parseChoiceBlockMeta } from "../store/choiceBlock";
import {
  parseConditionBlockMeta,
  type ConditionBlockMeta,
} from "../store/conditionBlock";
import { parseNoteBlockMeta, type NoteBlockMeta } from "../store/noteBlock";
import { ChoiceBlockEditor } from "./ChoiceBlockEditor";
import { ConditionBlockEditor } from "./ConditionBlockEditor";
import { NoteBlockEditor } from "./NoteBlockEditor";

const BLOCK_LABEL_BY_TYPE: Partial<Record<SceneBlock["blockType"], string>> = {
  narration: "旁白内容",
  dialogue: "对白内容",
  note: "注释内容",
};

function getBlockLabel(blockType: SceneBlock["blockType"]): string {
  return BLOCK_LABEL_BY_TYPE[blockType] ?? "内容";
}

interface SceneBlockListItemProps {
  sceneId: string;
  block: SceneBlock;
  isFirst: boolean;
  isLast: boolean;
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

function BlockControls({
  sceneId,
  blockId,
  isFirst,
  isLast,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  sceneId: string;
  blockId: string;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (sceneId: string, blockId: string) => void;
  onMoveUp: (sceneId: string, blockId: string) => void;
  onMoveDown: (sceneId: string, blockId: string) => void;
}) {
  return (
    <div>
      <button type="button" onClick={() => onDelete(sceneId, blockId)}>
        删除
      </button>
      <button
        type="button"
        disabled={isFirst}
        onClick={() => onMoveUp(sceneId, blockId)}
      >
        上移
      </button>
      <button
        type="button"
        disabled={isLast}
        onClick={() => onMoveDown(sceneId, blockId)}
      >
        下移
      </button>
    </div>
  );
}

export function SceneBlockListItem({
  sceneId,
  block,
  isFirst,
  isLast,
  scenes,
  variables,
  onDeleteBlock,
  onMoveBlockUp,
  onMoveBlockDown,
  onUpdateBlockContent,
  onUpdateChoiceBlock,
  onUpdateConditionBlock,
  onUpdateNoteBlock,
}: SceneBlockListItemProps) {
  const controls = (
    <BlockControls
      sceneId={sceneId}
      blockId={block.id}
      isFirst={isFirst}
      isLast={isLast}
      onDelete={onDeleteBlock}
      onMoveUp={onMoveBlockUp}
      onMoveDown={onMoveBlockDown}
    />
  );

  if (block.blockType === "choice") {
    const meta = parseChoiceBlockMeta(block.metaJson);

    return (
      <div>
        {controls}
        <ChoiceBlockEditor
          label={meta.label}
          targetSceneId={meta.targetSceneId}
          effectVariableId={meta.effectVariableId}
          effectValue={meta.effectValue}
          currentSceneId={sceneId}
          scenes={scenes}
          variables={variables}
          onChange={(input) => onUpdateChoiceBlock(sceneId, block.id, input)}
        />
      </div>
    );
  }

  if (block.blockType === "condition") {
    const meta = parseConditionBlockMeta(block.metaJson);

    return (
      <div>
        {controls}
        <ConditionBlockEditor
          condition={meta}
          variables={variables}
          onChange={(input) => onUpdateConditionBlock(sceneId, block.id, input)}
        />
      </div>
    );
  }

  if (block.blockType === "note") {
    const meta = parseNoteBlockMeta(block.metaJson);

    return (
      <div>
        {controls}
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
    <div>
      {controls}
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
}
