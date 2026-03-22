# Pdf-tools Repository

This repository includes two separate PDF utility projects:

1. `pdf-tools_telegram-bot` (Node.js Express bot + API)
2. `react/React-pdf-tools` (React + Vite PDF utilities frontend)

Repository URL: https://github.com/Akshatpatel004/Pdf-tools

## Project 1: pdf-tools_telegram-bot

Path: `pdf-tools_telegram-bot/`

### Main server (`server.js`) - port 3000
- `/merge_pdf`: Merge PDFs
- `/imagestopdf`: Images to PDF
- `/pdftopng`: PDF to PNG
- `/convert-pdf-to-word`: Convert PDF to DOCX (Cloudmersive)
- `/split-pdf`: Split PDF
- `/ocr_pdf`: OCR on PDF
- `/flexxpdf/aiChatbot`: AI chatbot route

### Server 2 (`Server 2/index.js`) - port 3005
- `/office-to-pdf_converter`: Office to PDF (office-to-pdf)
- `/compress-pdf_size`: Ghostscript PDF compression
- `/lock_pdf`: Password-lock PDF (qpdf)
- `/unlock_pdf`: Password-unlock PDF (qpdf)

### Requirements
- Node.js >= 14
- npm
- `gs` (Ghostscript) for PDF compression
- `qpdf` for lock/unlock endpoints

### Install
```bash
cd pdf-tools_telegram-bot
npm install
cd "Server 2"
npm install
```

### Run
```bash
cd pdf-tools_telegram-bot
node server.js
# in another shell:
cd "Server 2"
node index.js
```

## Project 2: React-pdf-tools

Path: `react/React-pdf-tools/`

A Vite + React project for implementing PDF tools on the frontend.

### Install
```bash
cd react/React-pdf-tools
npm install
```

### Run
```bash
cd react/React-pdf-tools
npm run dev
```

## Directory overview
```
Website/
  pdf-tools_telegram-bot/
    server.js
    Server 2/index.js
    ...
  javascript/react/React-pdf-tools/
    src/
    package.json
    ...
```

## Notes
- Ensure writable `Uploads` and `Download` directories.
- Use `.env` in `pdf-tools_telegram-bot` for any secrets.
- The root README is now the entry point for GitHub docs.
