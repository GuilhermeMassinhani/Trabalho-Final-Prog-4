import PyPDF2
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
import os
import psycopg2
import re
import pytesseract
from PIL import Image
import pdf2image
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pdf2image import convert_from_path
import cv2
import requests
import numpy as np
from flask import send_from_directory


app = Flask(__name__)

CORS(app)
app.config['UPLOAD_FOLDER'] = './automacao/uploads'

OCR_URL = "http://ocr:6000/ocr"  # Serviço OCR

# Carregar variáveis de ambiente do arquivo .env
load_dotenv('./data.env')

# Rota para a página inicial
@app.route('/')
def index():
    return render_template('index.html')

# Função para remover formatação de caracteres especiais nos documentos.
# Uyiliza a função re.sub da biblioteca re (regular expressions)
def remove_formatting(document_number):
    return re.sub(r'\D', '', document_number)

# Pré processa o texto do pdf, capturando apenas os dados que se se enquadrem na formatação
def preprocess_text(text):
    # Substitui múltiplos espaços seguidos por um único espaço
    text = re.sub(r'\s{2,}', ' ', text)
    
    # Combina números separados por até 4 caracteres de espaço
    text = re.sub(r'(\d)(\s{1,4})(\d)', r'\1\3', text)
    
    return text.strip()

#  Aplica pré-processamento na imagem para melhorar o OCR.
def preprocess_image(image):
    """
    Aplica pré-processamento na imagem para melhorar o OCR.
    """
    # Converter para escala de cinza
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)

    # Binarização (converter para preto e branco)
    _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    
    # Redimensionar para aumentar a qualidade
    resized = cv2.resize(binary, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)

    return resized


# Extrai o texto do documento utilizando o OCR
def extract_text_with_ocr(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            response = requests.post(OCR_URL, files={'file': file})
        response.raise_for_status()  # Levanta uma exceção para códigos de erro HTTP
        return response.json().get("text", "")
    except requests.exceptions.RequestException as e:
        print(f"Erro no serviço OCR: {e}")
        return "Erro ao extrair texto via OCR."

def extract_text_from_pdf(pdf_path, password=None):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)

            if not reader.pages:
                print(f"PDF sem páginas acessíveis: {pdf_path}")
                return extract_text_with_ocr(pdf_path)

            text = ''
            for page_num, page in enumerate(reader.pages):
                try:
                    page_text = page.extract_text()
                    text += page_text if page_text else ""
                except Exception as e:
                    print(f"Erro ao extrair texto da página {page_num}: {e}")
                    continue

            if not text.strip():
                print("Nenhum texto válido encontrado, tentando OCR...")
                text = extract_text_with_ocr(pdf_path)
            return text
    except Exception as e:
        print(f"Erro geral ao processar o PDF {pdf_path}: {e}")
        return extract_text_with_ocr(pdf_path)

def is_text_corrupted(text):
    non_alpha_numeric_chars = sum(not char.isalnum() for char in text)
    return non_alpha_numeric_chars > len(text) * 0.5


