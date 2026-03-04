FROM node:20

# Install Ghostscript, LibreOffice, and QPDF
RUN apt-get update && apt-get install -y \
    ghostscript \
    libreoffice \
    qpdf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 3005

# Start the application
CMD ["node", "index.js"]