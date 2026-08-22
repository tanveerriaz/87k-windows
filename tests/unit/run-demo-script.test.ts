import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

async function executable(directory: string, name: string, body: string): Promise<void> {
  const path = join(directory, name);
  await writeFile(path, `#!/usr/bin/env bash\nset -e\n${body}\n`);
  await chmod(path, 0o755);
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("local judging launcher", () => {
  it("warms Gemma, prints the phone URL, builds, and starts the production server", async () => {
    const fakeBin = await mkdtemp(join(tmpdir(), "87k-demo-bin-"));
    temporaryDirectories.push(fakeBin);
    const commandLog = join(fakeBin, "commands.log");
    await executable(fakeBin, "uname", '[[ "${1:-}" == "-s" ]] && echo Darwin || echo arm64');
    await executable(fakeBin, "ollama", '[[ "${1:-}" == "list" ]] && printf "NAME\\ngemma3:4b\\n" || true');
    await executable(fakeBin, "curl", `printf 'curl %s\\n' "$*" >> "${commandLog}"`);
    await executable(fakeBin, "npm", `printf 'npm %s\\n' "$*" >> "${commandLog}"`);

    const result = spawnSync("bash", ["scripts/run-demo.sh", "local"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
        ROOM_HOST: "192.168.2.1",
        DEMO_PORT: "3000",
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("LOCAL GEMMA PRIMARY");
    expect(result.stdout).toContain("http://192.168.2.1:3000/join/demo87");
    const log = await readFile(commandLog, "utf8");
    expect(log).toContain("curl");
    expect(log).toContain("/api/generate");
    expect(log).toContain("npm run build");
    expect(log).toContain("npm start");
    expect(log).not.toContain("npm run dev");
  });
});
