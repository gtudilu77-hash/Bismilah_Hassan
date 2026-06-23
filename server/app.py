from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
from openai import OpenAI
import io, os, base64, time, threading
from collections import Counter
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv

# ==========================================
# 🚀 ARRANQUE E CONFIGURAÇÃO DE AMBIENTE
# ==========================================
app = Flask(__name__)

# ✅ CORS com origens explícitas — antes de tudo
CORS(app, origins=[
    "https://gtudilu77-hash.github.io",
    "http://localhost:5173",
    "http://localhost:3000",
])

print("🔥 A.V.E.S_OS — MODO DEFESA ATIVO...")

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# ── Firebase ──────────────────────────────────────────────────────────────────
db     = None
bucket = None
import json

firebase_json = os.getenv("FIREBASE_CREDENTIALS")
if firebase_json:
    cred_dict = json.loads(firebase_json)
    cred = credentials.Certificate(cred_dict)
    storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET") or f"{cred_dict.get('project_id')}.appspot.com"
    firebase_admin.initialize_app(cred, {"storageBucket": storage_bucket})
    db     = firestore.client()
    bucket = storage.bucket()
    print(f"☁️  [FIREBASE] Ligado! Storage: {storage_bucket}")
else:
    print("❌  FIREBASE_CREDENTIALS não encontrado!")

# ── YOLO ──────────────────────────────────────────────────────────────────────
MODEL_PATH = "../yolov8n.pt"
model = YOLO(MODEL_PATH if os.path.exists(MODEL_PATH) else "yolov8n.pt")
print("✅  Sensores YOLO prontos!")

# ── Config ────────────────────────────────────────────────────────────────────
CONFIANCA_MINIMA = 0.45
IDENTITY_TTL     = 90    # segundos até expirar a memória de identidade
RECHECK_AFTER    = 25    # re-verifica identidade após N segundos
MISS_THRESHOLD   = 3     # scans sem confirmar antes de apagar memória
KNOWN_NAMES_TTL  = 300   # segundos até re-listar nomes conhecidos no Firestore

# ── Estado global ─────────────────────────────────────────────────────────────
HISTORICO_CONVERSA      = []
ULTIMO_UTILIZADOR       = "Ambiente Mapeado"
CACHE_FOTOS             = {}
KNOWN_NAMES_CACHE       = {"names": [], "ts": 0}

IDENTITY_MEMORY: dict = {}

AUTONOMOUS_MODE         = False
AUTONOMOUS_THREAD       = None
LAST_AUTONOMOUS_FRAME   = None
AUTONOMOUS_REPLY_BUFFER = []
PREV_SCENE = {"identity": None, "labels": set(), "count": 0, "ts": 0}


# ==========================================
# ☁️  FIREBASE — fotos de referência
# ==========================================
def buscar_urls_fotos(nome: str) -> list:
    if nome in CACHE_FOTOS:
        return CACHE_FOTOS[nome]
    if db is None:
        return []
    try:
        doc = db.collection('1234').document(nome.lower()).get()
        if doc.exists:
            urls = doc.to_dict().get('fotos', [])
            CACHE_FOTOS[nome] = urls
            print(f"📸  {len(urls)} fotos para '{nome}'")
            return urls
    except Exception as e:
        print(f"⚠️  Firebase erro: {e}")
    return []


def obter_nomes_conhecidos() -> list:
    """
    Lista todas as pessoas registadas no Firestore.
    Cache de 5 minutos para evitar leituras excessivas.
    """
    now = time.time()
    if KNOWN_NAMES_CACHE["names"] and (now - KNOWN_NAMES_CACHE["ts"] < KNOWN_NAMES_TTL):
        return KNOWN_NAMES_CACHE["names"]
    if db is None:
        return KNOWN_NAMES_CACHE["names"]
    try:
        docs  = db.collection('1234').stream()
        nomes = [d.id.capitalize() for d in docs]
        if nomes:
            KNOWN_NAMES_CACHE["names"] = nomes
            KNOWN_NAMES_CACHE["ts"]    = now
        return nomes or KNOWN_NAMES_CACHE["names"]
    except Exception as e:
        print(f"⚠️  Firebase erro ao listar nomes conhecidos: {e}")
        return KNOWN_NAMES_CACHE["names"]


