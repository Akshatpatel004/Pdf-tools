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

const Tesseract = require('tesseract.js');
const { pdf } = require('pdf-to-img');
const { convert, sizes } = require("image-to-pdf");
const PDFMerger = require("pdf-merger-js");
const splitPdfLogic = require('./controler/split_pdf');

const port = 3000;

// Cloudmersive Client Integration
const CloudmersiveConvertApiClient = require('cloudmersive-convert-api-client');
const defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;

// Configure API key
const Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = 'a357e7f0-08de-4c04-8ec6-9af8df7c8e5e';

app.use(cors());
app.use(express.json()); // for application/json
app.use(express.urlencoded({ extended: true })); // for form-data


const main_dir = [
  "Download/Merge pdf/",
  "Download/image_pdf/",
  "Download/pdf_png/",
  "Download/split_pdf/",
  "Download/ocr_pdf/",
  "Download/pdf_word/",
  "Download/temp_pdf/",
];

function cre_dir() {
  for (let dir of main_dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function createZipFile(filepath, zipPath, msg) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log("ZIP created:", zipPath);
      resolve();
    });

    archive.on("error", err => {
      reject(err);
    });

    archive.pipe(output);

    if (msg === "directory") {
      const dirs = Array.isArray(filepath) ? filepath : [filepath];
      dirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          archive.directory(dir, path.basename(dir));
        }
      });
    } else if (msg === "files") {
      const files = Array.isArray(filepath) ? filepath : [filepath];
      files.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: path.basename(filePath) });
        }
      });
    }

    archive.finalize();
  });
}

function cleanupFiles(outputs, uploads, folders = []) {
  setTimeout(() => {
    outputs.forEach(p => {
      if (p && fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (e) { console.error("File delete error:", e.message); }
      }
    });

    uploads.forEach(f => {
      if (f.path && fs.existsSync(f.path)) {
        try { fs.unlinkSync(f.path); } catch (e) { console.error("Upload delete error:", e.message); }
      }
    });

    folders.forEach(dir => {
      if (dir && fs.existsSync(dir)) {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { console.error("Folder delete error:", e.message); }
      }
    });
    console.log("Cleanup cycle completed.");
  }, 10000);
}


function callCloudConverter(inputPath) {
  return new Promise((resolve, reject) => {
    const apiInstance = new CloudmersiveConvertApiClient.ConvertDocumentApi();
    const inputFile = fs.readFileSync(inputPath);

    apiInstance.convertDocumentPdfToDocx(inputFile, (error, data, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

app.get("/", (req, res) => {
  cre_dir();
  res.send("Server is running");
});

app.use('/flexxpdf/aiChatbot', require('./routes/flexxpdf_aichatbot.js'))

app.post("/merge_pdf", upload.any('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  try {
    cre_dir();
    console.log(req.files.length, req.files);
    const merger = new PDFMerger();
    const outputPath = `Download/Merge pdf/Merged_${Date.now()}.pdf`;

    for (const file of req.files) {
      await merger.add(file.path);
    }

    await merger.save(outputPath);

    res.download(outputPath, (err) => {
      cleanupFiles([outputPath], req.files);
    });
  } catch (err) {
    console.error(err);
    cleanupFiles([], req.files);
    res.status(500).send("PDF merge failed");
  }
});

app.post("/imagestopdf", upload.any("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  try {
    cre_dir();
    console.log(req.files.length, req.files);
    const imagePaths = req.files.map(f => f.path);
    const outputPath = `Download/image_pdf/Image_to_PDF_${Date.now()}.pdf`;

    convert(imagePaths, sizes.A4)
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        res.download(outputPath, (err) => {
          cleanupFiles([outputPath], req.files);
        });
      })
      .on("error", err => {
        console.error(err);
        cleanupFiles([], req.files);
        res.status(500).send("Image to PDF failed");
      });

  } catch (err) {
    console.error(err);
    cleanupFiles([], req.files);
    res.status(500).send("Internal error");
  }
});

app.post("/pdftopng", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  try {
    cre_dir();
    console.log(req.files.length, req.files);
    const { pdf } = await import("pdf-to-img");
    const zipPath = `Download/pdf_png/PDF_to_PNG_${Date.now()}.zip`;
    const tempRoot = "Download/temp_pdf/";
    const pngFolders = [];

    for (const file of req.files) {
      const folderName = `${path.parse(file.originalname).name}_${Date.now()}`;
      const outDir = path.join(tempRoot, folderName);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

      let page = 1;
      const document = await pdf(file.path, { scale: 3 });

      for await (const image of document) {
        await fsPromises.writeFile(
          path.join(outDir, `page_${page}.png`),
          image
        );
        page++;
      }
      pngFolders.push(outDir);
    }

    await createZipFile(pngFolders, zipPath, "directory");

    res.download(zipPath, (err) => {
      cleanupFiles([zipPath], req.files, pngFolders);
    });

  } catch (err) {
    console.error("PNG Conversion Error:", err);
    cleanupFiles([], req.files);
    res.status(500).send("PDF to PNG failed");
  }
});

