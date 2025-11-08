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
            ["PDF - Merge", "IMAGES to PDF"],
            ["DOCX to PDF", "PPTX to PDF"],
            ["Excel to PDF" , "Compress PDF Size"],
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

        let waitMsg;
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
        } else if (text === "PPTX to PDF") {
            userchoice[userId] = "pptx_pdf";
            bot.sendMessage(
                chatId,
                "Upload PPTX file only. Make PPT and PPTX slideshows easy t view by converting them to pdf .",
                cancelMenu
            );
        } else if (text === "Excel to PDF") {
            userchoice[userId] = "excel_pdf";
            bot.sendMessage(
                chatId,
                "Upload EXCEL file only. Make EXCEL spreadsheet east to read by converting yhem to PDF.",
                cancelMenu
            );
        }else if (text === "Compress PDF Size") {
            userchoice[userId] = "compress-pdf_size";
            bot.sendMessage(
                chatId,
                "Upload PDF file only. Reduce PDF file size while optimizing for maximal PDF quality .",
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
            const photo = msg.photo[msg.photo.length - 1];
            const photo_fileId = photo.file_id;
            // let photo_fileName = 
            const photo_fileUrl = await bot.getFileLink(photo_fileId);

            userphoto[userId].push({
                fileid: photo_fileId,
                url: photo_fileUrl,
                name: `photo_pdf_${photo_fileId}_${Math.random() * 10}_${Date.now()}.jpg`
            });
        }


        if (msg.text === "✅ Conform Upload") {
            cre_dir();
            bot.sendMessage(chatId, "Confirmed ✅", mainMenu);
            userchoice2[userId] = "✅ Conform Upload";

            if (userchoice[userId] === "image_pdf") {
                if (userphoto[userId].length === 0) {
                    return bot.sendMessage(chatId, "Please upload images to convert it into pdf.", mainMenu);
                }
                waitMsg = await bot.sendMessage(chatId, "Please wait few minutes ⌚ for server response.", mainMenu);

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

            } else {
                // else if (["merge_pdf", "docx_pdf", "pptx_pdf", "excel_pdf"].includes(userchoice[userId])) {
                if (userfiles[userId].length === 0) {
                    return bot.sendMessage(chatId, "Please upload file.", mainMenu);
                }
                if (userchoice[userId] === "merge_pdf" && userfiles[userId].length < 2) {
                    return bot.sendMessage(chatId, "please upload atleast 2 or more pdf file to merge .", mainMenu);
                }
                waitMsg = await bot.sendMessage(chatId, "Please wait few minutes ⌚ for server response.", mainMenu);

                for (const element of userfiles[userId]) {
                    if (["merge_pdf", "compress-pdf_size"].includes(userchoice[userId])) {
                        if (element.mime !== "application/pdf") {
                            bot.sendMessage(chatId, `⚠️ (${element.name}) is not a PDF file.`);
                            continue;
                        }
                    } else if (userchoice[userId] === "docx_pdf") {
                        if (element.mime !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                            bot.sendMessage(chatId, `⚠️ (${element.name}) is not a docx file.`);
                            continue;
                        }
                    } else if (userchoice[userId] === "pptx_pdf") {
                        if (element.mime !== "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
                            bot.sendMessage(chatId, `⚠️ (${element.name}) is not a PPT file.`);
                            continue;
                        }
                    } else if (userchoice[userId] === "excel_pdf") {
                        if (![
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ,
                            "application/vnd.ms-excel.sheet.macroEnabled.12",
                            "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
                            "application/vnd.ms-excel",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
                            "application/vnd.ms-excel.template.macroEnabled.12",
                            "text/csv"
                        ].includes(element.mime)) {
                            bot.sendMessage(chatId, `⚠️ (${element.name}) is not a Excel file.`);
                            continue;
                        }
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
                    let office_filename;
                    if (userchoice[userId] === "docx_pdf") {
                        office_filename = "docx to pdf_convert";
                    } else if (userchoice[userId] === "pptx_pdf") {
                        office_filename = "pptx to pdf_convert";
                    } else if (userchoice[userId] === "excel_pdf") {
                        office_filename = "excel to pdf_convert";
                    }

                    
                    if (userchoice[userId] === "merge_pdf") {
                        endpoint = `${process.env.server_api}/merge`;
                        outputFilePath = path.join(download_dir, `Merged_${Date.now()}.pdf`);

                    } else if (["docx_pdf", "pptx_pdf", "excel_pdf"].includes(userchoice[userId])) {
                        endpoint = `${process.env.server2_api}/office-to-pdf_converter`;
                        if (download_file[userId].length >= 2) {
                            outputFilePath = path.join(download_dir, `${office_filename}_${Date.now()}.zip`);
                        } else {
                            outputFilePath = path.join(download_dir, `${office_filename}_${Date.now()}.pdf`);
                        }
                    }else if (userchoice[userId] === "compress-pdf_size") {
                        endpoint = `${process.env.server2_api}/compress-pdf_size`;
                        if (download_file[userId].length >= 2) {
                            outputFilePath = path.join(download_dir, `compress-pdf_size_${Date.now()}.zip`);
                        } else {
                            outputFilePath = path.join(download_dir, `compress-pdf_size_${Date.now()}.pdf`);
                        }
                    }

                    const serverResponse = await axios.post(endpoint, formData, {
                        headers: formData.getHeaders(),
                        responseType: "arraybuffer"
                    });

                    if (response.ok) {
                        console.log("server response is ok");
                    }
                    fs.writeFileSync(outputFilePath, serverResponse.data);
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

            }
        }

    } catch (error) {
        console.error(error);
        bot.sendMessage(msg.chat.id, "⚠️ Error processing files.", mainMenu);
    }
});