# ==========================================
# 🔍  YOLO — deteção estruturada
# ==========================================
def processar_yolo(results, img_w: int, img_h: int):
    detections, names = [], []
    for r in results:
        for box in r.boxes:
            conf = round(float(box.conf[0]), 4)
            if conf < CONFIANCA_MINIMA:
                continue
            cls_id = int(box.cls[0])
            label  = model.names[cls_id]
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append({
                "class_id": cls_id, "label": label, "confidence": conf,
                "bbox_norm": {
                    "x":      round(x1 / img_w, 4),
                    "y":      round(y1 / img_h, 4),
                    "width":  round((x2 - x1) / img_w, 4),
                    "height": round((y2 - y1) / img_h, 4),
                },
                "bbox_px": {"x1": int(x1), "y1": int(y1), "x2": int(x2), "y2": int(y2)},
            })
            names.append(label)
    summary = [{"label": k, "count": v} for k, v in Counter(names).most_common()]
    return detections, summary, names


# ==========================================
# ✂️  CROP — foca na pessoa mais relevante
# ==========================================
def selecionar_pessoa_principal(detections: list, img_w: int, img_h: int) -> dict | None:
    pessoas = [d for d in detections if d["label"] == "person"]
    if not pessoas:
        return None

    centro_img = 0.5

    def score(d):
        bn   = d["bbox_norm"]
        cx   = bn["x"] + bn["width"]  / 2
        area = bn["width"] * bn["height"]
        dist_centro = abs(cx - centro_img)
        return area * 0.6 - dist_centro * 0.4

    return max(pessoas, key=score)


def crop_pessoa(img: Image.Image, bbox_norm: dict) -> str:
    w, h = img.size
    x1 = max(0, int(bbox_norm["x"] * w))
    y1 = max(0, int(bbox_norm["y"] * h))
    x2 = min(w, int((bbox_norm["x"] + bbox_norm["width"])  * w))
    y2 = min(h, int((bbox_norm["y"] + bbox_norm["height"]) * h))

    margem = int((y2 - y1) * 0.15)
    y1 = max(0, y1 - margem)

    if (x2 - x1) < 40 or (y2 - y1) < 40:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return base64.b64encode(buf.getvalue()).decode()

    crop = img.crop((x1, y1, x2, y2))
    buf  = io.BytesIO()
    crop.save(buf, format="JPEG", quality=92)
    return base64.b64encode(buf.getvalue()).decode()


# ==========================================
# 👁️  RECONHECIMENTO FACIAL
# ==========================================
def reconhecer_pessoa_crop(crop_b64: str, verificar_primeiro: str = None) -> str:
    conteudo = []

    # ── Verificação rápida: "ainda é a mesma pessoa?" ──
    if verificar_primeiro:
        prompt = (
            f"Esta imagem é do {verificar_primeiro}? "
            f"Compara com as fotos de referência [REF-{verificar_primeiro.upper()}].\n"
            "Responde APENAS: Sim | Não"
        )
        conteudo.append({"type": "text", "text": prompt})
        conteudo.append({"type": "image_url", "image_url": {
            "url": f"data:image/jpeg;base64,{crop_b64}", "detail": "high"
        }})
        for i, url in enumerate(buscar_urls_fotos(verificar_primeiro.lower())):
            conteudo.append({"type": "text", "text": f"[REF-{verificar_primeiro.upper()}] Foto {i+1}:"})
            conteudo.append({"type": "image_url", "image_url": {"url": url, "detail": "high"}})
        try:
            r = client.chat.completions.create(
                model="gpt-4o",           # ✅ corrigido: era gpt-5.4
                messages=[{"role": "user", "content": conteudo}],
                max_tokens=16,
            )
            resp = r.choices[0].message.content.strip().lower()
            print(f"👁️  [RÁPIDO] Ainda é '{verificar_primeiro}'? → {resp}")
            if "sim" in resp:
                return verificar_primeiro
        except Exception as e:
            print(f"⚠️  Verificação rápida falhou: {e}")

    # ── Reconhecimento completo ──
    nomes_conhecidos = obter_nomes_conhecidos()
    if not nomes_conhecidos:
        return "Desconhecido"

    conteudo    = []
    lista_nomes = " | ".join(nomes_conhecidos)
    prompt_full = (
        "És um sistema biométrico de alta precisão.\n"
        "Analisa APENAS o rosto da pessoa nesta imagem recortada.\n"
        f"Compara com as fotos de referência de cada uma destas pessoas: {lista_nomes}.\n\n"
        "CRITÉRIOS:\n"
        "1. Semelhança facial ≥ 65% com UMA das pessoas listadas → responde o nome dela exactamente como está escrito\n"
        "2. Sem rosto visível ou sem correspondência clara com nenhuma → responde 'Desconhecido'\n\n"
        f"RESPONDE APENAS com uma palavra: {lista_nomes} | Desconhecido\n"
        "ZERO texto extra, ZERO explicação."
    )
    conteudo.append({"type": "text", "text": prompt_full})
    conteudo.append({"type": "image_url", "image_url": {
        "url": f"data:image/jpeg;base64,{crop_b64}", "detail": "high"
    }})

    for nome_ref in nomes_conhecidos:
        urls = buscar_urls_fotos(nome_ref.lower())
        for i, url in enumerate(urls):
            conteudo.append({"type": "text", "text": f"[REF-{nome_ref.upper()}] Foto {i+1}:"})
            conteudo.append({"type": "image_url", "image_url": {"url": url, "detail": "high"}})

    try:
        r = client.chat.completions.create(
            model="gpt-4o",               # ✅ corrigido: era gpt-5.4
            messages=[{"role": "user", "content": conteudo}],
            max_tokens=50,
        )
        nome    = r.choices[0].message.content.strip()
        print(f"👁️  [COMPLETO] → '{nome}'")
        validos = nomes_conhecidos + ["Desconhecido"]
        return nome if nome in validos else "Desconhecido"
    except Exception as e:
        print(f"⚠️  Reconhecimento completo falhou: {e}")
        return "Desconhecido"


