FROM node:20

# Install Ghostscript and LibreOffice (required for office-to-pdf)
RUN apt-get update && apt-get install -y \
    ghostscript \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]