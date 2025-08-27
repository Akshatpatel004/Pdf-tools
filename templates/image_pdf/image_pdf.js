document.addEventListener("DOMContentLoaded", function () {
	const fileInput = document.getElementById("file-input"); //file-section
	const fileList = document.getElementById("files-list"); //list cointainer
	const numOfFiles = document.getElementById("num-of-files");
	const container = document.getElementById("container");
	const all_list = document.getElementById("all-list"); //listsection
	const dropArea = document.querySelector(".drop-section");
	const submitBtn = document.getElementById("submit");

	let totalFiles = 0;
	let selectedFiles = [];

	function uploadFile(file) {
		let listItem = document.createElement("li");
		let pdficon = document.createElement("img");
		let iconsrc = (pdficon.src = "../icons/image.png");

		let fileName = file.name;
		let fileSize = (file.size / 1024).toFixed(1);
		listItem.innerHTML = `<img src = "${iconsrc}"><p>${fileName}</p><span>${fileSize}KB</span>`;
		if (fileSize >= 1024) {
			fileSize = (fileSize / 1024).toFixed(1);
			listItem.innerHTML = `<img src = "${iconsrc}"><p>${fileName}</p><span>${fileSize}MB</span>`;
		}
		fileList.appendChild(listItem);
	}

	function handlefiles(files, dragfiles) {
		const validFiles = Array.from(files).filter(
			(file) =>file.type === "image/png" || "image/jpeg" || "image/jpg"
		);

		Array.from(files).forEach((file) => selectedFiles.push(file));
		console.log(selectedFiles, "?:>:?.;");

		if (!validFiles) {
			alert("Please upload only image file");
		}
		console.log(typeof files, dragfiles, "?:>:?.:");

		totalFiles += files.length;
		if (totalFiles > 1) {
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
			alert("Please upload more than 1 image file to create pdf");
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
			let images = Array.from(dragfiles).filter(
				(f) =>
					f.type === "image/png" || "image/jpeg" || "image/jpg"
			);
			console.log(images, "?:>:?>:");

			if (images.length > 0) {
				handlefiles(images, 1);
			} else {
				alert("Please upload only image file");
			}
		});
	} catch (error) {
		console.log(error);
	}

	submitBtn.addEventListener("click", async function (e) {
		e.preventDefault();

		if (selectedFiles.length < 2) {
			alert("Please upload at least two image files.");
			return;
		}

		const formData = new FormData();
		selectedFiles.forEach((file) => {
			formData.append("image_pdf", file);
		});
		// formData.append("pdflen", selectedFiles.length);

		try {
			const response = await fetch("/imagetopdf", {
				method: "POST",
				body: formData,
			});

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = "Image to pdf.pdf";
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
