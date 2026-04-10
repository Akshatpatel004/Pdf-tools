const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function createZipFile(filepath, zipPath, msg) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            console.log("ZIP created:", zipPath);
            resolve();
        });

        archive.on("error", err => {
            reject(err);
        });

        archive.pipe(output);

        if (msg === "directory") {
            const dirs = Array.isArray(filepath) ? filepath : [filepath];
            dirs.forEach(dir => {
                if (fs.existsSync(dir)) {
                    archive.directory(dir, path.basename(dir));
                }
            });
        } else if (msg === "files") {
            const files = Array.isArray(filepath) ? filepath : [filepath];
            files.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: path.basename(filePath) });
                }
            });
        }

        archive.finalize();
    });
}

function cleanupFiles(outputs, uploads, folders = []) {
    setTimeout(() => {
        outputs.forEach(p => {
            if (p && fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (e) { console.error("File delete error:", e.message); }
            }
        });

        uploads.forEach(f => {
            if (f.path && fs.existsSync(f.path)) {
                try { fs.unlinkSync(f.path); } catch (e) { console.error("Upload delete error:", e.message); }
            }
        });

        folders.forEach(dir => {
            if (dir && fs.existsSync(dir)) {
                try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { console.error("Folder delete error:", e.message); }
            }
        });
        console.log("Cleanup cycle completed.");
    }, 10000);
}


module.exports = { createZipFile, cleanupFiles };