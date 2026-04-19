import {
  type NoteBlockMeta,
  type NoteBlockType,
} from "../store/noteBlock";

interface NoteBlockEditorProps {
  note: NoteBlockMeta;
  onChange: (input: NoteBlockMeta) => void;
}

function getTypeHint(noteType: NoteBlockType) {
  if (noteType === "foreshadow") {
    return "建议填写线索编号，后续用“回收”类型关联。";
  }

  if (noteType === "payoff") {
    return "建议填写要回收的线索编号。";
  }

  return "普通注释不会参与伏笔追踪。";
}

export function NoteBlockEditor({ note, onChange }: NoteBlockEditorProps) {
  return (
    <fieldset>
      <legend>注释设置</legend>
      <label>
        注释类型
        <select
          aria-label="注释类型"
          value={note.noteType}
          onChange={(event) =>
            onChange({
              ...note,
              noteType: event.target.value as NoteBlockType,
            })
          }
        >
          <option value="general">普通注释</option>
          <option value="foreshadow">伏笔</option>
          <option value="payoff">回收点</option>
        </select>
      </label>
      <label>
        线索编号
        <input
          aria-label="线索编号"
          value={note.threadId ?? ""}
          onChange={(event) =>
            onChange({
              ...note,
              threadId: event.target.value,
            })
          }
          placeholder="例如：old-school-key"
        />
      </label>
      <p>{getTypeHint(note.noteType)}</p>
    </fieldset>
  );
}
