const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { exec } = require("child_process");
const util = require('util');
const execPromise = util.promisify(exec);
const { createZipFile, cleanupFiles } = require('../utils/utils'); 

const sharp = require('sharp');

const upload = multer({ dest: "Uploads/" });
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const main_dir = [
  "Download/temp_pdf/",           // index 0
  "Download/compressImageSize/",  // index 1
  "Download/imageFormatConverter/",  // index 2
];

function cre_dir() {
  for (let dir of main_dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

router.post("/compressImageSize", upload.any("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  let processedFiles = [];
  let zipPath = "";
  let finalDownloadPath = "";

  try {
    cre_dir();
    console.log(req.files.length,req.body.quality, req.files);
    const outputDir = req.files.length === 1 ? main_dir[1] : main_dir[0];
    
    let compressionoption={
      quality:Number(req.body.quality) || 50,
      progressive : true ,
      force : false
    }
    for (const file of req.files) {
      const fileName = `flexxpdf_compressImage_${path.parse(file.originalname).name}_${Date.now()}.jpeg`;
      const outDir = path.join(outputDir, fileName);

      await sharp(file.path)
      .jpeg(compressionoption)
      .toFile(outDir)
      processedFiles.push(outDir);
    }

    if (req.files.length > 1) {
      zipPath = path.join(main_dir[1], `flexxpdf_compressImage_${Date.now()}.zip`);
      await createZipFile(processedFiles, zipPath, "files");
      finalDownloadPath = zipPath;
    } else {
      finalDownloadPath = processedFiles[0];
    }

    res.download(finalDownloadPath, (err) => {
      cleanupFiles([zipPath, ...processedFiles], req.files);
    });

  } catch (error) {
    console.error("Compress image Error:", error);
    cleanupFiles(processedFiles, req.files);
    res.status(500).send("Compress image failed");
  }
});

router.post("/imageFormatConverter", upload.any("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  let processedFiles = [];
  let zipPath = "";
  let finalDownloadPath = "";
  let convertFileType = req.body.format;

  try {
    cre_dir();
    console.log(req.files.length,req.body.format ,req.files);
    const outputDir = req.files.length === 1 ? main_dir[2] : main_dir[0];
    
    for (const file of req.files) {
      const fileName = `flexxpdf_imageFormatConverter_${path.parse(file.originalname).name}_${Date.now()}.${convertFileType}`;
      const outDir = path.join(outputDir, fileName);

      await sharp(file.path)
      .toFormat(convertFileType , {quality:100})
      .toFile(outDir)
      processedFiles.push(outDir);
    }

    if (req.files.length > 1) {
      zipPath = path.join(main_dir[2], `flexxpdf_imageFormatConverter_${Date.now()}.zip`);
      await createZipFile(processedFiles, zipPath, "files");
      finalDownloadPath = zipPath;
    } else {
      finalDownloadPath = processedFiles[0];
    }

    res.download(finalDownloadPath, (err) => {
      cleanupFiles([zipPath, ...processedFiles], req.files);
    });

  } catch (error) {
    console.error("image Format Converter Error:", error);
    cleanupFiles(processedFiles, req.files);
    res.status(500).send("image Format Converter failed");
  }
});


module.exports = router;