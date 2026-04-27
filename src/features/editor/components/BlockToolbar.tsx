import type { SceneBlock } from "@/lib/domain/block";

interface BlockToolbarProps {
  onAddBlock: (blockType: SceneBlock["blockType"]) => void;
}

const BLOCK_TYPE_BUTTONS: Array<{
  blockType: SceneBlock["blockType"];
  label: string;
}> = [
  { blockType: "narration", label: "新增旁白" },
  { blockType: "dialogue", label: "新增对白" },
  { blockType: "note", label: "新增注释" },
  { blockType: "choice", label: "新增选项" },
  { blockType: "condition", label: "新增条件" },
];

export function BlockToolbar({ onAddBlock }: BlockToolbarProps) {
  return (
    <>
      {BLOCK_TYPE_BUTTONS.map(({ blockType, label }) => (
        <button
          key={blockType}
          type="button"
          onClick={() => onAddBlock(blockType)}
        >
          {label}
        </button>
      ))}
    </>
  );
}
