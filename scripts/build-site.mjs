import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const script of ["scripts/build-products.mjs", "scripts/build-home.mjs"])
  execFileSync(process.execPath, [script], { cwd: root, stdio: "inherit" });
