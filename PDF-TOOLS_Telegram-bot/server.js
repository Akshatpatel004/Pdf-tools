const express = require('express')
require("dotenv").config();
const app = express()
const path = require('path')
const fs = require('fs');
const multer = require('multer')
const upload = multer({ dest: 'Uploads/' })
const port = 3000;
// const { spawn } = require("child_process");
const archiver = require('archiver');
const cors = require("cors");

app.use(cors());
const { convert, sizes } = require("image-to-pdf");
const PDFMerger = require('pdf-merger-js');


const main_dir = ["Download/Merge pdf/", "Download/image_pdf/", "Download/temp_pdf/"];
function cre_dir() {
	for (let dir of main_dir) {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
	}
}
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
	res.send("bot is alive");
})

app.post('/merge_pdf', upload.any(), async (req, res) => {
	if (!req.files || req.files.length === 0) {
		console.log("no files uploaded");
		return res.status(400).send("no files uploaded")
	} else {
		try {
			cre_dir()
			console.log(req.files.length, req.files);
			const pdf_merge_outputPath = `Download/Merge pdf/Merged_${Date.now()}.pdf`;
			const merger = new PDFMerger();
			for (let file of req.files) {
				await merger.add(file.path);
			}
			await merger.save(pdf_merge_outputPath);
			await merger.reset();
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
		} catch (error) {
			console.log(error);
			res.status(500).send("Internal Server Error");
		}
	}
})

app.post("/imagestopdf", upload.any(), async (req, res) => {
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
		console.log(error);
		res.status(500).send("Internal Server Error");
	}
})

app.post('/pdftopng', upload.array(), async (req, res) => {
	const { pdf } = await import("pdf-to-img");

	if (!req.files || req.files.length === 0) {
		return res.status(400).send("no files uploaded");
	}
	try {
		cre_dir()
		console.log(req.files.length, req.files);
		let pdf_png_array = [];
		let pdf_png_output = [`Download/pdf_png/pdf to png convert_${Date.now()}.zip`, `Download/temp_pdf/`, `Download/pdf_png`]
		for (let fil of req.files) {
			const pdf_png_dir_name = fil.originalname + `_${Date.now()}`;
			if (!fs.existsSync(pdf_png_output[1] + pdf_png_dir_name)) { fs.mkdirSync(pdf_png_output[1] + pdf_png_dir_name, { recursive: true }) }
			let counter = 1;
			const document = await pdf(fil.path, { scale: 3 });
			for await (const image of document) {
				await fs.writeFile(`${pdf_png_output[1] + pdf_png_dir_name + "/"}page${counter}.png`, image);
				counter++;
			}
			pdf_png_array.push(pdf_png_output[1] + pdf_png_dir_name);
		}
		await compress_file(pdf_png_array, pdf_png_output[0]);
		try {
			let time_interval = await setInterval(() => {
				if (fs.existsSync(pdf_png_output[0])) {
					res.download(pdf_png_output[0], (err) => {
						if (err) {
							console.log(err);
						} else {
							console.log("zip file download successfully");
							setTimeout(() => {
								fs.unlinkSync(pdf_png_output[0]);
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
			console.log(err);
		}
	} catch (error) {
		console.log(error);
	}
})



app.listen(port, () => {
	console.log(`app is listening in this port http://localhost:${port}`)
});


require('./client_bot');

