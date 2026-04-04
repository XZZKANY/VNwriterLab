export function ConditionBlockEditor() {
  return (
    <fieldset>
      <legend>条件块</legend>
      <label>
        条件变量
        <input aria-label="条件变量" />
      </label>
      <label>
        比较值
        <input aria-label="比较值" type="number" />
      </label>
    </fieldset>
  );
}
