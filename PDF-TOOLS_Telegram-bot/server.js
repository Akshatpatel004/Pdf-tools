const express = require('express')
require("dotenv").config();
const path = require('path')
const app = express()
const fs = require('fs');
const multer = require('multer')
const upload = multer({ dest: 'Uploads' })
const port = process.env.port;

// const archiver = require('archiver');
const { convert, sizes } = require("image-to-pdf");
const PDFMerger = require('pdf-merger-js');
var merger = new PDFMerger();


const main_dir = ["Download/Merge pdf/", "Download/docx to pdf/", "Download/image_pdf/", "Download/temp_pdf/", "Download/pdf_png/", "Download/ppt_pdf/"];
function cre_dir() {
	for (let dir of main_dir) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
	}
}
// function compress_file(files, save_path, msg) {
// 	const output = fs.createWriteStream(save_path);
// 	const archive = archiver('zip', {
// 		zlib: { level: 9 } // Sets the compression level.
// 	});
// 	output.on('close', function () {
// 		console.log("zip file created successfully");
// 	});
// 	archive.on('error', function (err) {
// 		console.log(err);
// 	})
// 	archive.pipe(output);
// 	files.forEach((fil) => {
// 		if (msg === "custome") {
// 			console.log(fil);
// 			archive.directory(fil, fil.slice(18))
// 		} else if (msg === "Standard") {
// 			archive.append(fs.createReadStream(fil), { name: fil.slice(18, -4) + " " + Date.now() + fil.slice(-4) });
// 		}
// 	})
// 	archive.finalize();
// }

app.post('/merge', upload.any(), async (req, res) => {
	if (!req.files || req.files.length === 0) {
		console.log("no files uploaded");
		return res.status(400).send("no files uploaded")
	} else {
		cre_dir()
		console.log(req.files.length, req.files);
		const pdf_merge_outputPath = `Download/Merge pdf/Merged_${Date.now()}.pdf`;
		try {
			for (let file of req.files) {
				await merger.add(file.path);
			}
			await merger.save(pdf_merge_outputPath);
			await merger.reset();
		} catch (error) {
			console.log(error);
		}
		await res.download(pdf_merge_outputPath, (err) => {
			if (err) {
				console.error("Error sending file:", err);
				res.status(500).send("Error sending file.");
			} else {
				setTimeout(() => {
					fs.unlinkSync(pdf_merge_outputPath);
					req.files.forEach((file) => fs.unlinkSync(file.path));
				}, 5000)
			}
		});

	}
})

app.post("/imagetopdf", upload.any(), async (req, res) => {
	if (!req.files || req.files.length === 0) {
		return res.status(400).send("no files uploaded");
	}
	cre_dir()
	try {
		const imagePaths = req.files.map((file) => {
			return file.path;
		});

		const img_pdf_outputDir = path.join(__dirname, "Download/image_pdf");
		if (!fs.existsSync(img_pdf_outputDir)) {
			fs.mkdirSync(img_pdf_outputDir, { recursive: true });
		}

		const img_pdf_outputPath = path.join(img_pdf_outputDir, `${Date.now()}.pdf`);
		await new Promise((resolve, reject) => {
			convert(imagePaths, sizes.A4)
				.pipe(fs.createWriteStream(img_pdf_outputPath))
				.on("finish", resolve)
				.on("error", reject);
		});
		console.log("PDF created successfully :", img_pdf_outputPath);
		await fs.access(img_pdf_outputPath, fs.constants.F_OK, (err) => {
			if (err) {
				console.error("PDF not accessible:", err);
				return res.status(500).send("PDF file was not ready for download.");
			}

			res.download(img_pdf_outputPath, (err) => {
				if (err) {
					console.error("Error sending file:", err);
					return res.status(500).send("Error sending file.");
				} else {
					setTimeout(() => {
						fs.unlinkSync(img_pdf_outputPath);
						req.files.forEach((file) => fs.unlinkSync(file.path));
					}, 5000)
				}
			});
		});
	} catch (error) {
		res.status(500).send("Internal Server Error");
	}
})


app.listen(port, () => {
	console.log(`app is listening in this port http://localhost:${port}`)
});

require('./client_bot')