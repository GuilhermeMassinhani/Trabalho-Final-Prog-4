# Use uma imagem base do Python
FROM python:3.12-slim

# Defina variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Instale dependências do sistema necessárias para o Python e a aplicação
RUN apt-get update && \
    apt-get install -y \
    gcc \
    libpq-dev \
    libgl1 \
    libglib2.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copie o arquivo de dependências
COPY ../pyproject.toml ../poetry.lock ./

# Instale o Poetry e dependências do projeto
RUN pip install --upgrade pip && \
    pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

# Instale python-dotenv e Gunicorn (para produção)
RUN pip install python-dotenv gunicorn

# Copie o restante do código do aplicativo
COPY . /app

# Exponha a porta 5000
EXPOSE 5000

# Use o Gunicorn para rodar o app em produção
CMD ["gunicorn", "-w", "8", "-b", "0.0.0.0:5000", "automacao.app:app", "--timeout", "1000"]




#  docker build -t doc_analyzer --platform linux/amd64 .
#  docker build -t "doc_analyzer" .
#  docker run -it --name docanalyzerapp -p 5000:5000 doc_analyzer:latest
#  sudo docker run -d --name docanalyzerapp -p 5000:5000 doc_analyzer:latest (-d modo desanexado)
#  docker save -o doc_analyzer.tar doc_analyzer
#  sudo docker load -i doc_analyzer.tar
#  sudo docker logs -f docanalyzerapp
#  sudo docker exec -it docanalyzerapp /bin/bash