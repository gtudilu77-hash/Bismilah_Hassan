import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Loader2, ChevronLeft,
  Layers, StopCircle, ShieldCheck, UserX, Radio
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Detection {
  label: string;
  confidence: number;
  bbox_norm?: { x: number; y: number; width: number; height: number };
}
interface DetectionSummary { label: string; count: number; }
interface ApiResponse {
  success: boolean;
  detections: { count: number; summary: DetectionSummary[]; objects: Detection[] };
  identity:   { detectedUser: string };
  chat:       { reply: string };
}

type Status  = 'IDLE' | 'SCANNING' | 'SPEAKING' | 'LISTENING';
type ChatMsg = { role: 'user' | 'ai'; text: string; proactive?: boolean };

const LABEL_PT: Record<string, string> = {
  person: 'USUÁRIO', laptop: 'LAPTOP', phone: 'TELEMÓVEL',
  cell_phone: 'TELEMÓVEL', chair: 'CADEIRA', book: 'LIVRO',
  cup: 'COPO', keyboard: 'TECLADO', mouse: 'RATO',
  monitor: 'MONITOR', bottle: 'GARRAFA', backpack: 'MOCHILA',
};
const labelPt = (l: string) => LABEL_PT[l.toLowerCase()] ?? l.toUpperCase();