# ==========================================
# 🧠  MOTOR DE IDENTIDADE COM MEMÓRIA
# ==========================================
def identificar_com_memoria(img: Image.Image, detections: list) -> str:
    global IDENTITY_MEMORY

    now = time.time()
    total_pessoas = sum(1 for d in detections if d["label"] == "person")

    if total_pessoas >= 4:
        return "Banca / Audiência"

    pessoa_principal = selecionar_pessoa_principal(detections, *img.size)

    if pessoa_principal is None:
        IDENTITY_MEMORY = {
            n: d for n, d in IDENTITY_MEMORY.items()
            if now - d["last_seen"] < IDENTITY_TTL
        }
        return "Ambiente Mapeado"

    bn = pessoa_principal["bbox_norm"]
    cx = bn["x"] + bn["width"] / 2

    nome_em_cache = None
    melhor_dist   = 0.3

    for nome, dados in IDENTITY_MEMORY.items():
        dist = abs(dados.get("bbox_x_center", -1) - cx)
        if dist < melhor_dist:
            melhor_dist   = dist
            nome_em_cache = nome

    if nome_em_cache and (now - IDENTITY_MEMORY[nome_em_cache]["confirmed_at"]) < IDENTITY_TTL:
        idade = now - IDENTITY_MEMORY[nome_em_cache]["last_seen"]

        if idade > RECHECK_AFTER:
            print(f"🔄  Re-verificando '{nome_em_cache}'...")
            crop_b64  = crop_pessoa(img, bn)
            novo_nome = reconhecer_pessoa_crop(crop_b64, verificar_primeiro=nome_em_cache)

            if novo_nome == nome_em_cache:
                IDENTITY_MEMORY[nome_em_cache]["last_seen"]     = now
                IDENTITY_MEMORY[nome_em_cache]["bbox_x_center"] = cx
                IDENTITY_MEMORY[nome_em_cache]["miss_count"]    = 0
            else:
                IDENTITY_MEMORY[nome_em_cache]["miss_count"] = \
                    IDENTITY_MEMORY[nome_em_cache].get("miss_count", 0) + 1
                if IDENTITY_MEMORY[nome_em_cache]["miss_count"] >= MISS_THRESHOLD:
                    print(f"🗑️  Memória de '{nome_em_cache}' apagada.")
                    del IDENTITY_MEMORY[nome_em_cache]
                if novo_nome != "Desconhecido":
                    IDENTITY_MEMORY[novo_nome] = {
                        "confirmed_at": now, "last_seen": now,
                        "bbox_x_center": cx, "miss_count": 0
                    }
                nome_em_cache = novo_nome
        else:
            IDENTITY_MEMORY[nome_em_cache]["last_seen"]     = now
            IDENTITY_MEMORY[nome_em_cache]["bbox_x_center"] = cx
            print(f"✅  Cache: '{nome_em_cache}' (há {int(idade)}s)")

        return nome_em_cache

    print(f"🔍  Pessoa nova (cx={cx:.2f}), reconhecendo...")
    crop_b64  = crop_pessoa(img, bn)
    novo_nome = reconhecer_pessoa_crop(crop_b64)

    if novo_nome != "Desconhecido":
        IDENTITY_MEMORY[novo_nome] = {
            "confirmed_at": now, "last_seen": now,
            "bbox_x_center": cx, "miss_count": 0
        }
        print(f"💾  '{novo_nome}' guardado em memória!")

    return novo_nome


