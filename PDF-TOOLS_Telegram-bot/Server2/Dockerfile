FROM node:20

# Install Ghostscript, LibreOffice, QPDF, Python, and pip
RUN apt-get update && apt-get install -y \
    ghostscript \
    libreoffice \
    qpdf \
    ca-certificates \
   # python3 \
   # python3-pip \
  #  python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install rembg using virtual environment (avoids externally-managed-environment error)
#RUN python3 -m venv /opt/venv
#ENV PATH="/opt/venv/bin:$PATH"
#RUN pip install --upgrade pip
#RUN pip install rembg[cli]

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
