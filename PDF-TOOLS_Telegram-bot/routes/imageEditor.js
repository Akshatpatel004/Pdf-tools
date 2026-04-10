const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { exec } = require("child_process");
const util = require('util');
const execPromise = util.promisify(exec);
const { createZipFile, cleanupFiles } = require('../utils/utils'); 

const upload = multer({ dest: "Uploads/" });
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const main_dir = [
  "Download/bgImageRemoval/",
  "Download/temp_pdf/",
];

function cre_dir() {
  for (let dir of main_dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

router.post("/bgImageRemoval", upload.any("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  let processedFiles = [];
  let zipPath = "";
  let finalDownloadPath = "";

  try {
    cre_dir();
    console.log(req.files.length, req.files);    
    const outputDir = req.files.length === 1 ? "Download/bgImageRemoval/" : "Download/temp_pdf/";

    for (const file of req.files) {
      const fileName = `flexxpdf_bgImageRemoval_${path.parse(file.originalname).name}_${Date.now()}.png`;
      const outDir = path.join(outputDir, fileName);

      let cmd = `rembg i "${file.path}" "${outDir}"`;       
      await execPromise(cmd);
      processedFiles.push(outDir);
    }

    if (req.files.length > 1) {
      zipPath = path.join("Download/bgImageRemoval/", `flexxpdf_bgImageRemoval_${Date.now()}.zip`);
      await createZipFile(processedFiles, zipPath, "files");
      finalDownloadPath = zipPath;
    } else {
      finalDownloadPath = processedFiles[0];
    }

    res.download(finalDownloadPath, (err) => {
      cleanupFiles([zipPath, ...processedFiles], req.files);
    });

  } catch (error) {
    console.error("Background Removal Error:", error);
    cleanupFiles(processedFiles, req.files);
    res.status(500).send("Background removal failed");
  }
});


module.exports = router;