import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import {
  imageExtensions,
  audioExtensions,
  videoExtensions,
  clearUploadsAfterDelay,
} from "./utils.js";
import archiver from "archiver";
import { config } from "dotenv";
config();

ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __UPLOAD_DIR = path.join(__dirname, "uploads");

export const handleConversion = async (files, convertTo) => {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const format = Array.isArray(convertTo) ? convertTo[i] : convertTo;

    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .substring(1);

    const outputFilename = `${path.parse(file.path).name}.${format}`;
    const outputFilePath = path.join(__UPLOAD_DIR, outputFilename);

    try {
      if (imageExtensions.includes(fileExtension)) {
        try {
          await sharp(file.path).toFormat(format).toFile(outputFilePath);
        } catch (err) {
          res.status(500).send("Error at Sharp Conversion");
        } finally {
          clearUploadsAfterDelay();
        }

        results.push({
          filename: file.originalname,
          status: "success",
          downloadLink: `/api/download/${outputFilename}`,
        });

        await fs.unlink(file.path);
      } else if (
        audioExtensions.includes(fileExtension) ||
        videoExtensions.includes(fileExtension)
      ) {
        try {
          let converter = ffmpeg(file.path);

          switch (format) {
            case "aac":
            case "m4a":
              converter.audioCodec("libfaac");
              break;
            case "wma":
              converter.audioCodec("wma");
              break;
            case "3gp":
            case "3g2":
              converter.videoCodec("libx264").audioCodec("aac");
              break;
            case "wmv":
              converter.videoCodec("wmv2");
              break;
            case "mkv":
              converter.videoCodec("libx264").audioCodec("aac");
              break;
            case "av1":
              converter.videoCodec("libaom-av1");
              break;
            default:
              break;
          }
          await new Promise((resolve, reject) => {
            converter
              .toFormat(format)
              .on("error", (err) => {
                console.error("FFmpeg conversion error:", err);
                reject(new Error("FFmpeg conversion failed."));
              })
              .on("end", () => {
                console.log("FFmpeg conversion finished.");
                resolve();
              })
              .save(outputFilePath);
          });
        } catch (error) {
          console.log("Error at FFmpeg Conversion");
          await fs.unlink(file.path);
          res.status(500).send("Error at FFmpeg Conversion");
        } finally {
          clearUploadsAfterDelay();
        }
        results.push({
          filename: file.originalname,
          status: "success",
          downloadLink: `/api/download/${outputFilename}`,
        });
        await fs.unlink(file.path);
      } else {
        results.push({
          filename: file.originalname,
          status: "error",
          downloadLink: null,
        });
        await fs.unlink(file.path);
      }
    } catch (error) {
      results.push({
        filename: file.originalname,
        status: "error",
        downloadLink: null,
      });
    }
  }
  return results;
};

export const handleDownload = async (req, res) => {
  const filename = req.params.filename;
  const downloadPath = path.join(__UPLOAD_DIR, filename);
  try {
    await fs.access(downloadPath);
    const ID_length = 37;
    const processedFileName = path.basename(downloadPath).slice(ID_length);
    console.log(processedFileName, " ", downloadPath);

    res.header("Access-Control-Expose-Headers", "Content-Disposition");
    res.set(
      "Content-Disposition",
      `attachment; filename="${processedFileName}"`
    );
    res.download(downloadPath, processedFileName);
  } catch (error) {
    res.sendStatus(408);
  }
};

export const handleDownloadAll = async (req, res) => {
  const { filesToDownload } = req.body;

  if (!filesToDownload && filesToDownload.length === 0) {
    res.status(400).send("No files to download.");
  }

  const zipFilename = `converted_files_${uuidv4()}.zip`;
  const ID_length = 37;

  res.attachment(zipFilename);
  res.setHeader("Content-Type", "application/zip");

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(res);

  try {
    const filePromises = filesToDownload.map(async (file) => {
      const downloadPath = path.join(__UPLOAD_DIR, file);
      const processedFileName = path.basename(downloadPath).slice(ID_length);

      await fs.access(downloadPath);
      return { downloadPath, processedFileName };
    });

    const files = await Promise.all(filePromises);

    files.forEach((file) => {
      archive.file(file.downloadPath, { name: file.processedFileName });
    });

    archive.finalize();
  } catch (error) {
    res.sendStatus(408);
  }
};
