const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const multer  = require('multer')
const upload = multer({ dest: 'Uploads'})
const port = 3000;
const {exec}=require("child_process")
app.use(express.static(path.join(__dirname , "templates")));
app.use(express.static(path.join(__dirname , "templates")));


const docxConverttopdf = require('docx-pdf');
const pdf_poppler = require('pdf-poppler');
const archiver = require('archiver');
let toPdf = require("office-to-pdf");
const {convert , sizes} = require("image-to-pdf");
const PDFMerger = require('pdf-merger-js');
var merger = new PDFMerger();

app.get('/', function (req,res) {
    res.sendFile(path.join(__dirname,"templates/home/home.html"))
})
app.get('/merge_pdf', function (req,res) {
    res.sendFile(path.join(__dirname,"templates/merge_pdf/merge_pdf.html"))
})
app.get('/docx_pdf', function (req,res) {
    res.sendFile(path.join(__dirname,"templates/docx_pdf/docx_pdf.html"))
})
app.get('/image_pdf', function (req,res) {
    res.sendFile(path.join(__dirname,"templates/image_pdf/image_to_pdf.html"))
})
app.get('/ppt_pdf', function (req,res) {
    res.sendFile(path.join(__dirname,"templates/ppt_pdf/ppt_pdf.html"))
})
app.get('/pdf_png', function (req,res) {
    res.sendFile(path.join(__dirname,"templates/pdf_png/pdf_png.html"))
})
// app.get('/pdf_docx', function (req,res) {
//     res.sendFile(path.join(__dirname,"templates/pdf_docx/pdf_docx.html"))
// })

const main_dir=["Download/Merge pdf/","Download/docx to pdf/","Download/image_pdf/","Download/temp_pdf/","Download/ppt_pdf/","Download/pdf_png/"];
function cre_dir(){
	for(let dir of main_dir){
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
	}
}
function compress_file(files,save_path,msg){
	const output = fs.createWriteStream(save_path);
	const archive = archiver('zip', {
  		zlib: { level: 9 } // Sets the compression level.
	});
	output.on('close', function() {
		console.log("zip file created successfully");
	});
	archive.on('error', function(err) {
		console.log(err);
	})
	archive.pipe(output);
	files.forEach((fil)=>{		
		if (msg==="custome") {
			console.log(fil);
			archive.directory(fil,fil.slice(18))
		} else if(msg==="Standard"){
			archive.append(fs.createReadStream(fil), { name: fil.slice(18,-4)+" "+Date.now()+fil.slice(-4)});
		}		
	})
	archive.finalize();
}

app.post('/merge' ,upload.any(),async(req , res)=>{
    if(!req.files || req.files.length===0){
        console.log("no files uploaded");
        return res.status(400).send("no files uploaded")
    } else{
		cre_dir()
        console.log(req.files.length , req.files);
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
			}else{
				setTimeout(()=>{
					fs.unlinkSync(pdf_merge_outputPath);
					req.files.forEach((file) => fs.unlinkSync(file.path));
				},5000)
			}
		});

    }
})

app.post('/docxtopdf',upload.array("docx_pdf"),async (req , res)=>{
	if(!req.files || req.files.length===0){
		console.log("no files uploaded");
        return res.status(400).send("no files uploaded")
    }else{
		cre_dir()
		console.log(req.files)
		try{
			let docxtopdf_outputfilepath = ['Download/docx to pdf/Docx_to_pdf '+Date.now()+".pdf",`Download/docx to pdf/Docx to pdf convert_ ${Date.now()}.zip`];

			if (req.files.length===1) {
				docxConverttopdf(req.files[0].path,docxtopdf_outputfilepath[0],function(err,result){
					if(err){
						console.log(err);
					}
					else{
						console.log("pdf created successfully"+result);
						res.download(docxtopdf_outputfilepath[0],(err)=>{
							if (err) {
								console.log(err);
							}else{
								setTimeout(()=>{
									fs.unlinkSync(docxtopdf_outputfilepath[0]);
									req.files.forEach((file) => fs.unlinkSync(file.path));
								},5000)
							}
						})
					}
				});
			} else if(req.files.length >1) {
				let pdfpath_array =[];
				for (let fil of req.files) {
					const doc_pdfpath=path.join('Download/temp_pdf',`${fil.originalname.replace(".docx",".pdf")}`);
					await new Promise((resolve,reject)=>{
						docxConverttopdf(fil.path,doc_pdfpath,(err,result)=>{
							if(err){
								console.log(err);
								reject(err);
							}else{
								resolve(result)
							}
						});
					});
					pdfpath_array.push(doc_pdfpath);
				}
				compress_file(pdfpath_array,docxtopdf_outputfilepath[1],"Standard");
				let time_interval = setInterval(()=>{
					if (fs.existsSync(docxtopdf_outputfilepath[1])) {
						res.download(docxtopdf_outputfilepath[1],(err)=>{
							if (err) {
								console.log(err);
							}else{
								setTimeout(()=>{
									fs.unlinkSync(docxtopdf_outputfilepath[1]);
									req.files.forEach((file) => fs.unlinkSync(file.path));
									pdfpath_array.forEach((pdf)=>fs.unlinkSync(pdf));
								},5000)
							}
						})						
						clearInterval(time_interval);
					}
				},1000)		
			}
		}catch(error){
			res.status(500).send("Internal Server Error");
			console.log(error);
		}
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
				}else{
					setTimeout(()=>{
						fs.unlinkSync(img_pdf_outputPath);
						req.files.forEach((file) => fs.unlinkSync(file.path));
					},5000)
				}
			});
		});
	} catch (error) {
		res.status(500).send("Internal Server Error");
	}
})

