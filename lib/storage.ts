// 직접 입력한 데이터(행사·단가표) 저장소.
// Vercel Blob(BLOB_READ_WRITE_TOKEN)이 연결되어 있으면 비공개 Blob 에, 내 컴퓨터에서 실행할 때는 .data 폴더에 저장한다.
import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";

export type StorageKind = "blob" | "file" | "none";

export function storageKind(): StorageKind {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (!process.env.VERCEL) return "file";
  return "none";
}

const DIR = path.join(process.cwd(), ".data");

export async function readJson<T>(key: string): Promise<T | null> {
  const kind = storageKind();
  if (kind === "blob") {
    const res = await get(`data/${key}.json`, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  }
  if (kind === "file") {
    try {
      return JSON.parse(await fs.readFile(path.join(DIR, `${key}.json`), "utf8")) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  const kind = storageKind();
  const body = JSON.stringify(value, null, 2);
  if (kind === "blob") {
    await put(`data/${key}.json`, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }
  if (kind === "file") {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, `${key}.json`), body);
    return;
  }
  throw new Error("저장소가 연결되지 않았습니다. Vercel 프로젝트에 Blob 저장소를 연결하세요.");
}
