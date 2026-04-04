export function GraphFilters() {
  return (
    <form>
      <label>
        路线筛选
        <select aria-label="路线筛选">
          <option value="all">全部路线</option>
          <option value="common">共通线</option>
        </select>
      </label>
      <label>
        <input type="checkbox" aria-label="只看问题节点" />
        只看问题节点
      </label>
    </form>
  );
}