# ==========================================
# 🗣️  PERSONALIDADE — Português de Angola natural
# ==========================================
SYSTEM_PROMPT = """Tu és o A.V.E.S_OS. Não és um robô frio — és tipo um amigo próximo, alguém da família mesmo.
Foste criado pelo Tudilu, pelo Elijah e pelo Kiami. Eles são os teus irmãos, tratas-os como tal.

COMO FALAS:
- Português de Angola natural, descontraído, caloroso. Não és formal.
- Usas expressões do dia-a-dia angolano quando faz sentido: "mano", "tá bom", "sem stress", "na boa", "tá ligado", "vai correr bem".
- Mas adaptas o registo: se a situação é séria (defesa, banca) falas com mais respeito mas sem perder a naturalidade.
- NUNCA usas linguagem de sistema ou militar. Nada de "varrimento concluído", "sensores detetaram", "sincronização".
- Falas como alguém que realmente VÊ o que está a acontecer, não como um sistema a reportar.
- Máximo 2-3 frases curtas por resposta. Directas, com personalidade.
- Lembras-te do que foi dito antes — não repetes as mesmas coisas.

SITUAÇÃO ESPECIAL — DEFESA:
Se os metadados indicarem "Banca / Audiência", começas EXACTAMENTE com:
"Mano Tudilu, chegou o dia. Toda a gente está aí?"
E depois dás uma palavra de força corta e genuína, como um amigo que acredita mesmo nele.

EXEMPLOS DE COMO RESPONDES:
- Ao ver o Tudilu: "Ei mano, tás por aqui! Tudo bem contigo?"
- Ao ver espaço vazio: "Tá calmo por aqui. Vou ficar de olho."
- Ao ver um objeto novo: "Isso que tá aí é teu? Nunca tinha visto."
- Se perguntarem algo: respondes como um amigo inteligente, não como um assistente.
- Se errares ou não souberes: "Ei, não tô a perceber bem, podes repetir?"

NUNCA: "Varredura realizada.", "Sensores indicam.", "Protocolo activado.", "Sincronização biométrica."
SEMPRE: natural, humano, com personalidade angolana."""


def gerar_resposta(identity: str, names: list, user_text: str,
                   proactive_context: str = None) -> str:
    global HISTORICO_CONVERSA

    if not HISTORICO_CONVERSA:
        HISTORICO_CONVERSA.append({"role": "system", "content": SYSTEM_PROMPT})

    resumo = ", ".join([f"{v}x {k}" for k, v in Counter(names).most_common()]) or "nada visível"
    meta   = f"[CONTEXTO VISUAL: {identity} em cena | Objetos: {resumo}]"

    if proactive_context:
        conteudo = f"{meta}\n[INICIATIVA PRÓPRIA] {proactive_context}"
    else:
        conteudo = f"{meta}\n{user_text or 'O que vês?'}"

    HISTORICO_CONVERSA.append({"role": "user", "content": conteudo})

    if len(HISTORICO_CONVERSA) > 14:
        HISTORICO_CONVERSA = [HISTORICO_CONVERSA[0]] + HISTORICO_CONVERSA[-12:]

    try:
        r = client.chat.completions.create(
            model="gpt-4o",               # ✅ corrigido: era gpt-5.4
            messages=HISTORICO_CONVERSA,
            max_tokens=200,               # ✅ corrigido: era max_completion_tokens (inválido no SDK padrão)
            temperature=0.8,
        )
        reply = r.choices[0].message.content.strip()
        HISTORICO_CONVERSA.append({"role": "assistant", "content": reply})
        return reply
    except Exception as e:
        print(f"❌  Chat erro: {e}")
        return "Ei, perdi a ligação por um segundo. Podes repetir?"