app.post("/convert-pdf-to-word", upload.any("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    cre_dir();
    console.log(req.files.length, req.files);
    const outputDir = "Download/temp_pdf";
    let convertedFiles = [];

    for (let fil of req.files) {
      const fileName = `Converted_${Date.now()}_${path.parse(fil.originalname).name}.docx`;
      const fullOutputPath = path.join(outputDir, fileName);
      const docxBuffer = await callCloudConverter(fil.path);
      fs.writeFileSync(fullOutputPath, docxBuffer);
      convertedFiles.push(fullOutputPath);
    }

    if (convertedFiles.length === 1) {
      res.download(convertedFiles[0], (err) => {
        cleanupFiles([convertedFiles[0]], req.files);
      });
    } 
    // else {
    //   const zipPath = path.join("Download/pdf_word", `Word_Batch_${Date.now()}.zip`);
    //   await createZipFile(convertedFiles, zipPath, "files");
    //   res.download(zipPath, (err) => {
    //     cleanupFiles([zipPath, ...convertedFiles], req.files);
    //   });
    // }
  } catch (error) {
    console.error("Cloud API Error:", error);
    cleanupFiles([], req.files);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});

app.post('/split-pdf', upload.any("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send("No files uploaded");
  console.log(req.files.length, req.files);

  cre_dir();
  const { splitRange, mergePdf } = req.body;
  const isMerge = mergePdf === 'true';
  const splitPdfDir = "Download/split_pdf/";
  let foldersToCleanup = [];

  try {
    if (req.files.length === 1) {
      const file = req.files[0];
      const folderName = `${path.parse(file.originalname).name}_split_${Date.now()}`;
      const tempFolder = path.join('Download/temp_pdf', folderName);
      if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });
      foldersToCleanup.push(tempFolder);

      const resultFiles = await splitPdfLogic(file.path, splitRange, isMerge, tempFolder);

      if (isMerge) {
        const finalFile = path.join(splitPdfDir, path.basename(resultFiles[0]));
        fs.renameSync(resultFiles[0], finalFile);
        res.download(finalFile, (err) => {
          cleanupFiles([finalFile], req.files, foldersToCleanup);
        });
      } else {
        const zipName = `split_${Date.now()}.zip`;
        const zipPath = path.join(splitPdfDir, zipName);
        await createZipFile(tempFolder, zipPath, "directory");
        res.download(zipPath, (err) => {
          cleanupFiles([zipPath], req.files, foldersToCleanup);
        });
      }
    } else {
      let zipArray = [];
      for (let file of req.files) {
        const folderName = `${path.parse(file.originalname).name}_${Date.now()}`;
        const specificFolder = path.join('Download/temp_pdf', folderName);
        if (!fs.existsSync(specificFolder)) fs.mkdirSync(specificFolder, { recursive: true });
        await splitPdfLogic(file.path, splitRange, isMerge, specificFolder);
        zipArray.push(specificFolder);
      }
      const finalZip = path.join(splitPdfDir, `bulk_split_${Date.now()}.zip`);
      await createZipFile(zipArray, finalZip, "directory");
      res.download(finalZip, (err) => {
        cleanupFiles([finalZip], req.files, zipArray);
      });
    }
  } catch (error) {
    console.error("Split Error:", error);
    cleanupFiles([], req.files, foldersToCleanup);
    if (!res.headersSent) res.status(500).send("Error processing PDF split");
  }
});

app.post('/ocr_pdf', upload.any("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send("No files uploaded");
  console.log(req.files.length, req.files);

  const ocrFiles = [];
  let zippath = null;

  // 1. Create a path for the data
  const langPath = path.join(__dirname, 'lang-data');
  if (!fs.existsSync(langPath)) fs.mkdirSync(langPath);

  // 2. Tell Tesseract to store/look for .traineddata there
  const worker = await Tesseract.createWorker('eng', 1, {
    cachePath: langPath,
  });
  try {
    cre_dir();
    const outputDir = req.files.length === 1 ? "Download/ocr_pdf/" : "Download/temp_pdf/";

    for (const file of req.files) {
      const fileName = `flexxpdf_ocr_${path.parse(file.originalname).name}_${Date.now()}.pdf`;
      const outDir = path.join(outputDir, fileName);
      const document = await pdf(file.path, { scale: 2 });
      const pdfPages = [];

      for await (const image of document) {
        const { data } = await worker.recognize(image, { pdfTitle: "FLEXXPDF OCR Result" }, { pdf: true });
        pdfPages.push(Buffer.from(data.pdf));
      }
      fs.writeFileSync(outDir, Buffer.concat(pdfPages));
      ocrFiles.push(outDir);
    }
    await worker.terminate();

    if (ocrFiles.length === 1) {
      res.download(ocrFiles[0], (err) => {
        cleanupFiles([ocrFiles[0]], req.files);
      });
    } else {
      zippath = `Download/ocr_pdf/FLEXXPDF_OCR_PDF_${Date.now()}.zip`;
      await createZipFile(ocrFiles, zippath, "files");
      res.download(zippath, (err) => {
        cleanupFiles([zippath, ...ocrFiles], req.files);
      });
    }

  } catch (err) {
    console.error("Error during OCR:", err);
    if (worker) await worker.terminate();
    cleanupFiles([zippath, ...ocrFiles], req.files);
    if (!res.headersSent) res.status(500).send("OCR failed");
  }
});



app.listen(port,"0.0.0.0" , () => {
  console.log(`Server running at http://localhost:${port}`);
});


require('./client_bot.js');
