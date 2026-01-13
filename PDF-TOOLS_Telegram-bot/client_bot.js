require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const bot = new TelegramBot(process.env.telegram_bot_api, { polling: true });
const download_dir = path.join(__dirname, "bot_download");

function cre_dir() {
    if (!fs.existsSync(download_dir)) fs.mkdirSync(download_dir);
}

async function clearDirectoryItem(userId) {
    if (!download_file[userId]) return;
    for (const file of download_file[userId]) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    userfiles[userId] = [];
    userphoto[userId] = [];
    download_file[userId] = [];
    userchoice[userId] = null;
}

let userchoice = {};
let userfiles = {};
let userphoto = {};
let download_file = {};

const mainMenu = {
    reply_markup: {
        keyboard: [
            ["PDF - Merge", "Compress PDF Size"],
            ["DOCX to PDF", "PPTX to PDF"],
            ["Excel to PDF", "IMAGES to PDF"],
        ],
        resize_keyboard: true,
    },
};

const cancelMenu = {
    reply_markup: {
        keyboard: [["✅ Confirm Upload"], ["❌ Cancel"]],
        resize_keyboard: true,
    },
};

bot.on("message", async (msg) => {
    cre_dir();
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
        if (!userfiles[userId]) {
            userfiles[userId] = [];
            userphoto[userId] = [];
            download_file[userId] = [];
        }

        /* -------- COMMANDS -------- */

        if (text === "/start") {
            clearDirectoryItem(userId);
            return bot.sendMessage(chatId, "Welcome to PDF Tools Bot", mainMenu);
        }

        if (text === "PDF - Merge") userchoice[userId] = "merge_pdf";
        else if (text === "Compress PDF Size") userchoice[userId] = "compress_pdf_size";
        else if (text === "DOCX to PDF") userchoice[userId] = "docx_pdf";
        else if (text === "PPTX to PDF") userchoice[userId] = "pptx_pdf";
        else if (text === "Excel to PDF") userchoice[userId] = "excel_pdf";
        else if (text === "IMAGES to PDF") userchoice[userId] = "image_pdf";

        if (text === "❌ Cancel") {
            clearDirectoryItem(userId);
            return bot.sendMessage(chatId, "Cancelled", mainMenu);
        }

        if (
            ["merge_pdf", "compress_pdf_size", "docx_pdf", "pptx_pdf", "excel_pdf", "image_pdf"]
            .includes(userchoice[userId])
        ) {
            bot.sendMessage(chatId, "Upload file(s) and click ✅ Confirm Upload", cancelMenu);
        }

        /* -------- FILE HANDLING -------- */

        if (msg.document) {
            if (!userchoice[userId]) {
                return bot.sendMessage(chatId, "Please select an option first", mainMenu);
            }
            const fileUrl = await bot.getFileLink(msg.document.file_id);
            userfiles[userId].push({
                url: fileUrl,
                name: msg.document.file_name,
                mime: msg.document.mime_type
            });
        }

        /* -------- CONFIRM -------- */

        if (text === "✅ Confirm Upload") {
            if (userfiles[userId].length === 0) {
                return bot.sendMessage(chatId, "No files uploaded", mainMenu);
            }

            const waitMsg = await bot.sendMessage(chatId, "Processing... ⏳");

            const formData = new FormData();
            for (const file of userfiles[userId]) {
                if (
                    (userchoice[userId] === "merge_pdf" ||
                        userchoice[userId] === "compress_pdf_size") &&
                    file.mime !== "application/pdf"
                ) {
                    await bot.sendMessage(chatId, `❌ ${file.name} is not PDF`);
                    continue;
                }

                const localPath = path.join(download_dir, file.name);
                const res = await fetch(file.url);
                fs.writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
                download_file[userId].push(localPath);
                formData.append("files", fs.createReadStream(localPath));
            }

            let endpoint;
            if (userchoice[userId] === "merge_pdf")
                endpoint = `${process.env.server_api}/merge`;
            else if (userchoice[userId] === "compress_pdf_size")
                endpoint = `${process.env.server2_api}/compress-pdf_size`;
            else
                endpoint = `${process.env.server2_api}/office-to-pdf_converter`;

            try {
                const response = await axios.post(endpoint, formData, {
                    headers: formData.getHeaders(),
                    responseType: "arraybuffer",
                });

                const outputPath = path.join(
                    download_dir,
                    `result_${Date.now()}`
                );
                fs.writeFileSync(outputPath, response.data);

                await bot.deleteMessage(chatId, waitMsg.message_id);
                await bot.sendDocument(chatId, outputPath);
                await bot.sendMessage(chatId, "✅ Done", mainMenu);

                fs.unlinkSync(outputPath);
                clearDirectoryItem(userId);

            } catch (err) {
                console.error("BOT ERROR:", err.message);
                await bot.sendMessage(chatId, "❌ Server error. Try again.", mainMenu);
                clearDirectoryItem(userId);
            }
        }

    } catch (err) {
        console.error("GLOBAL ERROR:", err);
        bot.sendMessage(chatId, "⚠️ Unexpected error", mainMenu);
    }
});
