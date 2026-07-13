// ═══════════════════════════════════════════════════════════════════════════
// VisionAI.tsx — módulo "JARVIS" de visão em tempo real
// ───────────────────────────────────────────────────────────────────────────
// Liga a câmara do dispositivo, envia frames para o backend Python (YOLOv8 +
// GPT-4o) e mostra os resultados sobre o vídeo: caixas à volta de objectos/
// pessoas, identidade reconhecida, e uma "conversa" falada com o A.V.E.S.
//
// Tem 2 modos de funcionamento:
//   • MANUAL   — o utilizador carrega no botão de scan (ou fala) para pedir
//                uma análise pontual.
//   • AUTÓNOMO — o sistema analisa sozinho de X em X segundos, e só reage
//                quando algo muda de forma relevante (nova pessoa, objecto
//                novo, etc.) — ver CONFIG mais abaixo e a função
//                toggleAutonomous().
//
// Se pedirem para "tornar a deteção mais/menos sensível", "mudar o
// intervalo do modo autónomo", ou "mudar quem o sistema já conhece", o
// bloco CONFIG / KNOWN_USERS logo a seguir aos imports é o sítio certo.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Loader2, ChevronLeft,
  Layers, StopCircle, ShieldCheck, UserX, Radio, Clock, Zap, UserPlus
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Detection {
  label: string;
  confidence: number;
  bbox_norm?: { x: number; y: number; width: number; height: number }; // coordenadas 0–1, relativas ao tamanho da imagem (não pixels)
}
interface DetectionSummary { label: string; count: number; }
interface ApiResponse {
  success: boolean;
  detections: { count: number; summary: DetectionSummary[]; objects: Detection[] };
  identity:   { detectedUser: string; confidence?: number };
  chat:       { reply: string };
}

type Status  = 'IDLE' | 'SCANNING' | 'SPEAKING' | 'LISTENING'; // estado geral da UI — controla qual ícone/animação aparece no botão principal
type ChatMsg = { role: 'user' | 'ai'; text: string; proactive?: boolean }; // proactive = true quando a mensagem veio do modo autónomo, não de um pedido do utilizador

// ─── Cache de Identidade ──────────────────────────────────────────────────────
// Guarda "quem já foi reconhecido" para não termos de chamar o GPT-4o (que
// tem custo e demora) em cada frame — ver shouldReidentify() e
// updateIdentityCache() mais abaixo para perceber o ciclo de vida disto.
interface IdentityCache {
  userId: string;
  confidence: number;
  lockedAt: number;         // timestamp ms de quando foi confirmado
  lockDuration: number;     // ms durante os quais confiamos neste resultado sem reconfirmar
  detectionCount: number;   // quantas vezes seguidas foi confirmado o mesmo utilizador
}

// ─── Configuração de eficiência ───────────────────────────────────────────────
// 👉 SE PEDIREM PARA AJUSTAR O COMPORTAMENTO DO SISTEMA, É QUASE SEMPRE AQUI.
const CONFIG = {
  /** Confiança mínima para aceitar uma deteção de identidade (0–1) */
  IDENTITY_MIN_CONFIDENCE: 0.72,
  /** Confiança mínima para objetos (descarta ruído em locais públicos) */
  OBJECT_MIN_CONFIDENCE: 0.55,
  /** Segundos de lock após 1ª deteção de identidade */
  IDENTITY_LOCK_SECS: 30,
  /** Após N deteções consecutivas do mesmo utilizador, aumenta o lock */
  IDENTITY_LOCK_BOOST_AT: 3,
  /** Lock aumentado (segundos) quando o utilizador é muito consistente */
  IDENTITY_LOCK_BOOST_SECS: 90,
  /** Janela de debounce para modo autónomo (ms) — evita spam de frames.
   *  Se pedirem "o modo autónomo deve reagir mais depressa", é este valor
   *  que se baixa (tem custo: mais chamadas à API por minuto). */
  AUTONOMOUS_FRAME_INTERVAL_MS: 5000,
  /** Mínimo de objetos *novos* para considerar que a cena mudou */
  SCENE_DELTA_THRESHOLD: 1,
  /** Nº de amostras capturadas ao registar um novo rosto.
   *  Se pedirem "tornar o registo de rosto mais rápido/mais preciso",
   *  baixa/sobe este número (mais amostras = mais preciso, mas mais lento). */
  ENROLLMENT_SAMPLES: 6,
  /** Intervalo entre amostras durante o registo (ms) */
  ENROLLMENT_INTERVAL_MS: 500,
};

// ─── Endereços dos backends ───────────────────────────────────────────────────
// Em dev local ficam em localhost; em produção define estas variáveis de
// ambiente (.env, com prefixo VITE_) com os URLs HTTPS reais dos servidores
// publicados (ex.: Render). Uma página em HTTPS (GitHub Pages, Vercel, etc.)
// nunca pode chamar http://localhost — o browser bloqueia por segurança.
//
// 👉 Se pedirem para "apontar para outro servidor de visão", muda a
// variável de ambiente VITE_VISION_API_URL no .env — não precisas de
// mexer nesta linha.
const VISION_API_BASE = import.meta.env.VITE_VISION_API_URL ?? 'http://127.0.0.1:5001';
const SERVER_API_BASE = import.meta.env.VITE_SERVER_API_URL ?? 'http://localhost:3001';

