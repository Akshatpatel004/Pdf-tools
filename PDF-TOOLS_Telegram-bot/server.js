const express = require("express");
require("dotenv").config();
const app = express();

const path = require("path");
const fs = require("fs");
const fsPromises = require("fs/promises");

const multer = require("multer");
const upload = multer({ dest: "Uploads/" });

const archiver = require("archiver");
const cors = require("cors");

const { exec, spawn } = require("child_process");
const util = require('util');
const execPromise = util.promisify(exec);

const { convert, sizes } = require("image-to-pdf");
const PDFMerger = require("pdf-merger-js");
// Ensure this file exists in your project
// const splitPdfLogic = require('./controler/split_pdf') 

const port = 3000;

app.use(cors());

const main_dir = [
  "Download/Merge pdf/",
  "Download/image_pdf/",
  "Download/pdf_png/",
  "Download/split_pdf/",
  "Download/temp_pdf/",
  "Download/pdf_word/",
];

function cre_dir() {
  for (let dir of main_dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Helper 1: For Zipping Folders
function createZipFromDirectories(directories, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    archive.on("error", err => reject(err));
    archive.pipe(output);
    directories.forEach(dir => {
      archive.directory(dir, path.basename(dir));
    });
    archive.finalize();
  });
}

// Helper 2: For Zipping Individual Files (Required for Word Batch)
function createZipFromFiles(files, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    archive.on("error", err => reject(err));
    archive.pipe(output);
    files.forEach(file => {
      if (fs.existsSync(file)) {
        archive.file(file, { name: path.basename(file) });
      }
    });
    archive.finalize();
  });
}

function callPythonConverter(pythonfile, inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "py_api", pythonfile);

    // On Render, python3 is the standard command
    const process = spawn('python3', [scriptPath, inputPath, outputPath]);

    let errorData = "";
    process.stderr.on('data', (data) => { errorData += data.toString(); });

    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Python process failed: ${errorData}`));
    });
  });
}

// --- Routes ---

app.get("/", (req, res) => {
  cre_dir();
  res.send("Server is running");
});

// PDF TO WORD ROUTE (Fixed)
app.post("/convert-pdf-to-word", upload.any(), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    cre_dir();
    // We use temp_pdf for both to make zipping/cleanup consistent
    const outputDir = "Download/temp_pdf";
    let convertedFiles = [];

    for (let fil of req.files) {
      const fileName = `Converted_${Date.now()}_${path.parse(fil.originalname).name}.docx`;
      const fullOutputPath = path.join(outputDir, fileName);

      // Assumes your script is inside /py_api/pdf_to_docx.py
      await callPythonConverter("pdf_to_docx.py", fil.path, fullOutputPath);
      convertedFiles.push(fullOutputPath);
    }

    if (convertedFiles.length === 1) {
      res.download(convertedFiles[0], (err) => {
        setTimeout(() => {
          if (fs.existsSync(convertedFiles[0])) fs.unlinkSync(convertedFiles[0]);
          req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        }, 5000);
      });
    } else {
      const zipPath = path.join("Download/pdf_word", `Word_Batch_${Date.now()}.zip`);

      // FIX: Use file-specific zip function here
      await createZipFromFiles(convertedFiles, zipPath);

      res.download(zipPath, () => {
        setTimeout(() => {
          convertedFiles.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
          req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        }, 5000);
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

// ... (Rest of your routes like merge_pdf, imagestopdf, etc.)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

require('./client_bot.js');
