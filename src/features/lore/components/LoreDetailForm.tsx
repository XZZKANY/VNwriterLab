import { useState } from "react";
import type { LoreCategory, LoreEntry } from "@/lib/domain/lore";

export type LoreDetailUpdate = Partial<
  Pick<LoreEntry, "name" | "category" | "description" | "tags">
>;

interface LoreDetailFormProps {
  entry: LoreEntry;
  onUpdate: (input: LoreDetailUpdate) => void;
}

/** 把用户输入的逗号/中文逗号分隔字符串归一化为标签数组 */
function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function LoreDetailForm({ entry, onUpdate }: LoreDetailFormProps) {
  // 标签输入需要保留用户正在输入的"半成品"分隔符（如刚输完逗号但还没写下个标签），
  // 所以用本地受控输入。当 entry.id 变化（切到另一条设定）时通过"在渲染期同步更新
  // state"模式把显示同步回 entry.tags——React 推荐的替代 useEffect-setState 反模式。
  const [tagsRaw, setTagsRaw] = useState(entry.tags.join("，"));
  const [trackedEntryId, setTrackedEntryId] = useState(entry.id);
  if (trackedEntryId !== entry.id) {
    setTrackedEntryId(entry.id);
    setTagsRaw(entry.tags.join("，"));
  }

  return (
    <>
      <label>
        名称
        <input
          value={entry.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
        />
      </label>
      <label>
        分类
        <select
          aria-label="分类"
          value={entry.category}
          onChange={(event) =>
            onUpdate({ category: event.target.value as LoreCategory })
          }
        >
          <option value="location">地点</option>
          <option value="term">术语</option>
          <option value="world_rule">世界规则</option>
          <option value="event">事件</option>
        </select>
      </label>
      <label>
        描述
        <textarea
          value={entry.description}
          onChange={(event) => onUpdate({ description: event.target.value })}
        />
      </label>
      <label>
        标签
        <input
          aria-label="标签"
          value={tagsRaw}
          onChange={(event) => {
            setTagsRaw(event.target.value);
            onUpdate({ tags: parseTagsInput(event.target.value) });
          }}
          placeholder="用中英文逗号分隔，例如：地点，回忆，雨夜"
        />
      </label>
    </>
  );
}
