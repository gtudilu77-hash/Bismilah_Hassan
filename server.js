import dotenv from "dotenv";
dotenv.config();

import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import OpenAI from "openai";
import { execSync } from "child_process";
import path from "path";

const app = express();

/* =========================
   ⚡ CONFIG
========================= */
app.post("/api/vision-frame", async (req, res) => {
  try {
    const { image, prompt } = req.body;

    if (!image) {
      return res.status(400).json({ result: "Sem imagem" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",

      messages: [
        {
          role: "system",
          content: `
És um sistema de visão artificial tipo JARVIS.

Tens de:
- identificar objetos
- identificar pessoas
- detetar perigos
- descrever ambiente
- gerar alertas curtos
          `,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Analisa esta cena em tempo real.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      max_completion_tokens: 700,
      reasoning_effort: "none", // descrição de cena em tempo real — sem raciocínio extra a consumir o budget
    });

    const text = getText(response);

    // EXEMPLO de resposta estruturada
    res.json({
      result: text,

      user: text.includes("Tudilu") ? "Tudilu" : null,

      objects: [],
      alerts: text.includes("lixo") ? ["lixo_detectado"] : [],
    });

  } catch (err) {
    console.error("VISION ERROR:", err);
    res.status(500).json({ result: "Erro visão" });
  }
});
app.use(cors());

app.use(express.json({
  limit: "100mb",
}));

app.use(express.urlencoded({
  extended: true,
  limit: "100mb",
}));

/* =========================
   📁 UPLOADS
========================= */
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =========================
   📦 MULTER STORAGE
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);

    // Safari / MediaRecorder fixes
    if (!ext) {
      if (file.mimetype.includes("webm")) ext = ".webm";
      else if (file.mimetype.includes("mp4")) ext = ".mp4";
      else if (file.mimetype.includes("mpeg")) ext = ".mp3";
      else if (file.mimetype.includes("wav")) ext = ".wav";
      else if (file.mimetype.includes("jpeg")) ext = ".jpg";
      else if (file.mimetype.includes("png")) ext = ".png";
      else ext = ".bin";
    }

    const uniqueName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2)}${ext}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

/* =========================
   🤖 OPENAI
========================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   💾 DATABASE
========================= */
const DB_FILE = path.join(process.cwd(), "db.json");

const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch {
    return {};
  }
};

const saveDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const getText = (res) => {
  try {
    const content = res?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn(
        "⚠️  Resposta vazia — finish_reason:", res?.choices?.[0]?.finish_reason,
        "| usage:", JSON.stringify(res?.usage)
      );
    }
    return content || "Sem resposta";
  } catch {
    return "Erro ao processar resposta";
  }
};

/* =========================
   🧹 CLEANUP
========================= */
const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Erro ao apagar ficheiro:", err);
  }
};

/* =========================
   🏠 ROOT
========================= */
app.get("/", (req, res) => {
  res.json({
    status: "ONLINE",
    message: "🔥 A.V.E.S SERVER RUNNING",
  });
});

/* =========================
   💬 CHAT
========================= */
app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      userId,
      mode = "normal",
    } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "Mensagem vazia",
      });
    }

    if (!userId) {
      return res.status(400).json({
        reply: "userId obrigatório",
      });
    }

    const db = readDB();

    const history = (db[userId] || []).slice(-10);

    const systemPrompt =
      mode === "short"
        ? "Responde curto e objetivo."
        : mode === "long"
        ? "Responde detalhadamente."
        : "Responde naturalmente.";

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },

        ...history,

        {
          role: "user",
          content: message,
        },
      ],

      max_completion_tokens: 600,
      reasoning_effort: "none", // conversa casual, não precisa de "pensar muito"
      // nota: "temperature" foi removido — modelos de raciocínio do GPT-5
      // não o suportam em /chat/completions (a chamada falhava com erro)
    });

    const reply = getText(response);

    db[userId] = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: reply },
    ].slice(-20);

    saveDB(db);

    res.json({ reply });

  } catch (err) {
    console.error("ERRO CHAT:", err);

    res.status(500).json({
      reply: "Erro no chat",
    });
  }
});