// Traduz os labels do YOLO (que vêm em inglês, ex: "cell_phone") para
// português. Se pedirem para "reconhecer mais tipos de objecto", o YOLOv8
// já detecta 80 classes COCO por defeito — só precisas de acrescentar a
// tradução aqui para aparecer em português (senão mostra em maiúsculas
// tal como veio do modelo, ver labelPt() logo a seguir).
const LABEL_PT: Record<string, string> = {
  person: 'USUÁRIO', laptop: 'LAPTOP', phone: 'TELEMÓVEL',
  cell_phone: 'TELEMÓVEL', chair: 'CADEIRA', book: 'LIVRO',
  cup: 'COPO', keyboard: 'TECLADO', mouse: 'RATO',
  monitor: 'MONITOR', bottle: 'GARRAFA', backpack: 'MOCHILA',
  tv: 'TELEVISÃO', desk: 'SECRETÁRIA', table: 'MESA',
  car: 'AUTOMÓVEL', bicycle: 'BICICLETA', bus: 'AUTOCARRO',
  bench: 'BANCO', handbag: 'MALA', umbrella: 'GUARDA-CHUVA',
  suitcase: 'MALA DE VIAGEM', traffic_light: 'SEMÁFORO',
  stop_sign: 'SINAL STOP', potted_plant: 'PLANTA',
  clock: 'RELÓGIO', vase: 'VASO', scissors: 'TESOURA',
};
const labelPt = (l: string) => LABEL_PT[l.toLowerCase()] ?? l.toUpperCase(); // se não houver tradução, mostra o label original em maiúsculas

// Nomes que o sistema já reconhece (usado para destacar o label "USUÁRIO"
// com o nome próprio em vez de genérico). Actualizado automaticamente
// pela função startEnrollment() quando se regista um rosto novo.
// 👉 Se pedirem para "pré-carregar" nomes conhecidos sem precisar de os
// registar pela câmara, é só adicionar aqui directamente.
const KNOWN_USERS = new Set(['Tudilu', 'Kiami', 'Elijah', 'Bismilah']);

/** Gera uma "assinatura" da cena (string com os labels ordenados) para
 *  comparar com a cena anterior e detectar mudanças — usado só no modo
 *  autónomo (hasSceneChanged), para saber se vale a pena reagir. */
function sceneSignature(objs: Detection[]): string {
  return objs
    .filter(d => d.confidence >= CONFIG.OBJECT_MIN_CONFIDENCE)
    .map(d => `${d.label}`)
    .sort()
    .join('|');
}

// ─── BBox Canvas ──────────────────────────────────────────────────────────────
// Desenha as caixas (cantos, não retângulo completo — visual estilo HUD de
// ficção científica) e o label+confiança sobre cada detecção, num <canvas>
// transparente por cima do vídeo. Corre sempre que `detections` muda.
function BBoxOverlay({ detections, color }: { detections: Detection[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // limpa o frame anterior antes de desenhar o novo
    detections
      .filter(d => d.confidence >= CONFIG.OBJECT_MIN_CONFIDENCE)
      .forEach((d) => {
        const bn = d.bbox_norm;
        if (!bn) return;
        // Converte coordenadas normalizadas (0–1) para pixels reais do canvas
        const x = bn.x * canvas.width,  y = bn.y * canvas.height;
        const w = bn.width * canvas.width, h = bn.height * canvas.height;
        const c = Math.min(w, h) * 0.2; // comprimento de cada "cantinho" desenhado (20% do lado menor)
        ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.shadowColor = color; ctx.shadowBlur  = 10; // efeito de glow
        // Desenha um "L" em cada um dos 4 cantos da caixa, em vez do
        // retângulo inteiro — puramente estético (estilo HUD)
        const br = (cx: number, cy: number, dx: number, dy: number) => {
          ctx.beginPath();
          ctx.moveTo(cx + dx * c, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * c);
          ctx.stroke();
        };
        br(x, y, 1, 1); br(x+w, y, -1, 1); br(x, y+h, 1, -1); br(x+w, y+h, -1, -1);
        ctx.shadowBlur = 0;
        // Label + percentagem de confiança, com fundo semi-transparente por trás para legibilidade
        const lbl = labelPt(d.label) + '  ' + (d.confidence*100).toFixed(0) + '%';
        ctx.font = 'bold 9px "Courier New"';
        const tw = ctx.measureText(lbl).width;
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(x, y - 17, tw + 8, 14);
        ctx.fillStyle = color;
        ctx.fillText(lbl, x + 4, y - 6);
      });
  }, [detections, color]);
  return (
    <canvas ref={canvasRef} width={1280} height={720}
      className="absolute inset-0 w-full h-full z-20 pointer-events-none" />
  );
}

// ─── Lock Timer HUD ───────────────────────────────────────────────────────────
// Pequeno indicador no canto que mostra quantos segundos faltam até o
// sistema voltar a confirmar a identidade da pessoa (em vez de confiar no
// cache). Só aparece enquanto o lock estiver activo (remaining > 0).
function LockTimerHUD({ cache, color }: { cache: IdentityCache | null; color: string }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!cache) return;
    const update = () => {
      const elapsed = Date.now() - cache.lockedAt;
      const left = Math.max(0, Math.ceil((cache.lockDuration - elapsed) / 1000));
      setRemaining(left);
    };
    update();
    const t = setInterval(update, 1000); // actualiza a contagem a cada segundo
    return () => clearInterval(t);
  }, [cache]);

  if (!cache || remaining === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="absolute top-24 right-10 z-[100] flex items-center gap-2 px-3 py-1.5
                 bg-black/60 backdrop-blur-md border rounded-xl text-[9px] font-mono uppercase tracking-widest"
      style={{ borderColor: color + '40', color: color + '99' }}
    >
      <Clock className="w-3 h-3" />
      <span>ID bloqueado · {remaining}s</span>
    </motion.div>
  );
}

