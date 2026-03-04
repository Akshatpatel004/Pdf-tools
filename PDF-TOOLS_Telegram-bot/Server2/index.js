const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const multer = require('multer')
const upload = multer({ dest: 'Uploads' })
const port = 3005;
let toPdf = require('office-to-pdf');
const archiver = require('archiver');
const { exec } = require("child_process");
const util = require('util');
const execPromise = util.promisify(exec);
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const main_dir = ["Download/Office_PDF/", "Download/compress-pdf/", "Download/temp_pdf/", "Download/protect_pdf/"];
function cre_dir() {
    for (let dir of main_dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }
}

async function converter(files, output) {
    try {
        cre_dir()
        var inputBuffer = fs.readFileSync(files)
        const pdfBuffer = await toPdf(inputBuffer);
        fs.writeFileSync(output, pdfBuffer)
    } catch (error) {
        console.log(error);
    }
};

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


app.get('/', async (req, res) => {
    cre_dir()
    res.send("office-to-pdf_libreoffice server is alive");
});

app.post('/office-to-pdf_converter', upload.any('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send("no files uploaded")
    } else {
        cre_dir();
        console.log(req.files.length, req.files);
        try {
            let docxtopdf_outputfilepath = ['Download/Office_PDF/Office-to-PDF' + Date.now() + ".pdf", `Download/Office_PDF/Office-to-PDF_convert_${Date.now()}.zip`];

            if (req.files.length === 1) {
                await converter(req.files[0].path, docxtopdf_outputfilepath[0]);
                res.download(docxtopdf_outputfilepath[0], (err) => {
                    cleanupFiles([docxtopdf_outputfilepath[0]], req.files);
                })

            } else if (req.files.length > 1) {
                let pdfpath_array = [];
                for (let fil of req.files) {
                    const doc_pdfpath = path.join('Download/temp_pdf', `${Date.now()}_${fil.originalname}.pdf`);
                    await converter(fil.path, doc_pdfpath)
                    pdfpath_array.push(doc_pdfpath);
                }
                await createZipFile(pdfpath_array, docxtopdf_outputfilepath[1], "files");

                let time_interval = setInterval(() => {
                    if (fs.existsSync(docxtopdf_outputfilepath[1])) {
                        res.download(docxtopdf_outputfilepath[1], (err) => {
                            cleanupFiles([docxtopdf_outputfilepath[1], ...pdfpath_array], req.files);
                        })
                        clearInterval(time_interval);
                    }
                }, 1000)
            }
        } catch (error) {
            cleanupFiles([], req.files);
            res.status(500).send("Internal Server Error");
        }
    }
})

app.post('/compress-pdf_size', upload.any('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).send("No files uploaded");

    cre_dir();
    console.log(req.files.length, req.files);
    const timestamp = Date.now();
    const processedFiles = [];

    try {
        for (let file of req.files) {
            const outputPath = path.join(main_dir[1], `compressed_${Date.now()}_${file.originalname}`);
            const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
                -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH \
                -sOutputFile="${outputPath}" "${file.path}"`;

            await execPromise(gsCommand);
            processedFiles.push(outputPath);
        }

        if (req.files.length === 1) {
            res.download(processedFiles[0], (err) => {
                cleanupFiles([processedFiles[0]], req.files);
            });
        } else {
            const zipPath = path.join(main_dir[1], `compressed_batch_${timestamp}.zip`);
            await createZipFile(processedFiles, zipPath, "files");
            res.download(zipPath, (err) => {
                cleanupFiles([zipPath, ...processedFiles], req.files);
            });
        }
    } catch (error) {
        console.error("Route Error:", error);
        cleanupFiles(processedFiles, req.files);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/lock_pdf', upload.any('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send("no files uploaded");
    } else if (!req.body.password) {
        cleanupFiles([], req.files);
        return res.status(400).send("Password not provided");
    } else {
        cre_dir();
        console.log(req.files.length, req.files);
        let output_filename = `Download/protect_pdf/lock_pdf_${Date.now()}.pdf`
        try {
            let cmd = `qpdf --encrypt ${req.body.password} ${req.body.password} 256 -- ${req.files[0].path} ${output_filename}`;
            await execPromise(cmd);
            res.download(output_filename, (err) => {
                cleanupFiles([output_filename], req.files);
            });
        } catch (error) {
            cleanupFiles([output_filename], req.files);
            res.status(500).send("Error processing PDF");
        }
    }
})


app.post('/unlock_pdf', upload.any('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send("no files uploaded");
    } else if (!req.body.password) {
        cleanupFiles([], req.files);
        return res.status(400).send("Password not provided");
    } else {
        cre_dir();
        console.log(req.files.length, req.files);
        let output_filename = `Download/protect_pdf/unlock_pdf_${Date.now()}.pdf`
        try {
            let cmd = `qpdf --password=${req.body.password} --decrypt ${req.files[0].path} ${output_filename}`;
            await execPromise(cmd);
            res.download(output_filename, (err) => {
                cleanupFiles([output_filename], req.files);
            });
        } catch (error) {
            cleanupFiles([output_filename], req.files);
            res.status(500).send("Error processing PDF");
        }
    }
})

app.listen(port, () => {
    console.log(`app is listening in this port http://localhost:${port}`)
})