app.post('/pptxtopdf',upload.array("pptx_pdf"),async (req , res)=>{
	if (!req.files || req.files.length === 0) {
		return res.status(400).send("no files uploaded");
	}else{
		console.log(req.files.length,req.files);
		let ppt_pdf_outputpath=[`Download/ppt_pdf/ppt to pdf convert_${Date.now()}.pdf`,`Download/ppt_pdf/ppt to pdf convert_${Date.now()}.zip`,`Download/temp_pdf/`]
		cre_dir()
		if (req.files.length===1) {
			var pptxBuffer = fs.readFileSync(req.files[0].path)
			const pdfBuffer= await toPdf(pptxBuffer);			
			fs.writeFileSync(ppt_pdf_outputpath[0], pdfBuffer)
			let time_interval = setInterval(()=>{
				if (fs.existsSync(ppt_pdf_outputpath[0])) {
					res.download(ppt_pdf_outputpath[0],(err)=>{
						if (err) {
							console.log(err);
						}else{
							console.log("ppt to pdf download successfully");
							setTimeout(()=>{
								fs.unlinkSync(ppt_pdf_outputpath[0]);
								req.files.forEach((file) => fs.unlinkSync(file.path));
							},5000)
						}
					})
					clearInterval(time_interval);
				}
			},1000)
		}else if(req.files.length>1){
			let pptpath_array=[];
			for (let fil of req.files) {
				const ppt_pdfpath=path.join(ppt_pdf_outputpath[2]+`${fil.originalname.replace(".pptx",".pdf")}`);
				var pptxBuffer = fs.readFileSync(fil.path);
				const pdfBuffer= await toPdf(pptxBuffer);			
				fs.writeFileSync(ppt_pdfpath, pdfBuffer)
				pptpath_array.push(ppt_pdfpath)
			}
			await compress_file(pptpath_array,ppt_pdf_outputpath[1],"Standard");
			let time_interval = await setInterval(()=>{
				if (fs.existsSync(ppt_pdf_outputpath[1])) {
					res.download(ppt_pdf_outputpath[1],(err)=>{
						if (err) {
							console.log(err);
						}else{
							console.log("zip file download successfully");
							setTimeout(()=>{
								fs.unlinkSync(ppt_pdf_outputpath[1]);
								req.files.forEach((file) => fs.unlinkSync(file.path));
								pptpath_array.forEach((pdf)=>fs.unlinkSync(pdf));
							},5000)
						}
					})
					clearInterval(time_interval);
				}
			},1000)

		}

		
	}
})

app.post('/pdftopng',upload.array("pdf_png"),async (req , res)=>{
	if (!req.files || req.files.length === 0) {
		return res.status(400).send("no files uploaded");
	}
	try {
		cre_dir()
		console.log(req.files.length,req.files);
		let pdf_png_array=[];
		let pdf_png_name_array=[];
		let pdf_png_output = [`Download/pdf_png/pdf to png convert_${Date.now()}.zip`,`Download/temp_pdf/`,`Download/pdf_png`]
		for (let fil of req.files) {
			const pdf_png_dir_name=fil.originalname+`_${Date.now()}`;
			if(!fs.existsSync(pdf_png_output[1]+pdf_png_dir_name)){fs.mkdirSync(pdf_png_output[1]+pdf_png_dir_name, { recursive: true })}
			pdf_png_name_array.push(pdf_png_output[1]+pdf_png_dir_name)
			let opts = {
				format: 'jpg',
				out_dir: path.join(__dirname , pdf_png_output[1]+pdf_png_dir_name+"/"),
				out_prefix:"page",
				page: null
			}
			await pdf_poppler.convert(fil.path, opts)
				.then(res => {
					console.log('Successfully converted');
				})
				.catch(error => {
					console.error(error);
				})
			pdf_png_array.push(pdf_png_output[1]+pdf_png_dir_name)
		}
		await compress_file(pdf_png_array,pdf_png_output[0],"custome");
		try{
			let time_interval = await setInterval(()=>{
				if (fs.existsSync(pdf_png_output[0])) {
					res.download(pdf_png_output[0],(err)=>{
						if (err) {
							console.log(err);
						}else{
							console.log("zip file download successfully");
							setTimeout(()=>{
								fs.unlinkSync(pdf_png_output[0]);
								req.files.forEach((file) => fs.unlinkSync(file.path));
								fs.rmSync("Download/temp_pdf" , {recursive:true ,force:true})
								pdf_png_array=[];
							},5000)
						}
					})
					clearInterval(time_interval);
				}
			},5000)
		}catch(err){
			console.log(err);	
		}
	} catch (error) {
		console.log(error);
	}
})

// app.post('/pdftodocx',upload.array("pdf_docx"),async (req , res)=>{
// 	if (!req.files || req.files.length === 0) {
// 		return res.status(400).send("no files uploaded");
// 	}
// 	try {
// 		let pdf_docx_outputpath ="Download/temp_pdf/output.docx";
// 		cre_dir()
// 		console.log(req.files.length,req.files);
// 		let pdf_docx = await PDF2DOCX.load(req.files[0].path);
// 		await pdf_docx.saveAs(pdf_docx_outputpath)
// 		await console.log("successfully");
		
// 	}catch(err){
// 		console.log(err);
// 	}
// })

app.listen(port , ()=>{
    console.log(`app is listening in this port http://localhost:${port}`)
})