const { PDFDocument } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

async function splitPdfLogic(filePath, rangeStr, merge, targetDir) {
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const ranges = rangeStr.split(',').map(r => r.trim());
    const resultFiles = [];

    // 'merge' will be true if:
    // 1. Frontend had only 1 range (we forced it to true)
    // 2. Frontend had multiple ranges and checkbox was checked
    if (merge) {
        const newPdf = await PDFDocument.create();
        for (const range of ranges) {
            const [start, end] = range.split('-').map(Number);
            const pages = Array.from({ length: (end - start + 1) }, (_, i) => start + i - 1);
            const copiedPages = await newPdf.copyPages(pdfDoc, pages);
            copiedPages.forEach(page => newPdf.addPage(page));
        }

        const fileName = `split_${Date.now()}.pdf`;
        const finalPath = path.join(targetDir, fileName);
        
        fs.writeFileSync(finalPath, await newPdf.save());
        resultFiles.push(finalPath);
    } else {
        // Only hits here if ranges > 1 AND checkbox was NOT checked
        for (let i = 0; i < ranges.length; i++) {
            const newPdf = await PDFDocument.create();
            const [start, end] = ranges[i].split('-').map(Number);
            const pages = Array.from({ length: (end - start + 1) }, (_, i) => start + i - 1);
            const copiedPages = await newPdf.copyPages(pdfDoc, pages);
            copiedPages.forEach(page => newPdf.addPage(page));

            const fileName = `split_part_${i + 1}_${Date.now()}.pdf`;
            const finalPath = path.join(targetDir, fileName);
            fs.writeFileSync(finalPath, await newPdf.save());
            resultFiles.push(finalPath);
        }
    }
    return resultFiles;
}

module.exports = splitPdfLogic;