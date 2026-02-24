require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fetch = require('node-fetch');
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const bot = new TelegramBot(process.env.telegram_bot_api, { polling: true });
const download_dir = path.join(__dirname, "bot_download");

// User state management
let userchoice = {};
let userchoice2 = {};
let userfiles = {};
let userphoto = {};
let download_file = {};

function cre_dir() {
    if (!fs.existsSync(download_dir)) {
        fs.mkdirSync(download_dir, { recursive: true });
    }
}

async function clearDirectoryItem(userId) {
    if (!download_file[userId]) return;

    for (const file of download_file[userId]) {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (error) {
            console.error(`Error deleting file ${file}:`, error);
        }
    }
    // Reset user state
    userfiles[userId] = [];
    userphoto[userId] = [];
    download_file[userId] = [];
    userchoice[userId] = null;
    userchoice2[userId] = null;
}

const mainMenu = {
    reply_markup: {
        keyboard: [
            ["PDF - Merge", "PDF to DOCX"],
            ["DOCX to PDF", "PPTX to PDF"],
            ["Excel to PDF", "Compress PDF Size"],
            ["PDF to PNG", "IMAGES to PDF"],
        ],
        resize_keyboard: true,
    },
};

const cancelMenu = {
    reply_markup: {
        keyboard: [["✅ Conform Upload"], ["❌ Cancel"]],
        resize_keyboard: true,
    },
};

bot.on("message", async (msg) => {
    cre_dir();
    try {
        const userId = msg.from.id;
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!userfiles[userId]) {
            userfiles[userId] = [];
            userphoto[userId] = [];
            download_file[userId] = [];
        }

        // --- Command Logic ---
        if (text === "/start") {
            bot.sendMessage(chatId, "Welcome to PDF-Tools bot.", mainMenu);
            await clearDirectoryItem(userId);
        } else if (text === "PDF - Merge") {
            userchoice[userId] = "merge_pdf";
            bot.sendMessage(chatId, "Upload at least 2 or more PDF files to merge.", cancelMenu);
        } else if (text === "IMAGES to PDF") {
            userchoice[userId] = "image_pdf";
            bot.sendMessage(chatId, "Upload image files (JPG or PNG).", cancelMenu);
        } else if (text === "PDF to DOCX") {
            userchoice[userId] = "pdf_docx";
            bot.sendMessage(chatId, "Upload your PDF file . ", cancelMenu);
        } else if (text === "PDF to PNG") {
            userchoice[userId] = "pdf_png";
            bot.sendMessage(chatId, "Upload your PDF file . ", cancelMenu);
        } else if (text === "Compress PDF Size") {
            userchoice[userId] = "compress_pdf";
            bot.sendMessage(chatId, "Upload your PDF file . ", cancelMenu);
        } else if (["DOCX to PDF", "PPTX to PDF", "Excel to PDF"].includes(text)) {
            const types = { "DOCX to PDF": "docx_pdf", "PPTX to PDF": "pptx_pdf", "Excel to PDF": "excel_pdf" };
            userchoice[userId] = types[text];
            bot.sendMessage(chatId, `Upload your ${text.split(' ')[0]} file(s).`, cancelMenu);
        } else if (text === "❌ Cancel") {
            await clearDirectoryItem(userId);
            bot.sendMessage(chatId, "Operation cancelled.", mainMenu);
        }

        // --- File Collection ---
        if (msg.document) {
            if (!userchoice[userId]) return bot.sendMessage(chatId, "Please select an option first.", mainMenu);
            const fileUrl = await bot.getFileLink(msg.document.file_id);
            userfiles[userId].push({
                url: fileUrl,
                name: msg.document.file_name,
                mime: msg.document.mime_type
            });
        } else if (msg.photo && userchoice[userId] === "image_pdf") {
            const photo = msg.photo[msg.photo.length - 1];
            const photoUrl = await bot.getFileLink(photo.file_id);
            userphoto[userId].push({
                url: photoUrl,
                name: `photo_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`
            });
        }

        // --- Processing Logic ---
        if (text === "✅ Conform Upload") {
            if (!userchoice[userId]) return;

            const waitMsg = await bot.sendMessage(chatId, "Processing your files... Please wait ⌚", mainMenu);
            const formData = new FormData();
            let endpoint;
            let outputFilePath;

            try {
                const targetFiles = userchoice[userId] === "image_pdf" ? userphoto[userId] : userfiles[userId];

                if (targetFiles.length === 0) {
                    await bot.deleteMessage(chatId, waitMsg.message_id);
                    return bot.sendMessage(chatId, "No files found to process.", mainMenu);
                }

                // Download files to local directory and append to FormData
                for (const item of targetFiles) {
                    const localPath = path.join(download_dir, item.name);
                    const res = await fetch(item.url);
                    const buffer = Buffer.from(await res.arrayBuffer());
                    fs.writeFileSync(localPath, buffer);
                    download_file[userId].push(localPath);
                    formData.append("files", fs.createReadStream(localPath));
                }


                // ... (keep the top of your bot code)

                // --- Route logic fixed to match Server 1 & Server 2 ---
                if (userchoice[userId] === "image_pdf") {
                    endpoint = `${process.env.server_api}/imagestopdf`;
                    outputFilePath = path.join(download_dir, `Images_${Date.now()}.pdf`);
                } else if (userchoice[userId] === "merge_pdf") {
                    endpoint = `${process.env.server_api}/merge_pdf`;
                    outputFilePath = path.join(download_dir, `Merged_${Date.now()}.pdf`);
                } else if (userchoice[userId] === "pdf_docx") {
                    endpoint = `${process.env.server_api}/convert-pdf-to-word`;
                    const extension = targetFiles.length >= 2 ? 'zip' : 'docx';
                    outputFilePath = path.join(download_dir, `Document_${Date.now()}.${extension}`);
                } else if (userchoice[userId] === "pdf_png") {
                    endpoint = `${process.env.server_api}/pdftopng`;
                    outputFilePath = path.join(download_dir, `Images_${Date.now()}.zip`);
                } else if (userchoice[userId] === "compress_pdf") {
                    endpoint = `${process.env.server2_api}/compress-pdf_size`;
                    const extension = targetFiles.length >= 2 ? 'zip' : 'pdf';
                    outputFilePath = path.join(download_dir, `Compressed_${Date.now()}.${extension}`);
                } else {
                    endpoint = `${process.env.server2_api}/office-to-pdf_converter`;
                    const extension = targetFiles.length >= 2 ? 'zip' : 'pdf';
                    outputFilePath = path.join(download_dir, `Converted_${Date.now()}.${extension}`);
                }



                // Send to appropriate server
                const response = await axios.post(endpoint, formData, {
                    headers: formData.getHeaders(),
                    responseType: "arraybuffer",
                    timeout: 120000 // 2-minute timeout for large files
                });

                fs.writeFileSync(outputFilePath, response.data);

                await bot.deleteMessage(chatId, waitMsg.message_id);
                await bot.sendDocument(chatId, outputFilePath);
                bot.sendMessage(chatId, "Done ✅", mainMenu);

            } catch (err) {
                console.error("Processing Error:", err.message);
                await bot.deleteMessage(chatId, waitMsg.message_id);
                bot.sendMessage(chatId, "⚠️ Error: Server is not responding or file format is incorrect.", mainMenu);
            } finally {
                // Final cleanup
                if (outputFilePath && fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
                await clearDirectoryItem(userId);
            }
        }
    } catch (error) {
        console.error("Global Handler Error:", error);
    }
});