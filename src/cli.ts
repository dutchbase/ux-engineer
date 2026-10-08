import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { validateArtifact, type Kind } from "./contracts/validate.ts";

const usage = "usage: node src/cli.ts validate <project|checks> <file>";

export type CliResult = { status: 0 | 1 | 2; output: string[]; errors: string[] };

export function runCli(args: string[]): CliResult {
  const [command, kindArg, file] = args;
  if (args.length !== 3 || command !== "validate" || (kindArg !== "project" && kindArg !== "checks") || !file) {
    return {status: 2, output: [], errors: [usage]};
  }

  try {
    const input = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const result = validateArtifact(kindArg as Kind, input);
    if (result.ok) {
      return {status: 0, output: ["valid"], errors: []};
    }
    return {status: 1, output: result.errors.map((error) => `${error.path}: ${error.message}`), errors: []};
  } catch (error) {
    return {status: 2, output: [], errors: [usage, error instanceof Error ? error.message : String(error)]};
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const result = runCli(process.argv.slice(2));
  result.output.forEach((line) => console.log(line));
  result.errors.forEach((line) => console.error(line));
  process.exitCode = result.status;
}
