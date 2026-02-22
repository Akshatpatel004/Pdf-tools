const express = require('express');
const router = express.Router();
const PDFDocument = require("pdfkit");
const pdfParse = require("pdf-parse");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Use disk storage (or memoryStorage if you want cleaner)
const upload = multer({ dest: "Uploads/" });
router.use(express.json()); // for application/json
router.use(express.urlencoded({ extended: true })); // for form-data

// ===================== EXTRACT TEXT =====================
router.post("/extract-text", upload.single("file"), async (req, res) => {
    try {
        const filePath = req.file.path;

        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);

        // Delete uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Upload file delete error:", err);
            else console.log("Uploaded file deleted");
        });
        res.json({
            message: "Text extracted successfully",
            text: pdfData.text,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


// ===================== CREATE PDF =====================
router.post("/create-pdf", async (req, res) => {
    try {
        const content = req.body?.content || req.body?.text || req.body?.message;

        if (!content) {
            return res.status(400).json({ error: "No content provided" });
        }

        const fileName = `output_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, fileName);

        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);
        doc.fontSize(12).text(content);
        doc.end();

        writeStream.on("finish", () => {
            res.download(filePath, fileName, () => {
                fs.unlink(filePath, (err) => {
                    if (err) console.error("Upload file delete error:", err);
                    else console.log("Uploaded file deleted");
                });
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "PDF generation failed" });
    }
});

module.exports = router;