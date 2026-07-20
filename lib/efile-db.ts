import { openDB } from "idb";

export interface EFileRecord {
  id: string;
  name: string;
  folderId: string;
  branchId: string;
  uploadedBy: string;
  uploadedAt: Date;
  type: string;
  size: number;
  file: File;
}

export const dbPromise = openDB("efiling-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("files")) {
      const store = db.createObjectStore("files", {
        keyPath: "id",
      });

      store.createIndex("folderId", "folderId");
      store.createIndex("branchId", "branchId");
    }
  },
});