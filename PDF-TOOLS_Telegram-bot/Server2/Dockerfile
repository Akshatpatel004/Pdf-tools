FROM node:20

# 1. Install System Dependencies (Ghostscript, LibreOffice, QPDF, and Python)
RUN apt-get update --fix-missing && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ghostscript \
    libreoffice \
    qpdf \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*


# imstall python package rembg start
RUN pip3 install --no-cache-dir "rembg[cpu,cli]" --break-system-packages
RUN python3 -c "from rembg import new_session; new_session('u2net')"
# finish downloading python package

# 4. Set the working directory
WORKDIR /app

# 5. Copy Node.js dependency files and install
COPY package*.json ./
RUN npm install

# 6. Copy the rest of the application code
COPY . .

# 7. Expose the application port
EXPOSE 3005

# 8. Start the application
CMD ["node", "index.js"]