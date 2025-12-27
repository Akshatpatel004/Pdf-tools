document.addEventListener("DOMContentLoaded", function () {
    let merge_pdf = document.getElementById("merge_pdf");
    let docx_pdf = document.getElementById("docx_pdf");
    let image_pdf = document.getElementById("image_pdf");
    let ppt_pdf = document.getElementById("ppt_pdf");
    let pdf_png = document.getElementById("pdf_png");
    let excel_pdf = document.getElementById("excel_pdf");


    const url = "http://localhost:3000";

    merge_pdf.addEventListener("click", function () {
        window.location.href = `${url}/merge_pdf`;
    })
    docx_pdf.addEventListener("click", function () {
        window.location.href = `${url}/docx_pdf`;
    })
    image_pdf.addEventListener("click", function () {
        window.location.href = `${url}/image_pdf`;
    })
    ppt_pdf.addEventListener("click", function () {
        window.location.href = `${url}/ppt_pdf`;
    })
    pdf_png.addEventListener("click", function () {
        window.location.href = `${url}/pdf_png`;
    })
    excel_pdf.addEventListener("click", function () {
        window.location.href = `${url}/excel_pdf`;
    })

})