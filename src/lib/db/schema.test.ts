import { DATABASE_URL } from "./database";

describe("database config", () => {
  it("使用本地 sqlite 文件作为默认数据库", () => {
    expect(DATABASE_URL).toBe("sqlite:vn-writer-lab.db");
  });
});
