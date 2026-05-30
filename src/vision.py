from flask import Flask, request, jsonify
from ultralytics import YOLO
import base64
import numpy as np
from PIL import Image
import io

app = Flask(__name__)

# Carrega modelo YOLO
model = YOLO("yolov8n.pt")

@app.route("/detect", methods=["POST"])
def detect():

    try:

        data = request.json

        image = data["image"]

        # Remove prefixo base64
        image = image.split(",")[1]

        # Base64 → bytes
        image_bytes = base64.b64decode(image)

        # Bytes → imagem
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # PIL → numpy
        img = np.array(img)

        # Detecta objetos
        results = model(img)

        objects = []

        for result in results:

            for box in result.boxes:

                cls = int(box.cls[0])

                conf = float(box.conf[0])

                label = model.names[cls]

                if conf > 0.5:

                    objects.append({
                        "label": label,
                        "confidence": round(conf, 2)
                    })

        return jsonify({
            "success": True,
            "objects": objects
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })

if __name__ == "__main__":
    app.run(port=5000)