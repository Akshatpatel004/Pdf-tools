require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const firestoreDB = require("../firebase-setup");
const tools = require("./telegram-data.json");
const { log } = require("console");

const bot = new TelegramBot(process.env.telegram_bot_api, { polling: true });
const download_dir = path.join(__dirname, "bot_download");


// ---------------- Save User Info ----------------
async function saveUser(msg) {
    const userId = msg.from.id;

    const docRef = firestoreDB.collection("TelegramBotUsers").doc(userId);

    const docsnap = await docRef.get();

    if (!docsnap.exists) {
        await docRef.set({
            userId : userId,
            userName : msg.from.username || "",
            firstName : msg.from.first_name || "",
            createAt : new Date()
        }); 
    }
}

// ---------------- USER STATE ----------------
let userchoice = {};
let userfiles = {};
let userphoto = {};
let download_file = {};

// ---------------- INIT ----------------
function cre_dir() {
    if (!fs.existsSync(download_dir)) {
        fs.mkdirSync(download_dir, { recursive: true });
    }
}

function minetype_routename(userchoice) {
    const imageAcceptRoute=["image_pdf" , "bgImage_remove"];
    if (userchoice === "excel_pdf") {
        return [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
            "application/vnd.ms-excel.template.macroEnabled.12",
            "text/csv"
        ];
    } else if (imageAcceptRoute.includes(userchoice)) {
        return ["image/png", "image/jpeg", "image/jpg"];
    }
    return [];
}

async function clearDirectoryItem(userId) {
    if (!download_file[userId]) return;

    for (const file of download_file[userId]) {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    }

    userfiles[userId] = [];
    userphoto[userId] = [];
    download_file[userId] = [];
    userchoice[userId] = null;
}

// ---------------- TOOL MAP ----------------
const toolMap = {};
const toolByChoice = {};

tools.forEach(t => {
    toolMap[t.keyboard] = t;
    toolByChoice[t.userchoice] = t;
});

// ---------------- DYNAMIC KEYBOARD ----------------
let keyboardArr = [];
for (let i = 0; i < tools.length; i += 2) {
    if (tools[i + 1]) {
        keyboardArr.push([tools[i].keyboard, tools[i + 1].keyboard]);
    } else {
        keyboardArr.push([tools[i].keyboard]);
    }
}

const mainMenu = {
    reply_markup: {
        keyboard: keyboardArr,
        resize_keyboard: true,
    },
};

const cancelMenu = {
    reply_markup: {
        keyboard: [["✅ Conform Upload"], ["❌ Cancel"]],
        resize_keyboard: true,
    },
};