# Análisa os documentos buscando os CPF'S/CNPJ'S
def analyze_uploaded_documents(files):
    document_data = []
    document_descriptions = []
    no_cpf_cnpj_docs = []
    
    cpf_part_regex = r"(?<!\d)\b\d{3}\.\d{3}\.\d{3}-\d{2}\b(?!\d)"
    cnpj_part_regex = r"(?<!\d)\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b(?!\d)"

    
    for file in files:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        if filename.lower().endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                text_lines = f.readlines()
        elif filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_path)
            text_lines = text.splitlines()
        else:
            continue

        cpf_numbers = []
        cnpj_numbers = []
        document_text = ""
        
        for line in text_lines:
            document_text += line + " "  # Combina as linhas para manter o contexto
            
            # Verificar uma linha abaixo para CPF/CNPJ
            if re.search(cpf_part_regex, line):
                cpf_matches = re.findall(cpf_part_regex, line)
                cpf_numbers.extend([remove_formatting(cpf) for cpf in cpf_matches])
            if re.search(cnpj_part_regex, line):
                cnpj_matches = re.findall(cnpj_part_regex, line)
                cnpj_numbers.extend([remove_formatting(cnpj) for cnpj in cnpj_matches])

        description = f"{filename}, {preprocess_text(' '.join(text_lines[:5]))[:200]}"  # Extrai os 200 primeiros caracteres das primeiras linhas
        document_descriptions.append({
            "document": filename,
            "description": description,
            "cpf_numbers": cpf_numbers if cpf_numbers else [],  # Lista vazia se não encontrar CPFs
            "cnpj_numbers": cnpj_numbers if cnpj_numbers else []  # Lista vazia se não encontrar CNPJs
        })

        if not cpf_numbers and not cnpj_numbers:
            no_cpf_cnpj_docs.append(filename)
        
        # Adiciona CPFs e CNPJs ao document_data com referência ao ofício
        for doc_number in cpf_numbers + cnpj_numbers:
            document_data.append({
                "document_number": doc_number,
                "source_office": filename
            })
    
    return document_data, document_descriptions, no_cpf_cnpj_docs


# Busca no banco de dados pelos documentos encontrados
def query_database(document_data):
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT")
        )
    except psycopg2.OperationalError as e:
        print(f"Erro na conexão com o banco de dados: {e}")
        return []
    
    cur = conn.cursor()

    document_numbers = [doc['document_number'] for doc in document_data]
    query = """

    INSERIR QUERY BDD

    """
    
    if document_numbers:
        cur.execute(query, (tuple(document_numbers),))
        results = cur.fetchall()
    else:
        results = []

    cur.close()
    conn.close()

    # Interliga os resultados do banco de dados com o ofício de origem
    final_results = []
    for row in results:
        doc_number = row[1]
        matching_offices = [doc['source_office'] for doc in document_data if doc['document_number'] == doc_number]
        final_results.append({
            "nome": row[0],
            "documento": doc_number,
            "conta": row[2] or "Não possui conta",
            "oficios": matching_offices  # Adiciona os números dos ofícios correspondentes
        })

    return final_results

# Rota para upload e análise de arquivos
@app.route('/upload', methods=['POST'])
def upload_files():

    if 'files[]' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
    
    files = request.files.getlist('files[]')
    
    if not files:
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400

    # Analisar os arquivos enviados e capturar os três valores retornados
    document_data, document_descriptions, no_cpf_cnpj_docs = analyze_uploaded_documents(files)
    
    # Consultar o banco de dados com base nos documentos extraídos
    results = query_database(document_data)
    
    # Retornar os dados corretamente
    return jsonify({
        "results": results,  # Lista de pessoas encontradas
        "document_descriptions": document_descriptions,  # Descrições dos documentos
        "no_cpf_cnpj_docs": no_cpf_cnpj_docs  # Documentos sem CPF/CNPJ
    })

# EndPoint para campo de busca, buscando o documento digitado no banco de dados
@app.route('/search', methods=['GET'])
def search_documents():
    # Obter os números enviados na query string
    document_numbers = request.args.get('document_number', None)

    if not document_numbers:
        return jsonify({"error": "Números dos documentos não fornecidos"}), 400

    # Dividir os números separados por vírgulas e remover formatação
    document_numbers = [remove_formatting(num.strip()) for num in document_numbers.split(',') if num.strip()]

    if not document_numbers:
        return jsonify({"error": "Números dos documentos inválidos"}), 400

    # Preparar os dados para consulta
    document_data = [{"document_number": num, "source_office": "Busca Manual"} for num in document_numbers]

    # Realizar a consulta no banco
    results = query_database(document_data)
    return jsonify({"results": results})

# Identifica o oficio pelo nome(para link de visualização do oficio)
@app.route('/uploads/<path:filename>')

def serve_uploaded_file(filename):
    """
    Serve arquivos da pasta de uploads.
    """
    try:
        return send_from_directory('./uploads', filename)
    except FileNotFoundError:
        return jsonify({"error": "Arquivo não encontrado"}), 404

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug=True)