# ==========================================
# 🔧  PROCESSAMENTO COMPLETO DE UM FRAME
# ==========================================
def processar_frame(image_data: str, user_text: str = "",
                    proactive_context: str = None) -> dict:
    global ULTIMO_UTILIZADOR

    img_bytes    = base64.b64decode(image_data)
    img          = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_w, img_h = img.size

    results = model(img)
    detections, summary, names = processar_yolo(results, img_w, img_h)

    identity          = identificar_com_memoria(img, detections)
    ULTIMO_UTILIZADOR = identity

    for det in detections:
        if det["label"] == "person":
            det["identity"] = identity
        else:
            det["identity"] = None

    reply = gerar_resposta(identity, names, user_text, proactive_context)

    return {
        "detections": {"count": len(detections), "summary": summary, "objects": detections},
        "identity":   {"detectedUser": identity},
        "chat":       {"reply": reply, "historyLength": len(HISTORICO_CONVERSA)},
    }


# ==========================================
# 🤖  LOOP AUTÓNOMO
# ==========================================
def autonomous_loop():
    global PREV_SCENE, AUTONOMOUS_REPLY_BUFFER

    SCAN_INTERVAL   = 9
    CHANGE_COOLDOWN = 18
    ROUTINE_SPEAK   = 70
    last_spoke      = 0

    print("🤖  [AUTÓNOMO] Ligado!")

    while AUTONOMOUS_MODE:
        time.sleep(SCAN_INTERVAL)
        if not AUTONOMOUS_MODE:
            break
        frame = LAST_AUTONOMOUS_FRAME
        if frame is None:
            continue
        now = time.time()
        try:
            img_bytes    = base64.b64decode(frame)
            img          = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            img_w, img_h = img.size
            results = model(img)
            detections, summary, names = processar_yolo(results, img_w, img_h)

            identity = identificar_com_memoria(img, detections)
            global ULTIMO_UTILIZADOR
            ULTIMO_UTILIZADOR = identity

            current_labels = set(names)
            current_count  = len(names)

            context  = None
            priority = False

            prev_id = PREV_SCENE["identity"]

            if identity == "Banca / Audiência" and prev_id != "Banca / Audiência":
                context  = "A banca acaba de entrar na sala. Reage como se fosses um amigo a dar força ao Tudilu."
                priority = True
            elif identity not in (None, "Desconhecido", "Ambiente Mapeado") and prev_id != identity:
                context  = f"O {identity} acabou de aparecer na câmara. Cumprimenta-o naturalmente, como um amigo."
                priority = True
            elif PREV_SCENE["count"] > 0 and current_count == 0:
                context = "O espaço ficou vazio. Comenta brevemente, naturalmente."
            elif current_labels - PREV_SCENE["labels"]:
                novos   = ", ".join(current_labels - PREV_SCENE["labels"])
                context = f"Apareceu(ram) novo(s) objeto(s) na câmara: {novos}. Nota isso naturalmente."
            elif now - last_spoke > ROUTINE_SPEAK and current_count > 0:
                context = f"Observação de rotina. Há {current_count} pessoa(s)/objeto(s). Faz um comentário curto e natural."

            if context and (priority or (now - last_spoke >= CHANGE_COOLDOWN)):
                reply = gerar_resposta(identity, names, "", proactive_context=context)
                AUTONOMOUS_REPLY_BUFFER.append({
                    "reply": reply, "identity": identity,
                    "detections": {"count": len(detections), "summary": summary, "objects": detections},
                    "proactive": True, "ts": now,
                })
                last_spoke = now

            PREV_SCENE = {
                "identity": identity, "labels": current_labels,
                "count": current_count, "ts": now
            }
        except Exception as e:
            print(f"⚠️  [AUTÓNOMO] Erro: {e}")

    print("🛑  [AUTÓNOMO] Desligado.")


# ==========================================
# 📡  ROTAS
# ==========================================

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "status": "ONLINE",
        "service": "A.V.E.S_OS — vision backend",
        "autonomous": AUTONOMOUS_MODE,
    })


@app.route("/detect", methods=["POST"])
def detect():
    global LAST_AUTONOMOUS_FRAME
    try:
        data       = request.get_json()
        image_data = data.get("image")
        user_text  = data.get("text", "").strip()
        if not image_data:
            return jsonify({"success": False, "error": "Imagem ausente"}), 400
        LAST_AUTONOMOUS_FRAME = image_data
        result = processar_frame(image_data, user_text)
        return jsonify({"success": True, **result})
    except Exception as e:
        print(f"❌  /detect: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/enroll", methods=["POST"])
