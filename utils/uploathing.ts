// utils/uploadthing.ts
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/upload/core";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();