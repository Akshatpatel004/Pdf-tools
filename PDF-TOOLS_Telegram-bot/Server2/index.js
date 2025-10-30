const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const multer = require('multer')
const upload = multer({ dest: 'Uploads' })
const port = 3000;

let toPdf = require('office-to-pdf');

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


app.get('/', async (req, res) => { res.send("office-to-pdf_libreoffice server is alive") });

app.post('/office-to-pdf_converter', upload.array("pptx_pdf"), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send("no files uploaded");
    } else {
        console.log(req.files.length, req.files);
        let ppt_pdf_outputpath = [`Download/Office_PDF/Office to pdf convert_${Date.now()}.pdf`, `Download/Office_PDF/Office to pdf convert_${Date.now()}.zip`, `Download/temp_pdf/`]
        cre_dir()
        if (req.files.length === 1) {
            await converter(req.files[0].path , ppt_pdf_outputpath[0])
            let time_interval = setInterval(() => {
                if (fs.existsSync(ppt_pdf_outputpath[0])) {
                    res.download(ppt_pdf_outputpath[0], (err) => {
                        if (err) {
                            console.log(err);
                            fs.unlinkSync(ppt_pdf_outputpath[0]);
                            req.files.forEach((file) => fs.unlinkSync(file.path));
                        } else {
                            console.log("Office to pdf download successfully");
                            setTimeout(() => {
                                fs.unlinkSync(ppt_pdf_outputpath[0]);
                                req.files.forEach((file) => fs.unlinkSync(file.path));
                            }, 5000)
                        }
                    })
                    clearInterval(time_interval);
                }
            }, 1000)
        } else if (req.files.length > 1) {
            let pptpath_array = [];
            for (let fil of req.files) {
				const ppt_pdfpath=path.join(ppt_pdf_outputpath[2]+`${fil.originalname.replace(".pptx",".pdf")}`);
                await converter(fil.path , ppt_pdfpath)
                pptpath_array.push(ppt_pdfpath)
            }
            await compress_file(pptpath_array, ppt_pdf_outputpath[1], "Standard");
            let time_interval = await setInterval(() => {
                if (fs.existsSync(ppt_pdf_outputpath[1])) {
                    res.download(ppt_pdf_outputpath[1], (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("zip file download successfully");
                            setTimeout(() => {
                                fs.unlinkSync(ppt_pdf_outputpath[1]);
                                req.files.forEach((file) => fs.unlinkSync(file.path));
                                pptpath_array.forEach((pdf) => fs.unlinkSync(pdf));
                            }, 5000)
                        }
                    })
                    clearInterval(time_interval);
                }
            }, 1000)
        }
    }
})


app.listen(port, () => {
	console.log(`app is listening in this port http://localhost:${port}`)

})
