const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const multer = require('multer')
const upload = multer({ dest: 'Uploads' })
const port = 3000;

let toPdf = require('office-to-pdf');
let libre = require('libreoffice-convert');

const main_dir = ["Download/Office_PDF/", "Download/temp_pdf/"];
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

async function pdf_office(files, output , ext) {
    try {
        cre_dir()
        var inputBuffer = fs.readFileSync(files)
        const pdfbuf = await libre.convertAsync(inputBuffer ,ext ,undefined)
        fs.writeFileSync(output , pdfbuf)
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
    res.send("office-to-pdf_libreoffice server is alive")
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


app.post('/pdf_docx', upload.any(), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        console.log("no files uploaded");
        return res.status(400).send("no files uploaded")
    } else {
        cre_dir()
        console.log(req.files)
        try {
            let docxtopdf_outputfilepath = ['Download/Office_PDF/Office-to-PDF' + Date.now() + ".docx", `Download/Office_PDF/Office-to-PDF_convert_${Date.now()}.zip`];

            if (req.files.length === 1) {
                await pdf_office(req.files[0].path, docxtopdf_outputfilepath[0] , ".docx");
                console.log("docx created successfully");
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
                    const doc_pdfpath = path.join('Download/temp_pdf', `${fil.originalname}.docx`);
                    await pdf_office(fil.path, doc_pdfpath , ".docx")
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


app.post('/pdf_pptx', upload.any(), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        console.log("no files uploaded");
        return res.status(400).send("no files uploaded")
    } else {
        cre_dir()
        console.log(req.files)
        try {
            let docxtopdf_outputfilepath = ['Download/Office_PDF/Office-to-PDF' + Date.now() + ".pptx", `Download/Office_PDF/Office-to-PDF_convert_${Date.now()}.zip`];

            if (req.files.length === 1) {
                await pdf_office(req.files[0].path, docxtopdf_outputfilepath[0] , ".pptx");
                console.log("pptx file created successfully");
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
                    const doc_pdfpath = path.join('Download/temp_pdf', `${fil.originalname}.pptx`);
                    await pdf_office(fil.path, doc_pdfpath , ".pptx")
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


app.post('/pdf_excel', upload.any(), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        console.log("no files uploaded");
        return res.status(400).send("no files uploaded")
    } else {
        cre_dir()
        console.log(req.files)
        try {
            let docxtopdf_outputfilepath = ['Download/Office_PDF/Office-to-PDF' + Date.now() + ".csv", `Download/Office_PDF/Office-to-PDF_convert_${Date.now()}.zip`];

            if (req.files.length === 1) {
                await pdf_office(req.files[0].path, docxtopdf_outputfilepath[0] , ".csv");
                console.log("csv file created successfully");
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
                    const doc_pdfpath = path.join('Download/temp_pdf', `${fil.originalname}.csv`);
                    await pdf_office(fil.path, doc_pdfpath , ".csv")
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


app.listen(port, () => {
    console.log(`app is listening in this port http://localhost:${port}`)
})