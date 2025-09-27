FROM ubuntu:22.04 AS base

# Definir variável de ambiente para saída não bufferizada do Python
ENV PYTHONUNBUFFERED=1

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    poppler-utils \
    python3 \
    python3-pip \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Baixar o arquivo de treinamento do Tesseract
RUN wget https://github.com/tesseract-ocr/tessdata/raw/main/por.traineddata \
    -P /usr/share/tesseract-ocr/4.00/tessdata/

# Criar diretório da aplicação
WORKDIR /app

# Copiar requisitos do Python
COPY requirements.txt /app/

# Instalar dependências Python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copiar código fonte do serviço
COPY ocr_service.py /app/

# Criar usuário não root para execução do serviço
RUN useradd --no-create-home --uid 1000 ocruser && chown -R ocruser:ocruser /app

# Alternar para o usuário não privilegiado
USER ocruser

# Expor a porta do serviço
EXPOSE 6000

# Comando de execução
CMD ["gunicorn", "-w", "8", "-b", "0.0.0.0:6000", "ocr_service:app", "--timeout", "1000"]
