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

const { convert, sizes } = require("image-to-pdf");
const PDFMerger = require("pdf-merger-js");
const splitPdfLogic = require('./controler/split_pdf')

const port = 3000;

app.use(cors());


const main_dir = [
  "Download/Merge pdf/",
  "Download/image_pdf/",
  "Download/pdf_png/",
  "Download/split_pdf/",
  "Download/temp_pdf/",
];

function cre_dir() {
  for (let dir of main_dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function createZipFromDirectories(directories , zipPath) {
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

    directories.forEach(dir => {
      archive.directory(dir, path.basename(dir));
    });

    archive.finalize();
  });
}


app.get("/", (req, res) => {
  cre_dir();
  res.send("Server is running");
});


app.post("/merge_pdf", upload.any('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  try {
    cre_dir();
    const merger = new PDFMerger();
    const outputPath = `Download/Merge pdf/Merged_${Date.now()}.pdf`;

    for (const file of req.files) {
      await merger.add(file.path);
    }

    await merger.save(outputPath);

    res.download(outputPath, () => {
      setTimeout(() => {
        fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
        req.files.forEach(f => fs.unlinkSync(f.path));
      }, 5000);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF merge failed");
  }
});


app.post("/imagestopdf", upload.any("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  try {
    cre_dir();

    const imagePaths = req.files.map(f => f.path);
    const outputPath = `Download/image_pdf/Image_to_PDF_${Date.now()}.pdf`;

    convert(imagePaths, sizes.A4)
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        res.download(outputPath, () => {
          setTimeout(() => {
            fs.existsSync(outputPath) && fs.unlinkSync(outputPath);
            req.files.forEach(f => fs.unlinkSync(f.path));
          }, 5000);
        });
      })
      .on("error", err => {
        console.error(err);
        res.status(500).send("Image to PDF failed");
      });

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal error");
  }
});


app.post("/pdftopng", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  try {
    cre_dir();
    const { pdf } = await import("pdf-to-img");

    const zipPath = `Download/pdf_png/PDF_to_PNG_${Date.now()}.zip`;
    const tempRoot = "Download/temp_pdf/";
    const pngFolders = [];

    for (const file of req.files) {
      const folderName = `${path.parse(file.originalname).name}_${Date.now()}`;
      const outDir = path.join(tempRoot, folderName);
      fs.mkdirSync(outDir, { recursive: true });

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

    await createZipFromDirectories(pngFolders, zipPath);

    let time_interval = await setInterval(() => {
      if (fs.existsSync(zipPath)) {
        res.download(zipPath, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("zip file download successfully");
            setTimeout(() => {
              fs.unlinkSync(zipPath);
              req.files.forEach((file) => fs.unlinkSync(file.path));
              fs.rmSync("Download/temp_pdf", { recursive: true, force: true })
              pdf_png_array = [];
            }, 5000)
          }
        })
        clearInterval(time_interval);
      }
    }, 5000)

  } catch (err) {
    console.error(err);
    res.status(500).send("PDF to PNG failed");
  }
});


app.post('/split-pdf', upload.any(), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send("No files uploaded");

  cre_dir();
  const { splitRange, mergePdf } = req.body;
  const isMerge = mergePdf === 'true';
  const splitPdfDir = "Download/split_pdf/";

  try {
    if (req.files.length === 1) {
      const file = req.files[0];
      // Create a unique folder even for single files if not merging
      const folderName = `${path.parse(file.originalname).name}_split_${Date.now()}`;
      const tempFolder = path.join('Download/temp_pdf', folderName);
      if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

      const resultFiles = await splitPdfLogic(file.path, splitRange, isMerge, tempFolder);

      if (isMerge) {
        const finalFile = path.join(splitPdfDir, path.basename(resultFiles[0]));
        fs.renameSync(resultFiles[0], finalFile);
        res.download(finalFile, (err) => {
          if (fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          if (fs.existsSync(tempFolder)) fs.rmSync(tempFolder, { recursive: true, force: true });
        });
      } else {
        const zipName = `split_${Date.now()}.zip`;
        const zipPath = path.join(splitPdfDir, zipName);

        // Pass the folder path, not the array of files, to keep the ZIP logic clean
        await createZipFromDirectories([tempFolder], zipPath);

        res.download(zipPath, (err) => {
          if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          if (fs.existsSync(tempFolder)) fs.rmSync(tempFolder, { recursive: true, force: true });
        });
      }
    } else {
      // Multiple Files Logic (Keep your existing working logic, but use the improved zip function)
      let zipArray = [];
      for (let file of req.files) {
        const folderName = `${path.parse(file.originalname).name}_${Date.now()}`;
        const specificFolder = path.join('Download/temp_pdf', folderName);
        if (!fs.existsSync(specificFolder)) fs.mkdirSync(specificFolder, { recursive: true });

        await splitPdfLogic(file.path, splitRange, isMerge, specificFolder);
        zipArray.push(specificFolder);
      }

      const finalZip = path.join(splitPdfDir, `bulk_split_${Date.now()}.zip`);
      await createZipFromDirectories(zipArray, finalZip);

      res.download(finalZip, (err) => {
        if (fs.existsSync(finalZip)) fs.unlinkSync(finalZip);
        req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        zipArray.forEach(dir => { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); });
      });
    }
  } catch (error) {
    console.error("Split Error:", error);
    res.status(500).send("Error processing PDF split");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

require('./client_bot.js');

