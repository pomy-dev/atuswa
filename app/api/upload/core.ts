import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  efilingUploader: f({
    // Correct MIME types
    "application/pdf": { maxFileSize: "16MB" },
    "image/jpeg": { maxFileSize: "8MB" },
    "image/png": { maxFileSize: "8MB" },
    "image/webp": { maxFileSize: "8MB" },
    "application/msword": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB"
    },
  })
    .middleware(async ({ req }) => {
      // TODO: Add real authentication later
      if (!req) throw new UploadThingError("Unauthorized");
      return { userId: "user_123" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Upload complete:", file.name, file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;