# PDF Tools Telegram Bot

## Project Overview
This repository contains a Telegram bot and two Node.js server applications for performing various PDF utilities and conversions.

- Main server: `server.js` (port 3000)
- Secondary server (Server 2): `Server 2/index.js` (port 3005)

## Features
### Main server (server.js)
- PDF merge (`/merge_pdf`)
- Save images to PDF (`/imagestopdf`)
- Convert PDF to PNG (`/pdftopng`)
- Convert PDF to DOCX (`/convert-pdf-to-word`)
- Split PDF (`/split-pdf`)
- OCR PDF (`/ocr_pdf`)
- AI chatbot endpoint (`/flexxpdf/aiChatbot`)

### Server 2 (Server 2/index.js)
- Office document to PDF (`/office-to-pdf_converter`)
- Compress PDF (`/compress-pdf_size`)
- Lock PDF with password (`/lock_pdf`)
- Unlock PDF with password (`/unlock_pdf`)

## Requirements
- Node.js >= 14
- npm
- `gs` (Ghostscript) for PDF compression in `Server 2`
- `qpdf` for lock/unlock PDF in `Server 2`

## Installation

From project root:
```bash
npm install
```

For Server 2:
```bash
cd "Server 2"
npm install
```

## Running

### Main server
```bash
node server.js
```

### Server 2
```bash
cd "Server 2"
node index.js
```

## API Examples

### Merge PDF (main server)
`POST /merge_pdf` with `multipart/form-data` field:
- `files` (multiple PDF files)

### Image to PDF (main server)
`POST /imagestopdf` with `files` images

### PDF to PNG (main server)
`POST /pdftopng` with `files` PDFs

### PDF to DOCX (main server)
`POST /convert-pdf-to-word` with `files` PDFs

### Split PDF (main server)
`POST /split-pdf` with `files` PDFs, body fields:
- `splitRange` (e.g. `1-3`)
- `mergePdf` (`true` or `false`)

### OCR PDF (main server)
`POST /ocr_pdf` with `files` PDFs

### Office to PDF (Server 2)
`POST /office-to-pdf_converter` with `files` office documents

### Compress PDF (Server 2)
`POST /compress-pdf_size` with `files` PDFs

### Lock PDF (Server 2)
`POST /lock_pdf` with `files` PDFs, body field:
- `password`

### Unlock PDF (Server 2)
`POST /unlock_pdf` with `files` PDFs, body field:
- `password`

## Directory Structure
```
pdf-tools_telegram-bot/
  .env
  package.json
  server.js
  client_bot.js
  routes/
  controler/
  Download/
  Uploads/
  "Server 2"/
    package.json
    index.js
    Download/
    Uploads/
```

## Notes
- Make sure the upload and download folders are writable.
- Temporary files are cleaned up after request completion.

## License
This project is provided as-is with no explicit license stated. Adapt as needed.
