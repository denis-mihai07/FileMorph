import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __UPLOAD_DIR = path.join(__dirname, "uploads");

export const clearUploadsFolder = async () => {
  try {
    await fs.access(__UPLOAD_DIR);

    const files = await fs.readdir(__UPLOAD_DIR);

    if (files.length === 0) {
      console.log("Empty Uploads Folder.");
      return;
    }
    for (const file of files) {
      const filePath = path.join(__UPLOAD_DIR, file);
      await fs.unlink(filePath);
    }
    console.log("Uploads Folder Cleared.");
  } catch (err) {
    console.log("Clearing Uploads Error / Directory not found");
  }
};

clearUploadsFolder();