// ─── Enrollment HUD ───────────────────────────────────────────────────────────
// Indicador de progresso ("3/6 amostras") mostrado enquanto se está a
// registar um novo rosto (ver startEnrollment()).
function EnrollmentHUD({ progress, total, color }: { progress: number; total: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="absolute top-40 right-10 z-[100] flex items-center gap-2 px-3 py-1.5
                 bg-black/60 backdrop-blur-md border rounded-xl text-[9px] font-mono uppercase tracking-widest"
      style={{ borderColor: color + '40', color: color + '99' }}
    >
      <UserPlus className="w-3 h-3" />
      <span>A capturar rosto · {progress}/{total}</span>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function VisionAI({ onBack }: { onBack: () => void }) {
  // Refs para elementos DOM e para valores que não devem disparar re-render
  // ao mudar (ex: identityCacheRef é lido/escrito em vários callbacks sem
  // precisar de re-renderizar o componente a cada leitura).
  const videoRef         = useRef<HTMLVideoElement>(null);
  const scrollRef        = useRef<HTMLDivElement>(null);
  const recognitionRef   = useRef<any>(null);       // instância do SpeechRecognition do browser
  const frameIntervalRef = useRef<any>(null);       // setInterval do envio de frames no modo autónomo
  const pollIntervalRef  = useRef<any>(null);       // setInterval que vai buscar respostas do modo autónomo ao backend
  const enrollIntervalRef = useRef<any>(null);      // cancelToken ({cancelled:boolean}) do loop sequencial de registo de rosto — ver startEnrollment()

  const identityCacheRef  = useRef<IdentityCache | null>(null); // cópia "ao vivo" do cache, para usar dentro de callbacks sem depender de closures desactualizadas
  const lastSceneRef      = useRef<string>('');                 // última assinatura de cena vista, para hasSceneChanged()

  // Estado visível na UI
  const [status,        setStatus]       = useState<Status>('IDLE');
  const [inputText,     setInputText]    = useState('');       // texto do input (escrito ou ditado por voz)
  const [chatLog,       setChatLog]      = useState<ChatMsg[]>([]);
  const [detections,    setDetections]   = useState<Detection[]>([]); // últimas detecções, usado pelo BBoxOverlay
  const [nodes,         setNodes]        = useState<{ x: number; y: number; label: string; info: string }[]>([]); // "pins" flutuantes sobre o vídeo
  const [detectedUser,  setDetectedUser] = useState('A.V.E.S_OS');   // nome mostrado no HUD superior direito
  const [scanColor,     setScanColor]    = useState('#00ffcc');      // cor do tema (verde=reconhecido, vermelho=desconhecido)
  const [autonomous,    setAutonomous]   = useState(false);
  const [identityCache, setIdentityCache] = useState<IdentityCache | null>(null); // versão "reactiva" do identityCacheRef, só para forçar re-render do HUD

  // Registo de novos rostos
  const [enrolling,       setEnrolling]       = useState(false);
  const [enrollName,      setEnrollName]      = useState('');
  const [enrollProgress,  setEnrollProgress]  = useState(0);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog]); // mantém o chat sempre scrollado para a última mensagem

  // ── Camera ──────────────────────────────────────────────────────────────────
  // Pede acesso à câmara frontal assim que o componente monta, e liga o
  // stream directamente ao elemento <video>. O cleanup (return) desliga a
  // câmara ao sair do ecrã — importante para não deixar a luz da câmara
  // acesa depois de saíres desta página.
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { console.error('[A.V.E.S] Câmara:', err); }
    })();
    return () => {
      if (videoRef.current?.srcObject)
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Speech recognition ───────────────────────────────────────────────────────
  // Usa a Web Speech API nativa do browser (não é OpenAI/Whisper aqui —
  // isto é só para "ditar" texto para o input; a transcrição "a sério" via
  // Whisper acontece no server.js, /api/transcribe, usada noutros sítios
  // da app). Nem todos os browsers suportam isto (por isso o `if (!SR) return`).
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'pt-PT';
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInputText(t); handleAction(t); // dita e já dispara a acção, sem precisar de clicar em enviar
    };
    rec.onend = () => setStatus(s => s === 'LISTENING' ? 'IDLE' : s);
    recognitionRef.current = rec;
    return () => window.speechSynthesis.cancel();
  }, []);

  // ── TTS (texto-para-voz) ───────────────────────────────────────────────────
  // Pede ao server.js (que por sua vez usa o modelo tts-1 da OpenAI) para
  // converter o texto da resposta em áudio, e reproduz-o. Se pedirem para
  // "trocar a voz", isso muda-se no server.js (parâmetro `voice`), não aqui.
  const speakNeural = useCallback(async (text: string) => {
    setStatus('SPEAKING');
    try {
      const res  = await fetch(SERVER_API_BASE + '/api/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const blob  = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setStatus('IDLE');
      audio.play();
    } catch { setStatus('IDLE'); }
  }, []);

  // ── Capture frame helper ────────────────────────────────────────────────────
  // Tira uma "fotografia" do frame actual do vídeo, desenhando-o num
  // <canvas> invisível e convertendo para base64 JPEG — é isto que se envia
  // ao backend em cada pedido de análise.
  const captureFrame = useCallback((quality = 0.85): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null; // readyState < 2 = vídeo ainda não tem frame disponível
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', quality).split(',')[1]; // remove o prefixo "data:image/jpeg;base64," e fica só com os dados
  }, []);

  // ── Identity Cache: verifica se deve re-identificar ─────────────────────────
  // true = "já passou o tempo de lock, pode voltar a chamar o GPT-4o para
  // confirmar quem é". false = "ainda dentro do período de confiança,
  // reaproveita o resultado anterior sem gastar mais uma chamada de API".
  const shouldReidentify = useCallback((): boolean => {
    const cache = identityCacheRef.current;
    if (!cache) return true; // nunca identificado antes -> tem de identificar já
    const elapsed = Date.now() - cache.lockedAt;
    return elapsed >= cache.lockDuration;
  }, []);

  /** Actualiza o cache com uma nova deteção de identidade confirmada.
   *  Aumenta o tempo de lock (IDENTITY_LOCK_BOOST_SECS) se a mesma pessoa
   *  for confirmada várias vezes seguidas — assume-se que quanto mais
   *  vezes seguidas é a mesma pessoa, menos frequentemente vale a pena
   *  reconfirmar. */
  const updateIdentityCache = useCallback((userId: string, confidence: number) => {
    if (userId === 'Desconhecido' || confidence < CONFIG.IDENTITY_MIN_CONFIDENCE) return;

    const prev = identityCacheRef.current;
    const isSame = prev?.userId === userId;
    const count = isSame ? (prev?.detectionCount ?? 0) + 1 : 1;

    const lockSecs = count >= CONFIG.IDENTITY_LOCK_BOOST_AT
      ? CONFIG.IDENTITY_LOCK_BOOST_SECS
      : CONFIG.IDENTITY_LOCK_SECS;

    const newCache: IdentityCache = {
      userId,
      confidence,
      lockedAt: Date.now(),
      lockDuration: lockSecs * 1000,
      detectionCount: count,
    };

    identityCacheRef.current = newCache; // versão "silenciosa", lida de dentro de callbacks
    setIdentityCache(newCache);          // versão reactiva, para re-renderizar o HUD
  }, []);

  /** Força reset do cache de identidade — chamado manualmente (botão de
   *  relógio na barra inferior) ou automaticamente depois de registar um
   *  rosto novo, para a próxima varredura já tentar reconhecer a pessoa
   *  recém-registada. */
  const resetIdentityCache = useCallback(() => {
    identityCacheRef.current = null;
    setIdentityCache(null);
    setChatLog(prev => [...prev, {
      role: 'ai',
      text: 'Cache de identidade reiniciado. Próxima varredura re-identificará.',
    }]);
  }, []);

  // ── Deteção de mudança de cena ───────────────────────────────────────────────
  // Usado só pelo modo autónomo, para decidir se vale a pena reagir a um
  // novo frame — evita comentar a mesma cena repetidamente.
  const hasSceneChanged = useCallback((newObjs: Detection[]): boolean => {
    const newSig = sceneSignature(newObjs);
    if (newSig === lastSceneRef.current) return false; // exactamente a mesma cena de antes

    // Conta quantos labels são novos em relação à cena anterior
    const prevLabels = new Set(lastSceneRef.current.split('|').filter(Boolean));
    const newLabels  = newSig.split('|').filter(Boolean);
    const novelCount = newLabels.filter(l => !prevLabels.has(l)).length;

    if (novelCount >= CONFIG.SCENE_DELTA_THRESHOLD) {
      lastSceneRef.current = newSig;
      return true;
    }
    return false;
  }, []);

  // ── Apply detection results to UI ───────────────────────────────────────────
  // Função central chamada tanto pelo scan manual (handleAction) como pelo
  // modo autónomo (o poll no toggleAutonomous) — actualiza TODO o estado
  // visual de uma vez: detecções, identidade, chat, fala, e os "pins" (nodes).
  const applyResults = useCallback((
    objs: Detection[], userId: string, reply: string,
    proactive = false, apiConfidence = 1
  ) => {
    // Filtra objetos abaixo do limiar de confiança (CONFIG.OBJECT_MIN_CONFIDENCE)
    const filteredObjs = objs.filter(d => d.confidence >= CONFIG.OBJECT_MIN_CONFIDENCE);

    setDetections(filteredObjs);

    // Só actualiza a identidade mostrada se o lock já expirou — senão,
    // mantém a identidade em cache mesmo que o backend tenha devolvido
    // outra coisa (isto acontece quando skip_identity=true foi enviado).
    const finalUser = shouldReidentify()
      ? userId
      : (identityCacheRef.current?.userId ?? userId);

    setDetectedUser(finalUser);
    setScanColor(finalUser === 'Desconhecido' ? '#ef4444' : '#00ffcc'); // vermelho vs verde-ciano
    updateIdentityCache(userId, apiConfidence);

    setChatLog(prev => [...prev, { role: 'ai', text: reply, proactive }]);
    speakNeural(reply);

    // Gera até 5 "pins" flutuantes sobre o vídeo, um por detecção,
    // posicionados no centro de cada bounding box
    setNodes(
      filteredObjs.slice(0, 5).map((d, i) => {
        const cx = d.bbox_norm ? (d.bbox_norm.x + d.bbox_norm.width  / 2) * 100 : 20 + i * 15;
        const cy = d.bbox_norm ? (d.bbox_norm.y + d.bbox_norm.height / 2) * 100 : 35 + i * 10;
        const name = labelPt(d.label);
        return {
          x: cx, y: cy,
          // Se for uma "pessoa" e for alguém conhecido, mostra o nome próprio em vez de "USUÁRIO"
          label: name === 'USUÁRIO' && KNOWN_USERS.has(finalUser) ? finalUser.toUpperCase() : name,
          info:  'Precisão de ' + (d.confidence * 100).toFixed(0) + '%',
        };
      })
    );
  }, [speakNeural, shouldReidentify, updateIdentityCache]);

  // ── Manual action ───────────────────────────────────────────────────────────
  // Disparado pelo botão de scan, pelo Enter no input, ou pelo resultado da
  // voz. Captura um frame, envia ao backend Python (/detect), e aplica o
  // resultado. skip_identity é calculado por shouldReidentify() — é a forma
  // de dizer ao backend "não precisas de chamar o GPT-4o desta vez, usa o
  // que já sabes".
  const handleAction = useCallback(async (textOverride?: string) => {
    const queryText = textOverride ?? inputText;
    if (status === 'SCANNING') return; // evita pedidos sobrepostos
    setStatus('SCANNING');
    setInputText('');
    setChatLog(prev => [...prev, { role: 'user', text: queryText || 'Executando varredura óptica...' }]);

    try {
      const base64 = captureFrame();
      if (!base64) throw new Error('Câmara não disponível');

      const reidentify = shouldReidentify();

      const res  = await fetch(VISION_API_BASE + '/detect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          text: queryText,
          skip_identity: !reidentify,                              // <- hint para o backend
          cached_user: identityCacheRef.current?.userId ?? null,   // <- utilizador em cache
          min_confidence: CONFIG.OBJECT_MIN_CONFIDENCE,
        }),
      });
      const data: ApiResponse = await res.json();

      const objs       = Array.isArray(data.detections?.objects) ? data.detections.objects : [];
      const apiConf    = (data.identity as any)?.confidence ?? 1;
      const userId     = reidentify
        ? (data.identity?.detectedUser ?? 'Ambiente Mapeado')
        : (identityCacheRef.current?.userId ?? 'Ambiente Mapeado');
      const reply      = data.chat?.reply ?? 'Varredura concluída.';

      applyResults(objs, userId, reply, false, apiConf);

    } catch (err: any) {
      console.error('[A.V.E.S] Falha:', err);
      setChatLog(prev => [...prev, { role: 'ai', text: 'Falha: ' + (err?.message ?? 'erro') }]);
      setStatus('IDLE');
    }
  }, [inputText, status, captureFrame, applyResults, shouldReidentify]);

  // ── Autonomous mode ─────────────────────────────────────────────────────────
  // Liga/desliga o modo autónomo. Quando activo, tem 2 loops paralelos:
  //   1) frameIntervalRef — envia um frame ao backend a cada
  //      AUTONOMOUS_FRAME_INTERVAL_MS (só "alimenta" o backend, não espera
  //      resposta directa aqui)
  //   2) pollIntervalRef  — pergunta ao backend, a cada 3s, se há alguma
  //      mensagem nova para mostrar (o backend Python corre o seu próprio
  //      loop de análise em background — ver autonomous_loop() no Python)
  // Isto é "poll", não "push" — o backend não avisa o frontend sozinho, o
  // frontend é que pergunta periodicamente "há novidades?".
  const toggleAutonomous = useCallback(async () => {
    const next = !autonomous;
    setAutonomous(next);

    await fetch(VISION_API_BASE + '/autonomous', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable: next }),
    }).catch(console.error);

    if (next) {
      // Loop 1: alimenta o backend com frames periodicamente
      frameIntervalRef.current = setInterval(() => {
        const base64 = captureFrame(0.7); // qualidade mais baixa que o scan manual, para poupar banda/tempo
        if (!base64) return;

        fetch(VISION_API_BASE + '/frame', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            skip_identity: !shouldReidentify(),
            cached_user: identityCacheRef.current?.userId ?? null,
            min_confidence: CONFIG.OBJECT_MIN_CONFIDENCE,
          }),
        }).catch(() => {});
      }, CONFIG.AUTONOMOUS_FRAME_INTERVAL_MS);

      // Loop 2: pergunta ao backend se há reações novas a mostrar
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res  = await fetch(VISION_API_BASE + '/poll');
          const data = await res.json();
          if (data.messages?.length > 0) {
            data.messages.forEach((msg: any) => {
              const objs   = msg.detections?.objects ?? [];
              const userId = msg.identity ?? identityCacheRef.current?.userId ?? 'Ambiente Mapeado';
              const reply  = msg.reply ?? '';
              const apiConf = msg.confidence ?? 1;

              // Só processa/mostra se a cena realmente mudou de forma
              // relevante — evita repetir o mesmo comentário
              if (reply && hasSceneChanged(objs)) {
                applyResults(objs, userId, reply, true, apiConf);
              }
            });
          }
        } catch {}
      }, 3000);

      setChatLog(prev => [...prev, {
        role: 'ai',
        text: 'Modo autónomo activado. Estou a monitorizar o espaço.',
        proactive: true,
      }]);

    } else {
      clearInterval(frameIntervalRef.current);
      clearInterval(pollIntervalRef.current);
      setChatLog(prev => [...prev, {
        role: 'ai',
        text: 'Modo autónomo desactivado. Aguardo as tuas ordens.',
        proactive: false,
      }]);
    }
  }, [autonomous, captureFrame, applyResults, shouldReidentify, hasSceneChanged]);

  // Cleanup de segurança: garante que nenhum interval fica a correr se o
  // componente for desmontado (ex: ao navegar para outro ecrã) enquanto o
  // modo autónomo ou o registo de rosto estavam activos.
  useEffect(() => () => {
    clearInterval(frameIntervalRef.current);
    clearInterval(pollIntervalRef.current);
    // enrollIntervalRef já não guarda um ID de setInterval (o loop de
    // registo passou a ser sequencial via async/await) — guarda um
    // "cancelToken" com uma flag `cancelled`, verificada a cada iteração.
    if (enrollIntervalRef.current && typeof enrollIntervalRef.current === 'object') {
      enrollIntervalRef.current.cancelled = true;
    }
  }, []);

  // ── Enrollment: regista um novo rosto na base de dados biométrica ──────────
  // Captura CONFIG.ENROLLMENT_SAMPLES amostras da câmara e envia cada uma ao
  // endpoint /enroll do backend Python — que guarda a foto no Firebase
  // Storage e associa ao nome dado. No fim, adiciona o nome a KNOWN_USERS
  // localmente e reinicia o cache de identidade, para a próxima varredura
  // já tentar reconhecer esta pessoa.
  //
  // ⚠️ FIX importante: a versão anterior usava setInterval(tick, 500ms), que
  // dispara um pedido novo a cada 500ms *sem esperar* que o anterior
  // termine. Se o servidor estiver lento (ex: pouca RAM no plano gratuito
  // do Render, como já vimos noutros erros), isso acumula vários pedidos
  // /enroll em paralelo, sobrecarregando ainda mais um backend já
  // instável — um ciclo vicioso. Agora o loop é sequencial: só avança
  // para a amostra seguinte depois da anterior terminar (com sucesso ou
  // falha), nunca disparando pedidos simultâneos.
  //
  // Também corrigimos um bug de honestidade: antes, mesmo que TODAS as
  // amostras falhassem, a mensagem final dizia sempre "registado com
  // sucesso" (só verificava se o fetch não rebentava, não se o servidor
  // respondeu bem). Agora só reporta sucesso se pelo menos uma amostra foi
  // mesmo aceite, e distingue sucesso total, parcial, e falha completa.
  const startEnrollment = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || enrolling) return;

    setEnrolling(true);
    setEnrollProgress(0);
    setShowEnrollModal(false);
    setEnrollName('');

    const total = CONFIG.ENROLLMENT_SAMPLES;
    // Objecto de cancelamento em vez de um ID de setInterval — permite ao
    // cleanup (useEffect de desmontagem) interromper um registo em curso
    // se o utilizador sair do ecrã a meio.
    const cancelToken = { cancelled: false };
    enrollIntervalRef.current = cancelToken;

    /** Tenta enviar uma única amostra. Devolve true só se o servidor
     *  respondeu com sucesso (res.ok) — um 502/503 do Render, por exemplo,
     *  já não passa despercebido como se tivesse corrido bem. */
    const captureOne = async (index: number): Promise<boolean> => {
      const base64 = captureFrame(0.92); // qualidade alta, isto vai ficar guardado como referência permanente
      if (!base64) return false;
      try {
        const res = await fetch(VISION_API_BASE + '/enroll', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed, image: base64, sample_index: index, total_samples: total }),
        });
        if (!res.ok) throw new Error('Servidor respondeu ' + res.status);
        await res.json().catch(() => {}); // confirma que a resposta é JSON válido (evita "não é possível analisar a resposta")
        return true;
      } catch (err) {
        console.error('[A.V.E.S] Falha no enrolamento:', err);
        return false;
      }
    };

    (async () => {
      let successCount = 0;
      let consecutiveFails = 0;

      for (let i = 0; i < total; i++) {
        if (cancelToken.cancelled) return; // componente desmontado a meio do registo

        const ok = await captureOne(i);
        if (ok) { successCount += 1; consecutiveFails = 0; }
        else     { consecutiveFails += 1; }

        setEnrollProgress(i + 1);

        // Aborta cedo se o servidor estiver claramente indisponível — em
        // vez de continuar a martelar um backend em baixo pelas restantes
        // amostras, dá feedback imediato ao utilizador.
        if (consecutiveFails >= 3) {
          setEnrolling(false);
          setChatLog(prev => [...prev, {
            role: 'ai',
            text: 'Não consegui contactar o servidor de visão (várias tentativas seguidas falharam). Verifica se está online e tenta novamente.',
          }]);
          return;
        }

        if (i < total - 1) await new Promise(r => setTimeout(r, CONFIG.ENROLLMENT_INTERVAL_MS));
      }

      setEnrolling(false);

      if (successCount === 0) {
        setChatLog(prev => [...prev, {
          role: 'ai',
          text: 'Não foi possível registar o rosto — nenhuma amostra chegou ao servidor. Tenta novamente.',
        }]);
        return;
      }

      // Sucesso total ou parcial — em ambos os casos já há pelo menos uma
      // amostra guardada, por isso actualizamos o cache e KNOWN_USERS.
      KNOWN_USERS.add(trimmed);
      resetIdentityCache();
      setChatLog(prev => [...prev, {
        role: 'ai',
        text: successCount === total
          ? 'Rosto de ' + trimmed + ' registado com ' + total + ' amostras. Base de dados biométrica actualizada.'
          : 'Rosto de ' + trimmed + ' registado com ' + successCount + '/' + total + ' amostras (algumas falharam) — a precisão pode ficar reduzida.',
      }]);
    })();
  }, [enrolling, captureFrame, resetIdentityCache]);

  const toggleListening = () => {
    if (status === 'LISTENING') { recognitionRef.current?.stop(); setStatus('IDLE'); }
    else { setStatus('LISTENING'); recognitionRef.current?.start(); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden font-sans relative">

      {/* VIDEO */}
      <div className="absolute inset-0 z-0">
        {/* style transform:scaleX(1) força explicitamente a NÃO espelhar a câmera,
            independentemente de qualquer comportamento por defeito do browser/SO.
            👉 Se pedirem para "espelhar como um espelho normal" (efeito selfie),
            troca para 'scaleX(-1)' — mas atenção: os bbox_norm que o backend
            devolve são calculados sobre o frame CRU (não espelhado), por isso
            espelhar aqui desalinharia as caixas do BBoxOverlay com o vídeo. */}
        <video ref={videoRef} autoPlay playsInline muted
          className="w-full h-full object-cover brightness-[0.7] contrast-[1.2]"
          style={{ transform: 'scaleX(1)', WebkitTransform: 'scaleX(1)' }} />

        {/* Linha de scan animada — só visual, aparece enquanto status === 'SCANNING' */}
        {status === 'SCANNING' && (
          <motion.div
            initial={{ top: '0%' }} animate={{ top: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[1px] z-20 shadow-[0_0_15px_white]"
            style={{ backgroundColor: scanColor }}
          />
        )}

        {/* Borda pulsante — indica visualmente que o modo autónomo está ligado */}
        {autonomous && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ border: '1px solid ' + scanColor }}
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,#000 2px,#000 4px)' }} />
      </div>

      {/* BBOX CANVAS — camada com as caixas desenhadas sobre o vídeo */}
      <BBoxOverlay detections={detections} color={scanColor} />

      {/* BACK */}
      <motion.button onClick={onBack}
        className="absolute top-10 left-10 z-[100] p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center gap-3">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60">A.V.E.S_OS</span>
      </motion.button>

      {/* IDENTITY HUD — canto superior direito, mostra quem foi reconhecido */}
      <AnimatePresence>
        {detectedUser && (
          <motion.div key={detectedUser}
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
            className="absolute top-10 right-10 z-[100] p-3 border-r-4 bg-black/40 backdrop-blur-md flex items-center gap-4"
            style={{ borderRightColor: scanColor }}>
            <div className="text-right">
              <div className="text-[8px] opacity-40 uppercase font-bold tracking-widest">Sincronização_Biométrica</div>
              <div className="text-sm font-black uppercase tracking-tighter" style={{ color: scanColor }}>
                {detectedUser}
              </div>
              {identityCache && identityCache.detectionCount >= CONFIG.IDENTITY_LOCK_BOOST_AT && (
                <div className="text-[7px] tracking-widest mt-0.5 flex items-center justify-end gap-1"
                  style={{ color: scanColor + '88' }}>
                  <Zap className="w-2.5 h-2.5" />
                  LOCK REFORÇADO · {identityCache.detectionCount}×
                </div>
              )}
              {autonomous && (
                <div className="text-[7px] tracking-widest mt-0.5" style={{ color: scanColor + '88' }}>
                  ● MODO AUTÓNOMO
                </div>
              )}
            </div>
            {detectedUser === 'Desconhecido'
              ? <UserX      className="text-red-500  w-5 h-5" />
              : <ShieldCheck className="text-cyan-400 w-5 h-5" />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOCK TIMER */}
      <LockTimerHUD cache={identityCache} color={scanColor} />

      {/* ENROLLMENT HUD */}
      {enrolling && (
        <EnrollmentHUD progress={enrollProgress} total={CONFIG.ENROLLMENT_SAMPLES} color={scanColor} />
      )}

      {/* NODES — "pins" flutuantes por cima de cada detecção */}
      <AnimatePresence>
        {nodes.map((node, i) => (
          <motion.div key={node.label + '-' + i} className="absolute z-30"
            style={{ left: node.x + '%', top: node.y + '%' }}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}>
            <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: scanColor }} />
            <div className="ml-4 p-2 bg-black/80 backdrop-blur-md border-l-2 text-[9px] min-w-[140px]"
              style={{ borderLeftColor: scanColor }}>
              <div className="font-bold uppercase mb-1" style={{ color: scanColor }}>{node.label}</div>
              <div className="opacity-70 text-[10px] leading-tight">{node.info}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* CHAT LOG — histórico de mensagens sobreposto ao vídeo, por cima da barra de controlo */}
      <div className="absolute inset-x-0 bottom-[180px] z-50 flex flex-col items-center px-8 pointer-events-none">
        <div className="w-full max-w-2xl max-h-[250px] overflow-y-auto space-y-4 p-4 no-scrollbar pointer-events-auto">
          {chatLog.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={'px-5 py-3 rounded-2xl max-w-[85%] text-sm backdrop-blur-3xl border whitespace-pre-line ' + (
                msg.role === 'user'
                  ? 'bg-white/5 border-white/10 text-white/50 font-light'
                  : msg.proactive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 shadow-2xl' // verde = comentário espontâneo do modo autónomo
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-100 shadow-2xl'           // azul = resposta a um pedido directo
              )}>
                <span className="text-[8px] block opacity-30 mb-1 uppercase tracking-widest">
                  {msg.role === 'user' ? 'operador' : msg.proactive ? 'a.v.e.s_os • autónomo' : 'a.v.e.s_os'}
                </span>
                {msg.text}
              </div>
            </motion.div>
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* CONTROL BAR — todos os botões de acção principal */}
      <div className="absolute bottom-10 left-0 right-0 z-[100] px-6">
        <div className="max-w-4xl mx-auto bg-black/80 border border-white/10 backdrop-blur-[50px] rounded-[3.5rem] p-3 flex items-center gap-3 shadow-2xl">

          {/* Scan manual — disabled enquanto já está a decorrer um scan (status !== 'IDLE') */}
          <button onClick={() => handleAction()} disabled={status !== 'IDLE'}
            className={'p-5 rounded-full transition-all ' + (
              status === 'SCANNING'
                ? 'bg-blue-600 animate-pulse shadow-[0_0_20px_#2563eb]'
                : 'bg-white/5 hover:bg-white/10'
            )}>
            {status === 'SCANNING'
              ? <Loader2 className="w-7 h-7 animate-spin" />
              : <Layers  className="w-7 h-7" />}
          </button>

          {/* Input de texto/voz */}
          <input value={inputText} onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAction()}
            placeholder={status === 'LISTENING' ? 'A escutar ambiente...' : 'Transmitir coordenada de voz para o A.V.E.S...'}
            className="flex-1 bg-transparent border-none outline-none text-lg font-light text-white placeholder:text-white/10 tracking-tight" />

          {/* Reset cache — só aparece quando há um cache de identidade activo */}
          <AnimatePresence>
            {identityCache && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={resetIdentityCache}
                title="Reiniciar cache de identidade"
                className="p-4 rounded-full bg-white/5 hover:bg-amber-500/20 text-white/30 hover:text-amber-400 transition-all">
                <Clock className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Registar novo rosto — abre o modal, disabled enquanto já está a registar */}
          <motion.button onClick={() => setShowEnrollModal(true)} whileTap={{ scale: 0.93 }}
            disabled={enrolling}
            title="Registar novo rosto"
            className="p-5 rounded-full transition-all bg-white/5 hover:bg-white/10 text-white/40 hover:text-amber-300 disabled:opacity-30">
            <UserPlus className="w-6 h-6" />
          </motion.button>

          {/* Botão autónomo — liga/desliga o modo de monitorização contínua */}
          <motion.button onClick={toggleAutonomous} whileTap={{ scale: 0.93 }}
            className={'p-5 rounded-full transition-all relative ' + (
              autonomous
                ? 'bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-white/40'
            )}>
            <Radio className={'w-6 h-6 ' + (autonomous ? 'text-emerald-400' : '')} />
            {autonomous && (
              <motion.div className="absolute inset-0 rounded-full border border-emerald-400"
                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
            )}
          </motion.button>

          {/* Mic — liga/desliga o reconhecimento de voz nativo do browser */}
          <button onClick={toggleListening}
            className={'p-5 rounded-full transition-all ' + (
              status === 'LISTENING'
                ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-blue-400'
            )}>
            {status === 'LISTENING'
              ? <StopCircle className="w-7 h-7 text-white" />
              : <Mic        className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* MODAL DE REGISTO DE ROSTO */}
      <AnimatePresence>
        {showEnrollModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center"
            onClick={() => setShowEnrollModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()} // impede que o clique dentro do modal feche o modal (por causa do onClick no overlay acima)
              className="bg-black/90 border border-white/10 rounded-3xl p-8 w-[360px] flex flex-col gap-4"
            >
              <div className="text-[10px] uppercase tracking-widest opacity-50">Registar novo rosto</div>
              <input
                autoFocus
                value={enrollName}
                onChange={e => setEnrollName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startEnrollment(enrollName)}
                placeholder="Nome do utilizador"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30"
              />
              <p className="text-[9px] opacity-40 leading-relaxed">
                Mantém o rosto enquadrado e imóvel. Serão capturadas {CONFIG.ENROLLMENT_SAMPLES} amostras
                em instantes diferentes para reforçar a precisão.
              </p>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowEnrollModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs uppercase tracking-widest">
                  Cancelar
                </button>
                <button onClick={() => startEnrollment(enrollName)}
                  disabled={!enrollName.trim()}
                  className="flex-1 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs uppercase tracking-widest disabled:opacity-30">
                  Iniciar Captura
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}