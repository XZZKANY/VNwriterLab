export function ChoiceBlockEditor() {
  return (
    <fieldset>
      <legend>选项块</legend>
      <label>
        选项文案
        <input aria-label="选项文案" />
      </label>
      <label>
        跳转场景
        <input aria-label="跳转场景" />
      </label>
    </fieldset>
  );
}
