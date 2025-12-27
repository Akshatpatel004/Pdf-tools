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
  const isdocxfiletype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"||
                            "application/vnd.ms-excel.sheet.macroEnabled.12"||
                            "application/vnd.ms-excel.sheet.binary.macroEnabled.12"||
                            "application/vnd.ms-excel"||
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.template"||
                            "application/vnd.ms-excel.template.macroEnabled.12"||
                            "text/csv" ;
	function uploadFile(file) {
		let listItem = document.createElement("li");
		let docxicon = document.createElement("img");
		let iconsrc = (docxicon.src = "../icons/excel.png");

		let fileName = file.name;
		let fileSize = (file.size / 1024).toFixed(1);
		listItem.innerHTML = `<img src = "${iconsrc}" style="height:50px; width:50px;"><p>${fileName}</p><span>${fileSize}KB</span>`;
		if (fileSize >= 1024) {
			fileSize = (fileSize / 1024).toFixed(1);
			listItem.innerHTML = `<img src = "${iconsrc}"><p>${fileName}</p><span>${fileSize}MB</span>`;
		}
		fileList.appendChild(listItem);
	}

	function handlefiles(files, dragfiles) {
		const validFiles = Array.from(files).filter(file => file.type === isdocxfiletype);

		Array.from(files).forEach((file) => selectedFiles.push(file));
		console.log(selectedFiles, "?:>:?.;");


		if (!validFiles) {
			alert("Please upload only EXCEL file");
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
			alert("Please upload atleast 1 EXCEL file");
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
			let docx = Array.from(dragfiles).filter(
				(f) => f.type === isdocxfiletype
			);
			console.log(docx, "?:>:?>:");

			if (docx.length > 0) {
				handlefiles(docx, 1);
			} else {
				alert("Please upload only EXCEL file");
			}
		});
	} catch (error) {
		console.log(error);
	}

	submitBtn.addEventListener("click", async function (e) {
		if (selectedFiles.length < 0) {
			alert("Please upload at least one EXCEL files.");
			return;
		}

		e.preventDefault();
		const formData = new FormData();
		selectedFiles.forEach((file) => {
			formData.append("office_pdf", file);
		});
		// formData.append("pdflen", selectedFiles.length);

		try {
			const response = await fetch("/officetopdf", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				if (selectedFiles.length==1) {
					a.download = `EXCEL to pdf ${Date.now()}.pdf`;
				} else if(selectedFiles.length>1){
					a.download = `EXCEL_to_pdf convert ${Date.now()}.zip`;
				}
				document.body.appendChild(a);
				a.click();
				a.remove();
			} else {
				alert("pdf create failed. Please try again.");
			}
		} catch (error) {
			console.error("Upload error:", error);
			alert("An error occurred while uploading.");
		}
	});
});