// ─── BBox Canvas ──────────────────────────────────────────────────────────────
function BBoxOverlay({ detections, color }: { detections: Detection[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detections.forEach((d) => {
      const bn = d.bbox_norm;
      if (!bn) return;
      const x = bn.x * canvas.width,  y = bn.y * canvas.height;
      const w = bn.width * canvas.width, h = bn.height * canvas.height;
      const c = Math.min(w, h) * 0.2;
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.shadowColor = color; ctx.shadowBlur  = 10;
      const br = (cx: number, cy: number, dx: number, dy: number) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * c, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * c);
        ctx.stroke();
      };
      br(x, y, 1, 1); br(x+w, y, -1, 1); br(x, y+h, 1, -1); br(x+w, y+h, -1, -1);
      ctx.shadowBlur = 0;
      const lbl = `${labelPt(d.label)}  ${(d.confidence*100).toFixed(0)}%`;
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export function VisionAI({ onBack }: { onBack: () => void }) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const scrollRef       = useRef<HTMLDivElement>(null);
  const recognitionRef  = useRef<any>(null);
  const frameIntervalRef = useRef<any>(null);
  const pollIntervalRef  = useRef<any>(null);

  const [status,        setStatus]       = useState<Status>('IDLE');
  const [inputText,     setInputText]    = useState('');
  const [chatLog,       setChatLog]      = useState<ChatMsg[]>([]);
  const [detections,    setDetections]   = useState<Detection[]>([]);
  const [nodes,         setNodes]        = useState<{ x: number; y: number; label: string; info: string }[]>([]);
  const [detectedUser,  setDetectedUser] = useState('A.V.E.S_OS');
  const [scanColor,     setScanColor]    = useState('#00ffcc');
  const [autonomous,    setAutonomous]   = useState(false);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog]);

  // ── Camera ──────────────────────────────────────────────────────────────────
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
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'pt-PT';
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInputText(t); handleAction(t);
    };
    rec.onend = () => setStatus(s => s === 'LISTENING' ? 'IDLE' : s);
    recognitionRef.current = rec;
    return () => window.speechSynthesis.cancel();
  }, []);

  // ── TTS ──────────────────────────────────────────────────────────────────────
  const speakNeural = useCallback(async (text: string) => {
    setStatus('SPEAKING');
    try {
      const res  = await fetch('http://localhost:3001/api/tts', {
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
  const captureFrame = useCallback((quality = 0.85): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', quality).split(',')[1];
  }, []);

  // ── Apply detection results to UI ───────────────────────────────────────────
  const applyResults = useCallback((
    objs: Detection[], userId: string, reply: string, proactive = false
  ) => {
    setDetections(objs);
    setDetectedUser(userId);
    setScanColor(userId === 'Desconhecido' ? '#ef4444' : '#00ffcc');
    setChatLog(prev => [...prev, { role: 'ai', text: reply, proactive }]);
    speakNeural(reply);
    setNodes(
      objs.slice(0, 4).map((d, i) => {
        const cx = d.bbox_norm ? (d.bbox_norm.x + d.bbox_norm.width  / 2) * 100 : 20 + i * 15;
        const cy = d.bbox_norm ? (d.bbox_norm.y + d.bbox_norm.height / 2) * 100 : 35 + i * 10;
        const name = labelPt(d.label);
        return {
          x: cx, y: cy,
          label: name === 'USUÁRIO' && userId === 'Tudilu' ? 'TUDILU' : name,
          info:  `Precisão de ${(d.confidence * 100).toFixed(0)}%`,
        };
      })
    );
  }, [speakNeural]);

  // ── Manual action ───────────────────────────────────────────────────────────
  const handleAction = useCallback(async (textOverride?: string) => {
    const queryText = textOverride ?? inputText;
    if (status === 'SCANNING') return;
    setStatus('SCANNING');
    setInputText('');
    setChatLog(prev => [...prev, { role: 'user', text: queryText || 'Executando varredura óptica...' }]);

    try {
      const base64 = captureFrame();
      if (!base64) throw new Error('Câmara não disponível');

      const res  = await fetch('http://127.0.0.1:5001/detect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, text: queryText }),
      });
      const data: ApiResponse = await res.json();

      const objs   = Array.isArray(data.detections?.objects) ? data.detections.objects : [];
      const userId = data.identity?.detectedUser ?? 'Ambiente Mapeado';
      const reply  = data.chat?.reply ?? 'Varredura concluída.';

      applyResults(objs, userId, reply, false);

    } catch (err: any) {
      console.error('[A.V.E.S] Falha:', err);
      setChatLog(prev => [...prev, { role: 'ai', text: `Falha: ${err?.message ?? 'erro'}` }]);
      setStatus('IDLE');
    }
  }, [inputText, status, captureFrame, applyResults]);

  // ── Autonomous mode ─────────────────────────────────────────────────────────
  const toggleAutonomous = useCallback(async () => {
    const next = !autonomous;
    setAutonomous(next);

    // Avisa o backend
    await fetch('http://127.0.0.1:5001/autonomous', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable: next }),
    }).catch(console.error);

    if (next) {
      // Envia frames a cada 5s para o backend analisar
      frameIntervalRef.current = setInterval(() => {
        const base64 = captureFrame(0.7);
        if (!base64) return;
        fetch('http://127.0.0.1:5001/frame', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        }).catch(() => {});
      }, 5000);

      // Poll para receber mensagens proativas a cada 3s
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res  = await fetch('http://127.0.0.1:5001/poll');
          const data = await res.json();
          if (data.messages?.length > 0) {
            data.messages.forEach((msg: any) => {
              const objs   = msg.detections?.objects ?? [];
              const userId = msg.identity ?? 'Ambiente Mapeado';
              const reply  = msg.reply ?? '';
              if (reply) applyResults(objs, userId, reply, true);
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
  }, [autonomous, captureFrame, applyResults]);

  // Limpa intervalos ao desmontar
  useEffect(() => () => {
    clearInterval(frameIntervalRef.current);
    clearInterval(pollIntervalRef.current);
  }, []);

  const toggleListening = () => {
    if (status === 'LISTENING') { recognitionRef.current?.stop(); setStatus('IDLE'); }
    else { setStatus('LISTENING'); recognitionRef.current?.start(); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden font-sans relative">

      {/* VIDEO */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} autoPlay playsInline muted
          className="w-full h-full object-cover brightness-[0.7] contrast-[1.2]" />

        {status === 'SCANNING' && (
          <motion.div
            initial={{ top: '0%' }} animate={{ top: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[1px] z-20 shadow-[0_0_15px_white]"
            style={{ backgroundColor: scanColor }}
          />
        )}

        {/* Modo autónomo — pulso subtil */}
        {autonomous && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ border: `1px solid ${scanColor}` }}
            animate={{ opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,#000 2px,#000 4px)' }} />
      </div>

      {/* BBOX CANVAS */}
      <BBoxOverlay detections={detections} color={scanColor} />

      {/* BACK */}
      <motion.button onClick={onBack}
        className="absolute top-10 left-10 z-[100] p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center gap-3">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60">A.V.E.S_OS</span>
      </motion.button>

      {/* IDENTITY HUD */}
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
              {autonomous && (
                <div className="text-[7px] tracking-widest mt-0.5" style={{ color: `${scanColor}88` }}>
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

      {/* NODES */}
      <AnimatePresence>
        {nodes.map((node, i) => (
          <motion.div key={`${node.label}-${i}`} className="absolute z-30"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
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

      {/* CHAT LOG */}
      <div className="absolute inset-x-0 bottom-[180px] z-50 flex flex-col items-center px-8 pointer-events-none">
        <div className="w-full max-w-2xl max-h-[250px] overflow-y-auto space-y-4 p-4 no-scrollbar pointer-events-auto">
          {chatLog.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-5 py-3 rounded-2xl max-w-[85%] text-sm backdrop-blur-3xl border whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-white/5 border-white/10 text-white/50 font-light'
                  : msg.proactive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 shadow-2xl'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-100 shadow-2xl'
              }`}>
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

      {/* CONTROL BAR */}
      <div className="absolute bottom-10 left-0 right-0 z-[100] px-6">
        <div className="max-w-4xl mx-auto bg-black/80 border border-white/10 backdrop-blur-[50px] rounded-[3.5rem] p-3 flex items-center gap-3 shadow-2xl">

          {/* Scan manual */}
          <button onClick={() => handleAction()} disabled={status !== 'IDLE'}
            className={`p-5 rounded-full transition-all ${
              status === 'SCANNING'
                ? 'bg-blue-600 animate-pulse shadow-[0_0_20px_#2563eb]'
                : 'bg-white/5 hover:bg-white/10'
            }`}>
            {status === 'SCANNING'
              ? <Loader2 className="w-7 h-7 animate-spin" />
              : <Layers  className="w-7 h-7" />}
          </button>

          {/* Input */}
          <input value={inputText} onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAction()}
            placeholder={status === 'LISTENING' ? 'A escutar ambiente...' : 'Transmitir coordenada de voz para o A.V.E.S...'}
            className="flex-1 bg-transparent border-none outline-none text-lg font-light text-white placeholder:text-white/10 tracking-tight" />

          {/* Botão autónomo */}
          <motion.button onClick={toggleAutonomous} whileTap={{ scale: 0.93 }}
            className={`p-5 rounded-full transition-all relative ${
              autonomous
                ? 'bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-white/40'
            }`}>
            <Radio className={`w-6 h-6 ${autonomous ? 'text-emerald-400' : ''}`} />
            {autonomous && (
              <motion.div className="absolute inset-0 rounded-full border border-emerald-400"
                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }} />
            )}
          </motion.button>

          {/* Mic */}
          <button onClick={toggleListening}
            className={`p-5 rounded-full transition-all ${
              status === 'LISTENING'
                ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-blue-400'
            }`}>
            {status === 'LISTENING'
              ? <StopCircle className="w-7 h-7 text-white" />
              : <Mic        className="w-7 h-7" />}
          </button>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}