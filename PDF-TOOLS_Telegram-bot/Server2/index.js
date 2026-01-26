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


const main_dir = ["Download/Office_PDF/", "Download/compress-pdf/", "Download/temp_pdf/"];
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

function compress_file(files, save_path) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(save_path);
        const archive = archiver('zip', { zlib: { level: 9 } });
        output.on('close', () => {
            resolve()
            console.log("zip file created successfully");
        });
        archive.on('error', (err) => {
            reject(err)
            console.error(err);
        });
        archive.pipe(output);
        files.forEach((fil) => {
            archive.append(fs.createReadStream(fil), { name: path.basename(fil) });
        });
        archive.finalize();
    });
}


app.get('/', async (req, res) => {
    cre_dir()
    res.send("office-to-pdf_libreoffice server is alive");
});

app.post('/office-to-pdf_converter', upload.any(), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        console.log("no files uploaded");
        return res.status(400).send("no files uploaded")
    } else {
        cre_dir()
        console.log(req.files.length, req.files)
        try {
            let docxtopdf_outputfilepath = ['Download/Office_PDF/Office-to-PDF' + Date.now() + ".pdf", `Download/Office_PDF/Office-to-PDF_convert_${Date.now()}.zip`];

            if (req.files.length === 1) {
                await converter(req.files[0].path, docxtopdf_outputfilepath[0]);
                console.log("pdf created successfully");
                res.download(docxtopdf_outputfilepath[0], (err) => {
                    if (err) {
                        console.log(err);
                        fs.unlinkSync(docxtopdf_outputfilepath[0]);
                        req.files.forEach((file) => fs.unlinkSync(file.path));
                    } else {
                        setTimeout(() => {
                            fs.unlinkSync(docxtopdf_outputfilepath[0]);
                            req.files.forEach((file) => fs.unlinkSync(file.path));
                        }, 5000)
                    }
                })

            } else if (req.files.length > 1) {
                let pdfpath_array = [];
                for (let fil of req.files) {
                    const doc_pdfpath = path.join('Download/temp_pdf', `${fil.originalname}.pdf`);
                    await converter(fil.path, doc_pdfpath)
                    pdfpath_array.push(doc_pdfpath);
                }
                compress_file(pdfpath_array, docxtopdf_outputfilepath[1]);
                let time_interval = setInterval(() => {
                    if (fs.existsSync(docxtopdf_outputfilepath[1])) {
                        res.download(docxtopdf_outputfilepath[1], (err) => {
                            if (err) {
                                console.log(err);
                                fs.unlinkSync(docxtopdf_outputfilepath[1]);
                                req.files.forEach((file) => fs.unlinkSync(file.path));
                                pdfpath_array.forEach((pdf) => fs.unlinkSync(pdf));
                            } else {
                                setTimeout(() => {
                                    fs.unlinkSync(docxtopdf_outputfilepath[1]);
                                    req.files.forEach((file) => fs.unlinkSync(file.path));
                                    pdfpath_array.forEach((pdf) => fs.unlinkSync(pdf));

                                }, 5000)
                            }
                        })
                        clearInterval(time_interval);
                    }
                }, 1000)
            }
        } catch (error) {
            res.status(500).send("Internal Server Error");
            console.log(error);
        }
    }
})

app.post('/compress-pdf_size', upload.any(), async (req, res) => {
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

            try {
                await execPromise(gsCommand);
                processedFiles.push(outputPath);
            } catch (gsError) {
                console.error("Ghostscript Execution Error:", gsError.message);
                // If GS fails, it's likely not installed. 
                return res.status(500).send("Compression engine (Ghostscript) not found on server.");
            }
        }

        if (req.files.length === 1) {
            res.download(processedFiles[0], (err) => {
                console.log("File downloadedd successfully");
                setTimeout(() => {
                    processedFiles.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
                    req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
                }, 5000)
            });
        } else {
            const zipPath = path.join(main_dir[1], `compressed_batch_${timestamp}.zip`);
            await compress_file(processedFiles, zipPath);
            res.download(zipPath, (err) => {
                console.log("Zip File downloadedd successfully");
                setTimeout(() => {
                    processedFiles.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
                    fs.unlinkSync(zipPath);
                    req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
                }, 5000)
            });
        }
    } catch (error) {
        console.error("Route Error:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.listen(port, () => {
    console.log(`app is listening in this port http://localhost:${port}`)
})