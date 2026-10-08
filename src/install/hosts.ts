import { existsSync } from "node:fs";
import { join } from "node:path";

export type Host = "claude-code" | "codex" | "opencode";
export type Scope = "project" | "global";

export function detectHosts(env: { home: string; cwd: string }): Host[] {
  const found = (...paths: string[]) => paths.some((path) => existsSync(path));
  const hosts: Host[] = [];
  if (found(join(env.home, ".claude"), join(env.cwd, ".claude"))) hosts.push("claude-code");
  if (found(join(env.home, ".codex"), join(env.cwd, ".agents"))) hosts.push("codex");
  if (found(join(env.home, ".config/opencode"), join(env.cwd, ".opencode"))) hosts.push("opencode");
  return hosts;
}

export function targetDirs(hosts: Host[], scope: Scope, env: { home: string; cwd: string }): string[] {
  const base = scope === "project" ? env.cwd : env.home;
  const dirs = hosts.map((host) => join(base, host === "claude-code" ? ".claude/skills" : ".agents/skills"));
  return [...new Set(dirs)].sort();
}
