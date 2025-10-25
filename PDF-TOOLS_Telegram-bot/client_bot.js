require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fetch = require('node-fetch');
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const bot = new TelegramBot(process.env.telegram_bot_api, { polling: true });
const download_dir = path.join(__dirname, "bot_download");

function cre_dir() {
    if (!fs.existsSync(download_dir)) fs.mkdirSync(download_dir);
}

let userchoice = {};
let userchoice2 = {};
let userfiles = {};
let userphoto = {};
let download_file = {};

const mainMenu = {
    reply_markup: {
        keyboard: [
            ["PDF - Merge", "DOCX to PDF"],
            ["IMAGES to PDF", "PDF to IMAGES"],
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
        const userId = await msg.from.id;
        const chatId = msg.chat.id;
        const text = msg.text;

        let waitMsg ;
        let endpoint;
        let outputFilePath;
        const formData = new FormData();

        if (!userfiles[userId]) {
            userfiles[userId] = [];
            userphoto[userId] = [];
            download_file[userId] = [];
        }

        if (text === "/start") {
            bot.sendMessage(chatId, "Welcome to PDF-Tools bot.", mainMenu);
            userchoice[userId] = null
            userchoice2[userId] = null;
            userfiles[userId] = [];
            userphoto[userId] = [];
            download_file[userId] = [];
            for (const f of fs.readdirSync(download_dir)) {
                fs.unlinkSync(path.join(download_dir, f));
            }

        } else if (text === "PDF - Merge") {
            userchoice[userId] = "merge_pdf";
            bot.sendMessage(
                chatId,
                "Upload at least 2 or more PDF files that you want to merge.",
                cancelMenu
            );
        } else if (text === "DOCX to PDF") {
            userchoice[userId] = "docx_pdf";
            bot.sendMessage(
                chatId,
                "Upload DOCX file only. Make DOC and DOCX files easy to read by converting them to PDF.",
                cancelMenu
            );
        } else if (text === "IMAGES to PDF") {
            userchoice[userId] = "image_pdf";
            bot.sendMessage(
                chatId,
                "Upload image file (jpg or png). Convert images to PDF.",
                cancelMenu
            );
        } else if (text === "PDF to IMAGES") {
            userchoice[userId] = "pdf_png";
            bot.sendMessage(
                chatId,
                "Upload PDF file only. Convert each PDF page into JPG format.",
                cancelMenu
            );
        } else if (text === "❌ Cancel") {
            bot.sendMessage(chatId, "Cancelling.", mainMenu);
            userchoice[userId] = null
            userchoice2[userId] = null;
            userfiles[userId] = [];
            userphoto[userId] = [];
            download_file[userId] = [];
            await fs.promises.rm(download_dir, { recursive: true, force: true })
        } else{
            return bot.sendMessage(chatId, "Unknown message or Commmand !", mainMenu);
        }

        if (msg.document) {
            cre_dir();
            if (!userchoice[userId]) {
                return bot.sendMessage(chatId, "Please choose an option from the menu first.", mainMenu);
            }
            const fileId = msg.document.file_id;
            const fileName = msg.document.file_name;
            const mimeType = msg.document.mime_type;
            const fileUrl = await bot.getFileLink(fileId);

            userfiles[userId].push({
                fileid: fileId,
                url: fileUrl,
                name: fileName,
                mime: mimeType
            });

        } else if (msg.photo && userchoice[userId] === "image_pdf") {
            cre_dir();
            if (!userchoice[userId]) {
                return bot.sendMessage(chatId, "Please choose an option from the menu first.", mainMenu);
            }
            const photo = msg.photo[msg.photo.length-1];
            const photo_fileId = photo.file_id;
            // let photo_fileName = 
            const photo_fileUrl = await bot.getFileLink(photo_fileId);

            userphoto[userId].push({
                fileid: photo_fileId,
                url: photo_fileUrl,
                name: `photo_pdf_${photo_fileId}_${Math.random()*10}_.jpg`
            });
        }


        if (msg.text === "✅ Conform Upload") {
            cre_dir();
            bot.sendMessage(chatId, "Confirmed ✅",mainMenu);
            userchoice2[userId] = "✅ Conform Upload";

            if (userchoice[userId] === "merge_pdf") {
                if (userfiles[userId].length === 0) {
                    return bot.sendMessage(chatId, "Please upload file.", mainMenu);
                }
                if (userfiles[userId].length < 2) {
                    return bot.sendMessage(chatId, "please upload atleast 2 or more pdf file to merge .", mainMenu);
                }
                waitMsg = await bot.sendMessage(chatId, "Please wait few minutes ⌚ for server response.",mainMenu);

                for (const element of userfiles[userId]) {
                    if (element.mime !== "application/pdf") {
                        bot.sendMessage(chatId, `❌ (${element.name}) is not a PDF file.`);
                        continue;
                    }

                    const localFilePath = path.join(download_dir, element.name);
                    const response = await fetch(element.url);
                    const buffer = Buffer.from(await response.arrayBuffer())
                    fs.writeFileSync(localFilePath, buffer);
                    download_file[userId].push(localFilePath);
                }
                for (const f of download_file[userId]) {
                    formData.append("files", fs.createReadStream(f));
                }

                try {
                    endpoint = `${process.env.server_api}/merge`;
                    outputFilePath = path.join(download_dir, `Merged_${Date.now()}.pdf`);

                    const serverResponse = await axios.post(endpoint, formData, {
                        headers: formData.getHeaders(),
                        responseType: "arraybuffer"
                    });

                    fs.writeFileSync(outputFilePath, serverResponse.data);
                    await bot.deleteMessage(chatId, waitMsg.message_id);
                    await bot.sendDocument(chatId, outputFilePath, {}, { contentType: "images/jpg" });
                    bot.sendMessage(chatId, "Done ✅", mainMenu);

                    userfiles[userId] = [];
                    download_file[userId] = [];
                    userchoice[userId] = null;
                    userchoice2[userId] = null;
                    await fs.promises.rm(download_dir, { recursive: true, force: true })

                } catch (error) {
                    userfiles[userId] = [];
                    download_file[userId] = [];
                    userchoice[userId] = null;
                    userchoice2[userId] = null;
                    await fs.promises.rm(download_dir, { recursive: true, force: true })
                }

            } else if (userchoice[userId] === "docx_pdf") {
                if (userfiles[userId].length === 0) {
                    return bot.sendMessage(chatId, "Please upload file.", mainMenu);
                }
                waitMsg = await bot.sendMessage(chatId, "Please wait few minutes ⌚ for server response.",mainMenu);

                for (const element of userfiles[userId]) {
                    if (element.mime !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                        bot.sendMessage(chatId, `❌ (${element.name}) is not a docx file.`);
                        continue;
                    }

                    const localFilePath = path.join(download_dir, element.name);
                    const response = await fetch(element.url);
                    const buffer = Buffer.from(await response.arrayBuffer())
                    fs.writeFileSync(localFilePath, buffer);
                    download_file[userId].push(localFilePath);
                }
                for (const f of download_file[userId]) {
                    formData.append("docx_pdf", fs.createReadStream(f));
                }

                try {
                    endpoint = `${process.env.server_api}/docxtopdf`;

                    if (download_file[userId].length >= 2) {
                        outputFilePath = path.join(download_dir, `Docx_to_PDF_${Date.now()}.zip`);
                    } else {
                        outputFilePath = path.join(download_dir, `Docx_to_PDF_${Date.now()}.pdf`);
                    }

                    const serverResponse = await axios.post(endpoint, formData, {
                        headers: formData.getHeaders(),
                        responseType: "arraybuffer",
                    });

                    fs.writeFileSync(outputFilePath, serverResponse.data);
                    await bot.deleteMessage(chatId, waitMsg.message_id);
                    await bot.sendDocument(chatId, outputFilePath, {}, { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
                    bot.sendMessage(chatId, "Done ✅", mainMenu);

                    userfiles[userId] = [];
                    download_file[userId] = [];
                    userchoice[userId] = null;
                    userchoice2[userId] = null;
                    await fs.promises.rm(download_dir, { recursive: true, force: true })

                } catch (error) {
                    userfiles[userId] = [];
                    download_file[userId] = [];
                    userchoice[userId] = null;
                    userchoice2[userId] = null;
                    await fs.promises.rm(download_dir, { recursive: true, force: true })
                }

            } else if (userchoice[userId] === "pdf_png") {
                if (userfiles[userId].length === 0) {
                    return bot.sendMessage(chatId, "Please upload file.", mainMenu);
                }
                waitMsg = await bot.sendMessage(chatId, "Please wait few minutes ⌚ for server response.",mainMenu);

                for (const element of userfiles[userId]) {
                    if (element.mime !== "application/pdf") {
                        bot.sendMessage(chatId, `❌ (${element.name}) is not a PDF file.`);
                        continue;
                    }

                    const localFilePath = path.join(download_dir, element.name);
                    const response = await fetch(element.url);
                    const buffer = Buffer.from(await response.arrayBuffer())
                    fs.writeFileSync(localFilePath, buffer);
                    download_file[userId].push(localFilePath);
                }
                for (const f of download_file[userId]) {
                    formData.append("pdf_png", fs.createReadStream(f));
                }

                try {
                    endpoint = `${process.env.server_api}/pdftopng`;
                    outputFilePath = path.join(download_dir, `PDF_to_Images_${Date.now()}.zip`);

                    const serverResponse = await axios.post(endpoint, formData, {
                        headers: formData.getHeaders(),
                        responseType: "arraybuffer"
                    });

                    await fs.writeFileSync(outputFilePath, serverResponse.data);
                    await bot.deleteMessage(chatId, waitMsg.message_id);
                    await bot.sendDocument(chatId, outputFilePath, {}, { contentType: "application/pdf" });
                    bot.sendMessage(chatId, "Done ✅", mainMenu);

                    userfiles[userId] = [];
                    download_file[userId] = [];
                    userchoice[userId] = null;
                    userchoice2[userId] = null;
                    await fs.promises.rm(download_dir, { recursive: true, force: true })

                } catch (error) {
                    userfiles[userId] = [];
                    download_file[userId] = [];
                    userchoice[userId] = null;
                    userchoice2[userId] = null;
                    await fs.promises.rm(download_dir, { recursive: true, force: true })
                }

            } else if (userchoice[userId] === "image_pdf") {
                if (userphoto[userId].length === 0) {
                    return bot.sendMessage(chatId, "Please upload images to convert it into pdf.", mainMenu);
                }
                waitMsg = await bot.sendMessage(chatId, "Please wait few minutes ⌚ for server response.",mainMenu);

                for (const element of userphoto[userId]) {
                    const localFilePath = path.join(download_dir, element.name);
                    const response = await fetch(element.url);
                    const buffer = Buffer.from(await response.arrayBuffer())
                    fs.writeFileSync(localFilePath, buffer);
                    download_file[userId].push(localFilePath);
                }
                for (const f of download_file[userId]) {
                    formData.append("files", fs.createReadStream(f));
                }

                try {
                    endpoint = `${process.env.server_api}/imagetopdf`;
                    outputFilePath = path.join(download_dir, `Images_to_PDF_${Date.now()}.pdf`);

                    const serverResponse = await axios.post(endpoint, formData, {
                        headers: formData.getHeaders(),
                        responseType: "arraybuffer"
                    });

                    await fs.writeFileSync(outputFilePath, serverResponse.data);
                    await bot.deleteMessage(chatId, waitMsg.message_id);
                    await bot.sendDocument(chatId, outputFilePath, {}, { contentType: "application/pdf" });
                    bot.sendMessage(chatId, "Done ✅", mainMenu);

                    userphoto[userId] = [];
                    download_file[userId] = [];
                    userchoice[userId] = null;
                    userchoice2[userId] = null;
                    await fs.promises.rm(download_dir, { recursive: true, force: true })

                } catch (error) {
                    userphoto[userId] = [];
                    download_file[userId] = [];
                    userchoice[userId] = null;
                    userchoice2[userId] = null;
                    await fs.promises.rm(download_dir, { recursive: true, force: true })
                }
            }
        }

    } catch (error) {
        console.error(error);
        bot.sendMessage(msg.chat.id, "⚠️ Error processing files.", mainMenu);
    }
});
