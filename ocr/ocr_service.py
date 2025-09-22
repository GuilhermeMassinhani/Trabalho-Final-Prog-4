from flask import Flask, request, jsonify
from pdf2image import convert_from_path
import pytesseract
import cv2
import numpy as np
import logging
import os

# Configuração de logs
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("ocr_service.log")
    ]
)

app = Flask(__name__)

@app.route('/ocr', methods=['POST'])
def ocr_service():
    try:
        logging.info("Recebendo arquivo para OCR.")
        
        # Receber o arquivo PDF ou imagem
        file = request.files['file']
        file_path = f"/tmp/{file.filename}"
        file.save(file_path)
        logging.info(f"Arquivo salvo em: {file_path}")

        # Verificar extensão
        if file.filename.lower().endswith('.pdf'):
            logging.info("Arquivo identificado como PDF. Convertendo páginas para imagens.")
            images = convert_from_path(file_path)
            logging.info(f"{len(images)} páginas extraídas do PDF.")
        else:
            from PIL import Image
            logging.info("Arquivo identificado como imagem única.")
            images = [Image.open(file_path)]

        # Processar imagens com OCR
        text = ''
        for i, image in enumerate(images):
            try:
                logging.info(f"Processando página/imagem {i + 1}.")

                # Pré-processamento
                gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
                logging.debug("Imagem convertida para tons de cinza.")

                _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
                logging.debug("Imagem binarizada usando limiar OTSU.")

                processed = cv2.resize(binary, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
                logging.debug("Imagem redimensionada para melhorar o OCR.")

                # OCR
                page_text = pytesseract.image_to_string(processed, lang='por')
                logging.info(f"Texto extraído da página {i + 1}. Tamanho do texto: {len(page_text)} caracteres.")
                text += page_text
            except Exception as page_error:
                logging.error(f"Erro ao processar a página {i + 1}: {str(page_error)}")

        # Retornar o texto extraído
        logging.info("Processamento OCR concluído.")
        return jsonify({"text": text})

    except Exception as e:
        logging.error(f"Erro no serviço OCR: {str(e)}")
        return jsonify({"error": str(e)}), 500

    finally:
        # Limpar arquivos temporários
        if os.path.exists(file_path):
            os.remove(file_path)
            logging.info(f"Arquivo temporário removido: {file_path}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000)