/* =========================
   🎤 TRANSCRIÇÃO
========================= */
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  let outputPath = "";

  try {
    if (!req.file) {
      return res.status(400).json({
        text: "",
      });
    }

    console.log("🎤 AUDIO RECEBIDO:");
    console.log(req.file);

    const inputPath = req.file.path;

    outputPath = `${inputPath}.wav`;

    // Conversão otimizada
    execSync(
      `ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}"`
    );

    console.log("✅ ÁUDIO CONVERTIDO:", outputPath);

    // Nota: modelo de áudio (transcrição) — família separada da linha
    // GPT-5 de raciocínio, não afetado pela troca de modelo de chat/visão.
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(outputPath),

      model: "gpt-4o-mini-transcribe",
    });

    res.json({
      text: transcription.text || "",
    });

  } catch (err) {
    console.error("❌ ERRO TRANSCRIÇÃO:", err);

    res.status(500).json({
      text: "",
      error: err.message,
    });

  } finally {
    if (req.file?.path) {
      deleteFile(req.file.path);
    }

    if (outputPath) {
      deleteFile(outputPath);
    }
  }
});

/* =========================
   🎥 ANÁLISE DE VÍDEO
========================= */
app.post("/api/analyze-video", upload.single("video"), async (req, res) => {
  let framesDir = "";

  try {
    if (!req.file) {
      return res.status(400).json({
        result: "Sem vídeo",
      });
    }

    framesDir = path.join(
      uploadDir,
      `frames_${Date.now()}`
    );

    fs.mkdirSync(framesDir);

    console.log("🎥 PROCESSANDO VÍDEO...");

    // Extrai frames
    execSync(
      `ffmpeg -y -i "${req.file.path}" -vf "fps=1,scale=640:-1" -t 10 "${framesDir}/frame_%03d.jpg"`
    );

    const frameFiles = fs
      .readdirSync(framesDir)
      .sort();

    if (!frameFiles.length) {
      return res.status(400).json({
        result: "Nenhum frame encontrado",
      });
    }

    const content = [
      {
        type: "text",
        text:
          "Estes frames pertencem a um vídeo. Analisa detalhadamente o que acontece.",
      },
    ];

    for (const file of frameFiles) {
      const base64 = fs.readFileSync(
        path.join(framesDir, file),
        "base64"
      );

      content.push({
        type: "image_url",

        image_url: {
          url: `data:image/jpeg;base64,${base64}`,
        },
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",

      messages: [
        {
          role: "user",
          content,
        },
      ],

      max_completion_tokens: 1000,
      reasoning_effort: "none", // várias imagens já é tarefa pesada em tokens — sem raciocínio extra a consumir o budget
    });

    const text = getText(response);

    res.json({
      result: text,
      reply: text,
    });

  } catch (err) {
    console.error("❌ ERRO VÍDEO:", err);

    res.status(500).json({
      result: "Erro ao processar vídeo",
    });

  } finally {
    if (req.file?.path) {
      deleteFile(req.file.path);
    }

    if (framesDir && fs.existsSync(framesDir)) {
      fs.readdirSync(framesDir).forEach((file) => {
        deleteFile(path.join(framesDir, file));
      });

      fs.rmdirSync(framesDir);
    }
  }
});

/* =========================
   🖼️ ANÁLISE DE IMAGEM
========================= */
app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        result: "Sem imagem",
      });
    }

    const base64 = fs.readFileSync(
      req.file.path,
      "base64"
    );

    const response = await openai.chat.completions.create({
      model: "gpt-5.4-mini",

      messages: [
        {
          role: "user",

          content: [
            {
              type: "text",
              text: "Analisa esta imagem detalhadamente.",
            },

            {
              type: "image_url",

              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
              },
            },
          ],
        },
      ],

      max_completion_tokens: 800,
      reasoning_effort: "none", // descrição direta de imagem — raciocínio extra só consumia o budget de tokens
    });

    const text = getText(response);

    res.json({
      result: text,
      reply: text,
    });

  } catch (err) {
    console.error("❌ ERRO IMAGEM:", err);

    res.status(500).json({
      result: "Erro ao analisar imagem",
    });

  } finally {
    if (req.file?.path) {
      deleteFile(req.file.path);
    }
  }
});

/* =========================
   🔊 TTS
========================= */
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).send("");
    }

    // Nota: modelo de voz — família separada, não afetada pela troca acima.
    const speech = await openai.audio.speech.create({
      model: "tts-1",

      voice: "alloy",

      input: text,
    });

    const buffer = Buffer.from(
      await speech.arrayBuffer()
    );

    res.setHeader("Content-Type", "audio/mpeg");

    res.send(buffer);

  } catch (err) {
    console.error("❌ ERRO TTS:", err);

    res.status(500).send("");
  }
});

/* =========================
   🚀 SERVER
========================= */
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
🔥 ===================================
🚀 A.V.E.S SERVER ONLINE
🌍 http://localhost:${PORT}
🔥 ===================================
  `);
});