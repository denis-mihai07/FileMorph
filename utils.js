import fs from "fs/promises";
import { clearUploadsFolder } from "./clear_uploads.js";
import { config } from "dotenv";
config();

const sessionTimeoutDuration = process.env.SERVER_TIMEOUT_DURATION;

export const imageExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "svg",
];

export const audioExtensions = [
  "mp3",
  "wav",
  "ogg",
  "aac", // err
  "wma", // err
  "flac",
  "m4a", // err
  "aiff",
];
export const videoExtensions = [
  "mp4",
  "m4v",
  "3gp", // er
  "3g2", // er
  "avi",
  "mov",
  "wmv", // err
  "mkv", // err
  "flv",
  "ogv",
  "webm",
  "av1", // err
];

export const clearUploadsAfterDelay = () => {
  const delay = sessionTimeoutDuration * 60 * 1000;

  setTimeout(async () => {
    clearUploadsFolder();
  }, delay);
};