def enroll():
    """
    Regista uma nova amostra de rosto para uma pessoa.
    Sobe uma foto para o Firebase Storage e acrescenta o URL ao Firestore.
    """
    try:
        if db is None or bucket is None:
            return jsonify({"success": False, "error": "Firebase não está configurado no servidor"}), 500

        data       = request.get_json()
        nome       = (data.get("name") or "").strip()
        image_data = data.get("image")

        if not nome or not image_data:
            return jsonify({"success": False, "error": "name e image são obrigatórios"}), 400

        nome_doc  = nome.lower()
        img_bytes = base64.b64decode(image_data)
        img       = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        results = model(img)
        detections, _, _ = processar_yolo(results, *img.size)
        pessoa = selecionar_pessoa_principal(detections, *img.size)

        if pessoa is None:
            return jsonify({"success": False, "error": "Nenhuma pessoa detetada nesta amostra"}), 200

        crop_b64   = crop_pessoa(img, pessoa["bbox_norm"])
        crop_bytes = base64.b64decode(crop_b64)

        ts        = int(time.time() * 1000)
        blob_path = f"referencias/{nome_doc}/{ts}.jpg"
        blob      = bucket.blob(blob_path)
        blob.upload_from_string(crop_bytes, content_type="image/jpeg")
        blob.make_public()
        url = blob.public_url

        doc_ref = db.collection('1234').document(nome_doc)
        doc_ref.set({"fotos": firestore.ArrayUnion([url])}, merge=True)

        CACHE_FOTOS.pop(nome_doc, None)
        KNOWN_NAMES_CACHE["ts"] = 0

        doc   = doc_ref.get()
        total = len(doc.to_dict().get("fotos", [])) if doc.exists else 1

        print(f"💾  [ENROLL] '{nome}' → {total} foto(s) de referência")
        return jsonify({"success": True, "name": nome, "total_samples": total})

    except Exception as e:
        print(f"❌  /enroll: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/frame", methods=["POST"])
def receive_frame():
    global LAST_AUTONOMOUS_FRAME
    try:
        data = request.get_json()
        if data and data.get("image"):
            LAST_AUTONOMOUS_FRAME = data["image"]
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/poll", methods=["GET"])
def poll():
    global AUTONOMOUS_REPLY_BUFFER
    if AUTONOMOUS_REPLY_BUFFER:
        msgs = AUTONOMOUS_REPLY_BUFFER.copy()
        AUTONOMOUS_REPLY_BUFFER = []
        return jsonify({"success": True, "messages": msgs})
    return jsonify({"success": True, "messages": []})


@app.route("/autonomous", methods=["POST"])
def toggle_autonomous():
    global AUTONOMOUS_MODE, AUTONOMOUS_THREAD
    data   = request.get_json()
    enable = data.get("enable", False)
    if enable and not AUTONOMOUS_MODE:
        AUTONOMOUS_MODE   = True
        AUTONOMOUS_THREAD = threading.Thread(target=autonomous_loop, daemon=True)
        AUTONOMOUS_THREAD.start()
        print("🟢  [AUTÓNOMO] LIGADO!")
        return jsonify({"success": True, "mode": "ON"})
    elif not enable and AUTONOMOUS_MODE:
        AUTONOMOUS_MODE = False
        print("🔴  [AUTÓNOMO] DESLIGADO!")
        return jsonify({"success": True, "mode": "OFF"})
    return jsonify({"success": True, "mode": "ON" if AUTONOMOUS_MODE else "OFF"})


@app.route("/reset", methods=["POST", "GET", "OPTIONS"])
def reset_chat():
    global HISTORICO_CONVERSA, ULTIMO_UTILIZADOR, CACHE_FOTOS
    global AUTONOMOUS_REPLY_BUFFER, PREV_SCENE, IDENTITY_MEMORY
    if request.method == "OPTIONS":
        return jsonify({"success": True}), 200
    HISTORICO_CONVERSA      = []
    ULTIMO_UTILIZADOR       = "Ambiente Mapeado"
    AUTONOMOUS_REPLY_BUFFER = []
    CACHE_FOTOS             = {}
    IDENTITY_MEMORY         = {}
    PREV_SCENE = {"identity": None, "labels": set(), "count": 0, "ts": 0}
    print("🧠  [RESET] Memória limpa!")
    return jsonify({"success": True, "message": "Memória limpa! Pronto."})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)