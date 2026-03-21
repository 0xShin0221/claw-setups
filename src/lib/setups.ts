import fs from "fs";
import path from "path";
import { Setup } from "./types";

const SETUPS_DIR = path.join(process.cwd(), "data", "setups");

export function getAllSetups(): Setup[] {
  const files = fs.readdirSync(SETUPS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(SETUPS_DIR, file), "utf-8");
    return JSON.parse(raw) as Setup;
  });
}

export function getSetupBySlug(slug: string): Setup | null {
  const filePath = path.join(SETUPS_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Setup;
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(SETUPS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}
