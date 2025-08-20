import express from "express";
import multer from "multer";
import {
  handleConversion,
  handleDownload,
  handleDownloadAll,
} from "./controller.js";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

const __UPLOAD_DIR = path.join(__dirname, "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueID = uuidv4();
    cb(null, `${uniqueID}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB Limit
});

router.use((req, res, next) => {
  console.log("Request method: ", req.method);
  next();
});

router.post("/convert", upload.array("files"), async (req, res) => {
  const conversionResults = await handleConversion(
    req.files,
    req.body.convertTo
  );
  console.log(conversionResults);
  res.json(conversionResults);
});

router.get("/download/:filename", handleDownload);

router.post("/downloadAll", handleDownloadAll);

export default router;