// ---------------- BOT LOGIC ----------------
bot.on("message", async (msg) => {
    cre_dir();
    await saveUser(msg);

    try {
        const userId = msg.from.id;
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!userfiles[userId]) {
            userfiles[userId] = [];
            userphoto[userId] = [];
            download_file[userId] = [];
        }

        // -------- START --------
        if (text === "/start") {
            await clearDirectoryItem(userId);
            return bot.sendMessage(chatId, "Welcome to FlexXPdf Bot.", mainMenu);
        }

        // -------- TOOL SELECT (DYNAMIC) --------
        if (toolMap[text]) {
            const tool = toolMap[text];
            userchoice[userId] = tool.userchoice;

            return bot.sendMessage(chatId, tool.msg, cancelMenu);
        }

        
        //-------- Broadcast Message by Admin --------
        if (text && text.startsWith("/broadcast")) {
            
            // check is admin or not
            if (userId.toString() !== process.env.Admin_UserId.toString()) {
                return bot.sendMessage(chatId, "❌ Invalid option. Please select from menu 👇", mainMenu );
            }

            // Extract message
            const broadcastMsg = text.replace("/broadcast" , "").trim();

            if (!broadcastMsg) {
                return bot.sendMessage(chatId, "⚠️ Please provide Broadcast Message", mainMenu );
            }

            bot.sendMessage(chatId , "Broadcasting...");
            try {
                const snapshot = await firestoreDB.collection("TelegramBotUsers").get();

                let success = 0;
                let failed = 0;

                for (const doc of snapshot.docs){
                    const user = doc.data();
                    
                    try {
                        await bot.sendMessage(user.userId , broadcastMsg);
                        success++;
                        await new Promise(res => setTimeout(res ,50));
                    } catch (error) {
                        failed++;
                    }
                }

                bot.sendMessage(chatId , `✅ Broadcast Done \n Success:- ${success} \n Failed:- ${failed}`);

            } catch (error) {
                console.log(error);
                bot.sendMessage(chatId , `❌ Broadcast Failed`);
            }
            return;
        }


        //-------- Not a Valid Message --------
        if (!toolMap[text] && text !== "/start" && text !== "❌ Cancel" && text !== "✅ Conform Upload" && !msg.document && !msg.photo ) {
            await clearDirectoryItem(userId);
            return bot.sendMessage(chatId, "❌ Invalid option. Please select from menu 👇", mainMenu );
        }

        // -------- CANCEL --------
        if (text === "❌ Cancel") {
            await clearDirectoryItem(userId);
            return bot.sendMessage(chatId, "Operation cancelled ❌", mainMenu);
        }

        // -------- FILE UPLOAD --------
        if (msg.document) {
            if (!userchoice[userId]) {
                return bot.sendMessage(chatId, "Select option first.", mainMenu);
            }

            const fileUrl = await bot.getFileLink(msg.document.file_id);

            if (userchoice[userId] === "image_pdf") {
                userphoto[userId].push({
                    url: fileUrl,
                    name: `photo_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`,
                    mime: msg.document.mime_type
                });
            } else {
                userfiles[userId].push({
                    url: fileUrl,
                    name: msg.document.file_name,
                    mime: msg.document.mime_type
                });
            }
        }

        // -------- IMAGE UPLOAD --------
        if (msg.photo) {
            if (!userchoice[userId]) {
                return bot.sendMessage(chatId, "Select option first.", mainMenu);
            }
            if (userchoice[userId] !== "image_pdf") return;

            const photo = msg.photo[msg.photo.length - 1];
            const photoUrl = await bot.getFileLink(photo.file_id);

            userphoto[userId].push({
                url: photoUrl,
                name: `photo_${Date.now()}.jpg`,
                mime: "image/jpeg"
            });
        }

        // -------- PROCESS --------
        if (text === "✅ Conform Upload") {
            if (!userchoice[userId]) return;

            const selectedTool = toolByChoice[userchoice[userId]];
            const waitMsg = await bot.sendMessage(chatId, "Processing your files... Please wait ⌚");

            try {
                const targetFiles =
                    userchoice[userId] === "image_pdf"
                        ? userphoto[userId]
                        : userfiles[userId];

                if (!targetFiles.length) {
                    await bot.deleteMessage(chatId, waitMsg.message_id);
                    return bot.sendMessage(chatId, "No files uploaded.", mainMenu);
                }

                // -------- MIME CHECK --------
                const allowedExtraTypes = minetype_routename(userchoice[userId]) || [];
                for (const file of targetFiles) {

                    const isValidMain = selectedTool.minetype ? file.mime === selectedTool.minetype : false;
                    const isValidExtra = Array.isArray(allowedExtraTypes) ? allowedExtraTypes.includes(file.mime) : false;

                    if (!isValidMain && !isValidExtra) {
                        bot.sendMessage(
                            chatId,
                            `❌ (${file.name}) ${selectedTool.unknownFilemsg}`
                        );
                        targetFiles.splice(targetFiles.indexOf(file),1);
                    }
                }

                // -------- DOWNLOAD FILES --------
                const formData = new FormData();

                for (const file of targetFiles) {
                    const localPath = path.join(download_dir, file.name);

                    const res = await fetch(file.url);
                    const buffer = Buffer.from(await res.arrayBuffer());

                    fs.writeFileSync(localPath, buffer);
                    download_file[userId].push(localPath);

                    formData.append("files", fs.createReadStream(localPath));
                }

                // -------- API --------
                const baseURL =
                    selectedTool.api === 1
                        ? process.env.server_api
                        : process.env.server2_api;

                const endpoint = `${baseURL}${selectedTool.action}`;

                const extension =
                    targetFiles.length >= 2
                        ? selectedTool.downloadType2
                        : selectedTool.downloadType1;

                const outputFilePath = path.join(
                    download_dir,
                    `${selectedTool.outputFilePath}${Date.now()}${extension}`
                );

                const response = await axios.post(endpoint, formData, {
                    headers: formData.getHeaders(),
                    responseType: "arraybuffer",
                    timeout: 120000,
                });

                fs.writeFileSync(outputFilePath, response.data);

                await bot.deleteMessage(chatId, waitMsg.message_id);
                await bot.sendDocument(chatId, outputFilePath);

                bot.sendMessage(chatId, "Done ✅", mainMenu);

                if (fs.existsSync(outputFilePath)) {
                    fs.unlinkSync(outputFilePath);
                }

            } catch (err) {
                console.error(err);
                await bot.deleteMessage(chatId, waitMsg.message_id);
                bot.sendMessage(chatId, "Error processing file ⚠️", mainMenu);
            } finally {
                await clearDirectoryItem(userId);
            }
        }

    } catch (err) {
        console.error("Global Error:", err);
    }
});