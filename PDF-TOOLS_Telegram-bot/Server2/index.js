const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const multer = require('multer')
const upload = multer({ dest: 'Uploads' })
const port = 3000;
let toPdf = require('office-to-pdf');
const archiver = require('archiver');
const { exec } = require("child_process");
const { error } = require('console');
const { stderr, stdout } = require('process');


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

function compress_file(files, save_path, msg) {
    const output = fs.createWriteStream(save_path);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });
    output.on('close', function () {
        console.log("zip file created successfully");
    });
    archive.on('error', function (err) {
        console.log(err);
    })
    archive.pipe(output);
    files.forEach((fil) => {
        if (msg === "custome") {
            console.log(fil);
            archive.directory(fil, fil.slice(18))
        } else if (msg === "Standard") {
            archive.append(fs.createReadStream(fil), { name: fil.slice(18, -4) + " " + Date.now() + fil.slice(-4) });
        }
    })
    archive.finalize();
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
        console.log(req.files)
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
                compress_file(pdfpath_array, docxtopdf_outputfilepath[1], "Standard");
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
    // const filepath = `"C:/Program Files/gs/gs10.06.0/bin/gswin64c.exe"`;
    if (!req.files || req.files.length === 0) {
        console.log("no files uploaded");
        return res.status(400).send("no files uploaded")
    } else {
        cre_dir()
        console.log(req.files.length, req.files)
        try {
            let docxtopdf_outputfilepath = [`Download/compress-pdf/compress-pdf_size_${Date.now()}.pdf`, `Download/compress-pdf/${Date.now()}.zip`];
            if (req.files.length === 1) {

                const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
                -dPDFSETTINGS=/screen \
                -dNOPAUSE -dQUIET -dBATCH \
                -sOutputFile=${docxtopdf_outputfilepath[0]} ${req.files[0].path}`;

                exec(gsCommand, (error, stdout, stderr) => {
                    if (error) {
                        setTimeout(() => {
                            // fs.unlinkSync(docxtopdf_outputfilepath[0]);
                            fs.promises.rm(main_dir[1], { recursive: true, force: true })
                            req.files.forEach((file) => fs.unlinkSync(file.path));
                        }, 5000)
                        return console.error("Ghostscript Error:", error.message);
                    }
                    console.log("Ghostscript Output:", stderr || stdout);

                    if (!fs.existsSync(docxtopdf_outputfilepath[0])) {
                        setTimeout(() => {
                            // fs.unlinkSync(docxtopdf_outputfilepath[0]);
                            fs.promises.rm(main_dir[1], { recursive: true, force: true })
                            req.files.forEach((file) => fs.unlinkSync(file.path));
                        }, 5000)
                        return res.status(400).send("No compress file created");
                    }

                    res.download(docxtopdf_outputfilepath[0], (err) => {
                        if (err) {
                            console.log(err);
                            // fs.unlinkSync(docxtopdf_outputfilepath[0]);
                            fs.promises.rm(main_dir[1], { recursive: true, force: true })
                            req.files.forEach((file) => fs.unlinkSync(file.path));
                        } else {
                            setTimeout(() => {
                                // fs.unlinkSync(docxtopdf_outputfilepath[0]);
                                fs.promises.rm(main_dir[1], { recursive: true, force: true })
                                req.files.forEach((file) => fs.unlinkSync(file.path));
                            }, 5000)
                        }
                    })
                })

            } else if (req.files.length > 1) {
                let pdfpath_array = [];
                let con = 0;
                await req.files.forEach((fil) => {
                    const doc_pdfpath = path.join('Download/temp_pdf', `compressed_${Date.now()}.pdf`);
                    const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 \
                        -dPDFSETTINGS=/screen \
                        -dDownsampleColorImages=true -dColorImageResolution=75 \
                        -dNOPAUSE -dQUIET -dBATCH \
                        -sOutputFile="${doc_pdfpath}" "${fil.path}"`;

                    exec(gsCommand, (error, stderr, stdout) => {
                        if (error) {
                            setTimeout(() => {
                                req.files.forEach((file) => fs.unlinkSync(file.path));
                            }, 5000)
                            return console.error("Ghostscript Error:", error.message);
                        }
                        console.log("Ghostscript Output:", stderr || stdout);
                        pdfpath_array.push(doc_pdfpath);
                        con = con + 1;
                    })
                });

                let zip_time = setInterval(() => {
                    if (con === req.files.length) {
                        clearInterval(zip_time);
                        setTimeout(() => {
                            compress_file(pdfpath_array, docxtopdf_outputfilepath[1], "Standard");
                            let time_interval = setInterval(() => {
                                if (fs.existsSync(docxtopdf_outputfilepath[1])) {
                                    res.download(docxtopdf_outputfilepath[1], (err) => {
                                        if (err) {
                                            console.log(err);
                                            // fs.unlinkSync(docxtopdf_outputfilepath[1]);
                                            fs.promises.rm(main_dir[1], { recursive: true, force: true })
                                            req.files.forEach((file) => fs.unlinkSync(file.path));
                                            pdfpath_array.forEach((pdf) => fs.unlinkSync(pdf));

                                        } else {
                                            setTimeout(() => {
                                                // fs.unlinkSync(docxtopdf_outputfilepath[1]);
                                                fs.promises.rm(main_dir[1], { recursive: true, force: true })
                                                req.files.forEach((file) => fs.unlinkSync(file.path));
                                                pdfpath_array.forEach((pdf) => fs.unlinkSync(pdf));
                                            }, 5000)
                                        }
                                    })
                                    clearInterval(time_interval);
                                }
                            }, 1000)

                        }, 2000)
                    }
                }, 1000)

            }
        } catch (error) {
            res.status(500).send("Internal Server Error");
            console.log(error);
        }
    }
})


app.listen(port, () => {
    console.log(`app is listening in this port http://localhost:${port}`)
})