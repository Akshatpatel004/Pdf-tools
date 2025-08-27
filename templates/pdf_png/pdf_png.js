document.addEventListener("DOMContentLoaded", function () {
	const fileInput = document.getElementById("file-input"); 
	const fileList = document.getElementById("files-list"); 
	const numOfFiles = document.getElementById("num-of-files");
	const container = document.getElementById("container");
	const all_list = document.getElementById("all-list"); 
	const dropArea = document.querySelector(".drop-section");
	const submitBtn = document.getElementById("submit");

	let totalFiles = 0;
	let selectedFiles = [];
  const ispdffiletype="application/pdf";

	function uploadFile(file) {
		let listItem = document.createElement("li");
		let pdficon = document.createElement("img");
		let iconsrc = (pdficon.src = "../icons/pdf.png");

		let fileName = file.name;
		let fileSize = (file.size / 1024).toFixed(1);
		listItem.innerHTML = `<img src = "${iconsrc}" style="height:50px; width:40px;"><p>${fileName}</p><span>${fileSize}KB</span>`;
		if (fileSize >= 1024) {
			fileSize = (fileSize / 1024).toFixed(1);
			listItem.innerHTML = `<img src = "${iconsrc}"><p>${fileName}</p><span>${fileSize}MB</span>`;
		}
		fileList.appendChild(listItem);
	}

	function handlefiles(files, dragfiles) {
		const validFiles = Array.from(files).filter(file => file.type === ispdffiletype);

		Array.from(files).forEach((file) => selectedFiles.push(file));
		console.log(selectedFiles, "?:>:?.;");


		if (!validFiles) {
			alert("Please upload only pdf file");
		}
		console.log(typeof (files), dragfiles, "?:>:?.:");

		totalFiles += files.length;
		if (totalFiles > 0) {
			numOfFiles.textContent = `${totalFiles} Files Selected`;

			if (totalFiles >= 1) {
				container.classList.remove("h1");
				all_list.classList.remove("h3");
				all_list.classList.remove("hidden");
				fileList.classList.remove("h3");
				container.classList.add("h2");
				all_list.classList.add("h4");
				fileList.classList.add("h4");
			} else {
				container.classList.remove("h2");
				all_list.classList.remove("h4");
				fileList.classList.remove("h4");
				container.classList.add("h1");
				all_list.classList.add("h3");
				all_list.classList.add("hidden");
				fileList.classList.add("h3");
			}

			for (i of files) {
				uploadFile(i);
			}
		} else {
			totalFiles = 0;
			alert("Please upload atleast 1 PDF file");
		}
	}
	fileInput.addEventListener("change", () => {
		handlefiles(fileInput.files);
	});

	try {
		dropArea.addEventListener("dragover", (e) => {
			e.preventDefault();
		});

		dropArea.addEventListener("dragleave", (e) => {
			e.preventDefault();
		});

		dropArea.addEventListener("drop", (e) => {
			e.preventDefault();

			let dragfiles = e.dataTransfer.files;
			let pdfs = Array.from(dragfiles).filter(
				(f) => f.type === ispdffiletype
			);
			console.log(pdfs, "?:>:?>:");

			if (pdfs.length > 0) {
				handlefiles(pdfs, 1);
			} else {
				alert("Please upload only PDF file");
			}
		});
	} catch (error) {
		console.log(error);
	}

	submitBtn.addEventListener("click", async function (e) {
		if (selectedFiles.length < 0) {
			alert("Please upload at least one PDF files.");
			return;
		}

		e.preventDefault();
		const formData = new FormData();
		selectedFiles.forEach((file) => {
			formData.append("pdf_png", file);
		});
		try {
			const response = await fetch("/pdftopng", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `PDF_to_PNG convert_${Date.now()}.zip`;
				document.body.appendChild(a);
				a.click();
				a.remove();
			} else {
				alert("PNG create failed. Please try again.");
			}
		} catch (error) {
			console.error("Upload error:", error);
			alert("An error occurred while uploading.");
		}
	});
});
