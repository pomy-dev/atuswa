import { dbPromise, EFileRecord } from "@/lib/efile-db";

export async function saveFile(file: EFileRecord) {
  const db = await dbPromise;
  await db.put("files", file);
}

export async function getFiles() {
  const db = await dbPromise;
  return db.getAll("files");
}

export async function getFolderFiles(folderId: any) {
  const db = await dbPromise;
  return db.getAllFromIndex("files", "folderId", folderId);
}

export async function deleteFile(id: string) {
  const db = await dbPromise;
  await db.delete("files", id);
}

export async function clearFiles() {
  const db = await dbPromise;
  await db.clear("files");
}