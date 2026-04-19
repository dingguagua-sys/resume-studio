import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

/**
 * 从常见位置加载 .env（避免 cwd 不同导致读不到仓库根目录的 .env）。
 * 优先级：仓库根目录 → server 目录 → 当前工作目录 → 上一级工作目录。
 */
function loadEnv(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../../.env"),
    path.resolve(here, "../.env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return;
    }
  }
  dotenv.config();
}

loadEnv();
