import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnimatedChickenMascot } from './AnimatedChickenMascot';
import {
  Send, ArrowLeft, Mic, Paperclip, Image as ImageIcon, Video,
  Volume2, VolumeX, CheckCircle2, BookOpen, Brain, ListChecks,
  ChevronRight, ChevronLeft, X, RotateCcw, Trophy, Sparkles,
  GraduationCap, Clock, Star, Plus, PanelLeftClose, PanelLeftOpen,
  Menu, FileText, Download, Copy, Check, Loader2
} from 'lucide-react';
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, addDoc, serverTimestamp, doc,
  setDoc, query, orderBy, onSnapshot, limit,
  getDoc, updateDoc, arrayUnion, where
} from "firebase/firestore";

// ─── Env ──────────────────────────────────────────────────────────────────────
const API = 'https://bismilah-hassan-1.onrender.com';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string; text: string; sender: 'user' | 'ai'; timestamp: any;
  file?: string; fileType?: 'image' | 'video' | 'file' | 'audio';
}
interface ChatHistory { id: string; title: string; }
interface ChatInterfaceProps {
  onBack: () => void; isTeacher?: boolean; role?: 'professor' | 'aluno' | 'normal';
}
interface Flashcard { front: string; back: string; mastered: boolean; }
interface QuizQuestion { question: string; options: string[]; correct: number; }
interface Topic { title: string; subtopics: string[]; color: string; }
interface StudyMaterial { titulo: string; descricao?: string; arquivoUrl?: string; tipo?: string; autor?: string; }
type SidePanelMode = 'none' | 'flashcards' | 'quiz' | 'organizer' | 'material';

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  professor: {
    radial: 'radial-gradient(ellipse 90% 55% at 50% 0%, #0b2e1a 0%, #050208 65%)',
    accent: '#10b981', accentB: '#14b8a6',
    accentDim: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.12)',
    borderHover: 'rgba(16,185,129,0.3)',
    userMsg: 'linear-gradient(135deg,#059669,#0d9488)',
    aiMsg: 'rgba(10,31,22,0.85)',
    sidebarBg: 'rgba(3,10,6,0.96)',
    panelBg: 'rgba(2,8,4,0.98)',
    btnGrad: 'linear-gradient(135deg,#059669,#0d9488)',
    btnGlow: '0 6px 24px rgba(16,185,129,0.28)',
    mascoteTheme: 'emerald' as const,
    cloudColor: 'rgba(16,185,129,0.055)',
  },
  aluno: {
    radial: 'radial-gradient(ellipse 90% 55% at 50% 0%, #0b1a2e 0%, #050208 65%)',
    accent: '#3b82f6', accentB: '#6366f1',
    accentDim: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.12)',
    borderHover: 'rgba(59,130,246,0.3)',
    userMsg: 'linear-gradient(135deg,#2563eb,#4f46e5)',
    aiMsg: 'rgba(10,22,47,0.85)',
    sidebarBg: 'rgba(3,6,15,0.96)',
    panelBg: 'rgba(2,4,12,0.98)',
    btnGrad: 'linear-gradient(135deg,#2563eb,#4f46e5)',
    btnGlow: '0 6px 24px rgba(59,130,246,0.28)',
    mascoteTheme: 'blue' as const,
    cloudColor: 'rgba(59,130,246,0.055)',
  },
  normal: {
    radial: 'radial-gradient(ellipse 90% 55% at 50% 0%, #1a0b2e 0%, #050208 65%)',
    accent: '#8b5cf6', accentB: '#d946ef',
    accentDim: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.12)',
    borderHover: 'rgba(139,92,246,0.3)',
    userMsg: 'linear-gradient(135deg,#7c3aed,#c026d3)',
    aiMsg: 'rgba(19,9,36,0.85)',
    sidebarBg: 'rgba(6,2,12,0.96)',
    panelBg: 'rgba(4,1,10,0.98)',
    btnGrad: 'linear-gradient(135deg,#7c3aed,#c026d3)',
    btnGlow: '0 6px 24px rgba(139,92,246,0.28)',
    mascoteTheme: 'purple' as const,
    cloudColor: 'rgba(139,92,246,0.055)',
  },
};

// ─── CSS-only clouds ──────────────────────────────────────────────────────────
function Clouds({ color }: { color: string }) {
  const clouds = [
    { w: 200, h: 65,  top: '6%',  dur: '30s', delay: '0s',   op: 0.9 },
    { w: 260, h: 80,  top: '20%', dur: '42s', delay: '-14s', op: 0.6 },
    { w: 140, h: 48,  top: '36%', dur: '24s', delay: '-7s',  op: 0.5 },
    { w: 220, h: 70,  top: '54%', dur: '36s', delay: '-20s', op: 0.65 },
    { w: 170, h: 55,  top: '70%', dur: '28s', delay: '-9s',  op: 0.45 },
    { w: 240, h: 75,  top: '85%', dur: '38s', delay: '-25s', op: 0.5 },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {clouds.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', top: c.top, left: '-15%',
          width: c.w, height: c.h, opacity: c.op,
          animation: `cloudDrift ${c.dur} linear ${c.delay} infinite`,
        }}>
          <svg viewBox="0 0 220 80" fill={color} style={{ width: '100%', height: '100%', filter: 'blur(3px)' }}>
            <ellipse cx="110" cy="58" rx="100" ry="24" />
            <ellipse cx="75"  cy="44" rx="52"  ry="30" />
            <ellipse cx="145" cy="46" rx="46"  ry="26" />
            <ellipse cx="110" cy="34" rx="38"  ry="24" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ─── Attach Dropdown ──────────────────────────────────────────────────────────
function AttachButton({
  t, fileRef, imageRef, videoRef,
}: {
  t: any;
  fileRef: React.RefObject<HTMLInputElement>;
  imageRef: React.RefObject<HTMLInputElement>;
  videoRef: React.RefObject<HTMLInputElement>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    { label: 'Ficheiro', Icon: Paperclip, inputRef: fileRef },
    { label: 'Imagem',   Icon: ImageIcon, inputRef: imageRef },
    { label: 'Vídeo',    Icon: Video,     inputRef: videoRef },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Anexar"
        style={{
          width: 32, height: 32, borderRadius: 10, border: 'none',
          background: open ? t.accentDim : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? t.accent : 'rgba(255,255,255,0.2)',
          transition: 'all 0.15s ease',
        }}
      >
        <Plus size={16} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 44, left: 0,
          background: 'rgba(12,8,20,0.98)', border: `1px solid ${t.border}`,
          borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(24px)',
          minWidth: 140, zIndex: 200,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
        }}>
          {options.map(({ label, Icon, inputRef }) => (
            <button
              key={label}
              onClick={() => { inputRef.current?.click(); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'none', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 12,
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = t.accentDim)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Icon size={13} style={{ color: t.accent }} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Code block (com botão de copiar) ─────────────────────────────────────────
function CodeBlock({ t, language, value }: { t: any; language?: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ margin: '10px 0', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>{language || 'código'}</span>
        <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: copied ? t.accent : 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '12px 14px', overflowX: 'auto' }} className="custom-scroll">
        <code style={{ fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, whiteSpace: 'pre' }}>{value}</code>
      </pre>
    </div>
  );
}

// ─── Renderizador de Markdown para as mensagens da IA ─────────────────────────
function MarkdownMessage({ text, t }: { text: string; t: any }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ ...props }) => <h1 style={{ fontSize: 18, fontWeight: 900, margin: '4px 0 10px', color: 'rgba(255,255,255,0.95)', lineHeight: 1.3 }} {...props} />,
        h2: ({ ...props }) => <h2 style={{ fontSize: 16, fontWeight: 900, margin: '12px 0 8px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }} {...props} />,
        h3: ({ ...props }) => <h3 style={{ fontSize: 14, fontWeight: 800, margin: '10px 0 6px', color: t.accent, lineHeight: 1.3 }} {...props} />,
        p: ({ ...props }) => <p style={{ margin: '0 0 10px', lineHeight: 1.7 }} {...props} />,
        strong: ({ ...props }) => <strong style={{ fontWeight: 800, color: 'rgba(255,255,255,0.98)' }} {...props} />,
        em: ({ ...props }) => <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.75)' }} {...props} />,
        ul: ({ ...props }) => <ul style={{ margin: '4px 0 12px', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }} {...props} />,
        ol: ({ ...props }) => <ol style={{ margin: '4px 0 12px', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }} {...props} />,
        li: ({ ...props }) => <li style={{ lineHeight: 1.7 }} {...props} />,
        a: ({ ...props }) => <a style={{ color: t.accent, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />,
        blockquote: ({ ...props }) => <blockquote style={{ margin: '8px 0', padding: '8px 14px', borderLeft: `3px solid ${t.accent}`, background: t.accentDim, borderRadius: 8, color: 'rgba(255,255,255,0.7)' }} {...props} />,
        hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${t.border}`, margin: '14px 0' }} />,
        table: ({ ...props }) => <div style={{ overflowX: 'auto', margin: '10px 0' }} className="custom-scroll"><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }} {...props} /></div>,
        thead: ({ ...props }) => <thead style={{ borderBottom: `1px solid ${t.border}` }} {...props} />,
        th: ({ ...props }) => <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 900, color: t.accent, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }} {...props} />,
        td: ({ ...props }) => <td style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }} {...props} />,
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children, ...props }: any) => {
          const isInline = !className;
          const match = /language-(\w+)/.exec(className || '');
          const value = String(children).replace(/\n$/, '');
          if (isInline) {
            return <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 6, fontSize: '0.9em', fontFamily: 'monospace', color: t.accent }} {...props}>{children}</code>;
          }
          return <CodeBlock t={t} language={match?.[1]} value={value} />;
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ─── Leitura real do conteúdo da matéria ──────────────────────────────────────
// Antes, "Perguntar à IA sobre isto" só enviava o título da matéria — a IA
// respondia com o que sabia sobre esse tema, sem nunca ver o documento em
// si. Estas funções extraem o texto real do ficheiro (PDF ou texto simples)
// para ser enviado como contexto à IA, para responder com base no
// conteúdo verdadeiro, não numa suposição a partir do título.

// Decodifica um data URI base64 de texto simples (ex: ficheiros .txt/.md)
function extractPlainText(dataUri: string): string {
  try {
    const base64 = dataUri.split(',')[1] || '';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

// Extrai o texto de um PDF (data URI base64) usando pdf.js.
// O import é dinâmico (lazy) para não engordar o bundle inicial da app com
// uma biblioteca só usada quando alguém realmente abre um PDF no chat.
async function extractPdfText(dataUri: string): Promise<string> {
  const pdfjsLib: any = await import('pdfjs-dist');
  // Worker carregado via CDN, na mesma versão da biblioteca instalada —
  // evita problemas de empacotamento do worker com o Vite.
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const base64 = dataUri.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  let text = '';
  const maxPages = Math.min(pdf.numPages, 30); // limite de segurança para documentos muito extensos
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n\n';
  }
  return text;
}

/** Extrai o conteúdo textual de uma matéria, consoante o seu tipo MIME.
 *  Devolve null se não conseguir extrair texto (ex: imagem, vídeo, tipo
 *  desconhecido) — nesse caso a IA continua a responder só com base no
 *  título/descrição, tal como acontecia antes desta alteração. */
async function extractDocumentText(arquivoUrl: string, tipo?: string): Promise<string | null> {
  if (!arquivoUrl || !tipo) return null;
  try {
    if (tipo === 'application/pdf') {
      const text = await extractPdfText(arquivoUrl);
      return text.trim() ? text.slice(0, 12000) : null; // limite de caracteres, para não sobrecarregar o contexto do modelo
    }
    if (tipo.startsWith('text/')) {
      const text = extractPlainText(arquivoUrl);
      return text.trim() ? text.slice(0, 12000) : null;
    }
  } catch (err) {
    console.error('Erro ao extrair texto do documento:', err);
  }
  return null;
}

// ─── Material (Document Reader) Panel ─────────────────────────────────────────
function MaterialPanel({ t, materia, onAskIA, onContextReady, isMobile }: {
  t: any; materia: StudyMaterial | null; onAskIA: (text: string) => void; onContextReady: (context: string | null) => void; isMobile?: boolean;
}) {
  const [extracting, setExtracting] = useState(false);

  const handleAskAboutThis = async () => {
    if (!materia) return;
    onAskIA(`Explique detalhadamente: ${materia.titulo}`);
    setExtracting(true);
    const context = await extractDocumentText(materia.arquivoUrl || '', materia.tipo);
    onContextReady(context);
    setExtracting(false);
  };

  if (!materia) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: isMobile ? 16 : 20 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.accentDim, border: `1px solid ${t.border}` }}>
            <FileText size={26} style={{ color: `${t.accent}60` }} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, maxWidth: 220, lineHeight: 1.6, margin: '0 0 6px', fontWeight: 600 }}>Nenhuma matéria aberta</p>
            <p style={{ color: `${t.accent}50`, fontSize: 11, maxWidth: 220, lineHeight: 1.6, margin: 0 }}>Abre uma matéria a partir do dashboard para a leres aqui enquanto conversas com a IA</p>
          </div>
        </div>
      </div>
    );
  }

  const isImage = !!materia.tipo?.startsWith('image/');
  const isPdf   = materia.tipo === 'application/pdf';
  const isVideo = !!materia.tipo?.startsWith('video/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: isMobile ? 16 : 20, gap: isMobile ? 12 : 14 }}>
      <div>
        <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: `${t.accent}66`, margin: '0 0 6px' }}>{materia.autor || 'Professor'}</p>
        <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 900, margin: 0, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>{materia.titulo}</h3>
      </div>

      {materia.descricao && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{materia.descricao}</p>
      )}

      <div style={{ flex: 1, borderRadius: 20, overflow: 'hidden', border: `1px solid ${t.border}`, background: 'rgba(0,0,0,0.3)', display: 'flex', minHeight: isMobile ? 220 : 260 }}>
        {!materia.arquivoUrl ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Ficheiro indisponível</p>
          </div>
        ) : isImage ? (
          <img src={materia.arquivoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : isPdf ? (
          <iframe src={materia.arquivoUrl} title={materia.titulo} style={{ width: '100%', height: '100%', border: 'none', minHeight: isMobile ? 360 : 480 }} />
        ) : isVideo ? (
          <video src={materia.arquivoUrl} controls style={{ width: '100%', maxHeight: 360, margin: 'auto' }} />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
            <FileText size={30} style={{ color: `${t.accent}60` }} />
            <a
              href={materia.arquivoUrl}
              download={materia.titulo}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.accent, textDecoration: 'none', padding: '10px 18px', borderRadius: 14, background: t.accentDim, border: `1px solid ${t.border}` }}
            >
              <Download size={12} /> Descarregar ficheiro
            </a>
          </div>
        )}
      </div>

      <button
        onClick={handleAskAboutThis}
        disabled={extracting}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: isMobile ? 11 : 12, borderRadius: 18, cursor: extracting ? 'not-allowed' : 'pointer', background: `linear-gradient(135deg,${t.accent},${t.accentB})`, border: 'none', color: '#000', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', boxShadow: t.btnGlow, flexShrink: 0, opacity: extracting ? 0.7 : 1 }}
      >
        {extracting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
        {extracting ? 'A ler o documento...' : 'Perguntar à IA sobre isto'}
      </button>
    </div>
  );
}

// ─── Flashcard Panel ──────────────────────────────────────────────────────────
function FlashcardPanel({ t, onGenerate, cards, isLoading, isMobile, limitInfo }: {
  t: any; onGenerate: () => void; cards: Flashcard[]; isLoading: boolean; isMobile?: boolean;
  limitInfo?: { remaining: number; message?: string } | null; // null/undefined = sem limite (aluno/professor)
}) {
  const [idx, setIdx]   = useState(0);
  const [flip, setFlip] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  const card     = cards[idx];
  const progress = cards.length > 0 ? (mastered.size / cards.length) * 100 : 0;
  const go = (d: number) => { setFlip(false); setTimeout(() => setIdx(i => (i + d + cards.length) % cards.length), 180); };
  const toggleMaster = () => setMastered(s => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });

  const cardH = isMobile ? 160 : 200;
  const pad   = isMobile ? '16px' : '20px';
  const blocked = !!limitInfo && limitInfo.remaining <= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: pad, gap: isMobile ? 12 : 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}66`, margin: 0 }}>Flashcards</p>
          {cards.length > 0 && <p style={{ fontSize: 11, color: t.accent, margin: '4px 0 0', fontWeight: 700 }}>{idx + 1}<span style={{ opacity: 0.4 }}>/{cards.length}</span></p>}
          {limitInfo && <p style={{ fontSize: 9, color: blocked ? '#f87171' : `${t.accent}80`, margin: '4px 0 0', fontWeight: 700 }}>{limitInfo.remaining}/{LIMIT_PER_DAY} hoje</p>}
        </div>
        <button onClick={onGenerate} disabled={isLoading || blocked} className="tool-btn" style={{ '--ac': t.accent, '--acd': t.accentDim, '--acb': t.border } as any}>
          <Sparkles size={9} /> {isLoading ? 'Gerando...' : 'Gerar'}
        </button>
      </div>

      {blocked && limitInfo?.message && (
        <p style={{ fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '10px 14px', margin: 0 }}>{limitInfo.message}</p>
      )}

      {cards.length > 0 && (
        <div style={{ height: 3, borderRadius: 99, background: `${t.accent}18`, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${progress}%`, background: `linear-gradient(90deg,${t.accent},${t.accentB})`, transition: 'width 0.4s ease' }} />
        </div>
      )}

      {cards.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.accentDim, border: `1px solid ${t.border}` }}>
            <BookOpen size={26} style={{ color: `${t.accent}60` }} />
          </div>
          <div>
            <p style={{ color: `rgba(255,255,255,0.5)`, fontSize: 12, maxWidth: 220, lineHeight: 1.6, margin: '0 0 6px', fontWeight: 600 }}>Nenhum flashcard ainda</p>
            <p style={{ color: `${t.accent}50`, fontSize: 11, maxWidth: 220, lineHeight: 1.6, margin: 0 }}>Clica em "Gerar" para criar flashcards da conversa</p>
          </div>
          <button onClick={onGenerate} disabled={isLoading || blocked} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 20, cursor: blocked ? 'not-allowed' : 'pointer', background: blocked ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${t.accent},${t.accentB})`, border: 'none', color: blocked ? 'rgba(255,255,255,0.3)' : '#000', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', boxShadow: blocked ? 'none' : t.btnGlow }}>
            <Sparkles size={13} /> {isLoading ? 'Gerando...' : 'Gerar Flashcards'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
            <div onClick={() => setFlip(f => !f)} style={{ width: '100%', height: cardH, cursor: 'pointer', transformStyle: 'preserve-3d', position: 'relative', transform: flip ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 24, gap: 12, backfaceVisibility: 'hidden', background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, backdropFilter: 'blur(16px)' }}>
                <div style={{ width: 40, height: 1, background: `linear-gradient(90deg,transparent,${t.accent},transparent)` }} />
                <p style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{card.front}</p>
                <p style={{ fontSize: 9, color: `${t.accent}40`, textTransform: 'uppercase', letterSpacing: '0.35em', margin: 0 }}>clica para revelar</p>
              </div>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 24, gap: 12, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: `linear-gradient(135deg,${t.accentDim},rgba(0,0,0,0.3))`, border: `1px solid ${t.borderHover}` }}>
                <Star size={14} style={{ color: t.accent }} />
                <p style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.92)', textAlign: 'center', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{card.back}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => go(-1)} style={{ width: 38, height: 38, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ChevronLeft size={16} color="rgba(255,255,255,0.35)" /></button>
            <button onClick={toggleMaster} style={{ flex: 1, height: 38, borderRadius: 14, border: `1px solid ${mastered.has(idx) ? t.borderHover : 'rgba(255,255,255,0.07)'}`, background: mastered.has(idx) ? t.accentDim : 'rgba(255,255,255,0.03)', cursor: 'pointer', color: mastered.has(idx) ? t.accent : 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Trophy size={11} /> {mastered.has(idx) ? 'Dominado ✓' : 'Marcar dominado'}
            </button>
            <button onClick={() => go(1)} style={{ width: 38, height: 38, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ChevronRight size={16} color="rgba(255,255,255,0.35)" /></button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Quiz Panel ───────────────────────────────────────────────────────────────
function QuizPanel({ t, onGenerate, questions, isLoading, isMobile, onComplete, limitInfo }: {
  t: any; onGenerate: () => void; questions: QuizQuestion[];
  isLoading: boolean; isMobile?: boolean;
  onComplete?: (score: number, total: number, wrong: string[]) => void;
  limitInfo?: { remaining: number; message?: string } | null;
}) {
  const [idx, setIdx]         = useState(0);
  const [sel, setSel]         = useState<number | null>(null);
  const [score, setScore]     = useState(0);
  const [done, setDone]       = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [wrong, setWrong]     = useState<string[]>([]);   // ← rastreia perguntas erradas
  const blocked = !!limitInfo && limitInfo.remaining <= 0;

  const reset = () => {
    setIdx(0); setSel(null); setScore(0);
    setDone(false); setAnswers([]); setWrong([]);          // ← limpa também wrong
  };

  const confirm = () => {
    if (sel === null) return;
    const newAns = [...answers, sel];
    setAnswers(newAns);

    const isCorrect = sel === questions[idx].correct;
    const newScore  = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(s => s + 1);

    // Acumula perguntas erradas com o texto da pergunta
    const newWrong = isCorrect
      ? wrong
      : [...wrong, questions[idx].question];
    setWrong(newWrong);

    if (idx + 1 >= questions.length) {
      setDone(true);
      onComplete?.(newScore, questions.length, newWrong); // ← ENVIA resultado para o Dashboard
    } else {
      setTimeout(() => { setSel(null); setIdx(i => i + 1); }, 600);
    }
  };

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const q   = questions[idx];
  const r   = isMobile ? 36 : 40;
  const sz  = r * 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: isMobile ? 16 : 20, gap: isMobile ? 12 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}66`, margin: 0 }}>Quiz</p>
          {!done && questions.length > 0 && <p style={{ fontSize: 11, color: t.accent, margin: '4px 0 0', fontWeight: 700 }}>{idx + 1}<span style={{ opacity: 0.4 }}>/{questions.length}</span></p>}
          {limitInfo && <p style={{ fontSize: 9, color: blocked ? '#f87171' : `${t.accent}80`, margin: '4px 0 0', fontWeight: 700 }}>{limitInfo.remaining}/{LIMIT_PER_DAY} hoje</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {done && <button onClick={reset} className="tool-btn" style={{ '--ac': t.accent, '--acd': t.accentDim, '--acb': t.border } as any}><RotateCcw size={9} /> Repetir</button>}
          <button onClick={onGenerate} disabled={isLoading || blocked} className="tool-btn" style={{ '--ac': t.accent, '--acd': t.accentDim, '--acb': t.border } as any}><Sparkles size={9} /> {isLoading ? 'Gerando...' : 'Gerar'}</button>
        </div>
      </div>

      {blocked && limitInfo?.message && (
        <p style={{ fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '10px 14px', margin: 0 }}>{limitInfo.message}</p>
      )}

      {questions.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.accentDim, border: `1px solid ${t.border}` }}><Brain size={26} style={{ color: `${t.accent}60` }} /></div>
          <div>
            <p style={{ color: `rgba(255,255,255,0.5)`, fontSize: 12, maxWidth: 220, lineHeight: 1.6, margin: '0 0 6px', fontWeight: 600 }}>Nenhum quiz ainda</p>
            <p style={{ color: `${t.accent}50`, fontSize: 11, maxWidth: 220, lineHeight: 1.6, margin: 0 }}>Gera um quiz baseado na conversa</p>
          </div>
          <button onClick={onGenerate} disabled={isLoading || blocked} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 20, cursor: blocked ? 'not-allowed' : 'pointer', background: blocked ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${t.accent},${t.accentB})`, border: 'none', color: blocked ? 'rgba(255,255,255,0.3)' : '#000', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', boxShadow: blocked ? 'none' : t.btnGlow }}>
            <Sparkles size={13} /> {isLoading ? 'Gerando...' : 'Gerar Quiz'}
          </button>
        </div>
      ) : done ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ position: 'relative', width: sz, height: sz }}>
            <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={r} cy={r} r={r - 6} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx={r} cy={r} r={r - 6} fill="none" stroke={t.accent} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * (r - 6)}`}
                strokeDashoffset={`${2 * Math.PI * (r - 6) * (1 - pct / 100)}`}
                style={{ filter: `drop-shadow(0 0 6px ${t.accent})`, transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: t.accent }}>{pct}%</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{score}/{questions.length}</span>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600 }}>{pct === 100 ? '🏆 Perfeito!' : pct >= 70 ? '✅ Muito bom!' : '📚 Continua a estudar!'}</p>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }} className="custom-scroll">
            {questions.map((q, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 14, background: answers[i] === q.correct ? `${t.accent}0a` : 'rgba(239,68,68,0.06)', border: `1px solid ${answers[i] === q.correct ? `${t.accent}20` : 'rgba(239,68,68,0.15)'}` }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: answers[i] === q.correct ? t.accent : '#f87171', flexShrink: 0 }}>{answers[i] === q.correct ? '✓' : '✗'}</span>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ height: 3, borderRadius: 99, background: `${t.accent}18`, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(idx / questions.length) * 100}%`, background: `linear-gradient(90deg,${t.accent},${t.accentB})`, transition: 'width 0.4s ease', borderRadius: 99 }} />
          </div>
          <div style={{ padding: isMobile ? '12px 14px' : '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}` }}>
            <p style={{ fontSize: isMobile ? 12 : 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{q.question}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, overflowY: 'auto' }} className="custom-scroll">
            {q.options.map((opt, i) => {
              const isSelected = sel === i;
              const showOk  = sel !== null && i === q.correct;
              const showBad = isSelected && i !== q.correct;
              return (
                <button key={i} onClick={() => sel === null && setSel(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '9px 12px' : '10px 14px', borderRadius: 16, cursor: 'pointer', textAlign: 'left', background: showOk ? `${t.accent}14` : showBad ? 'rgba(239,68,68,0.1)' : isSelected ? t.accentDim : 'rgba(255,255,255,0.025)', border: `1px solid ${showOk ? t.accent : showBad ? '#ef4444' : isSelected ? t.borderHover : 'rgba(255,255,255,0.07)'}`, color: showOk ? t.accent : showBad ? '#f87171' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500, transition: 'all 0.2s ease' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, background: isSelected || showOk ? `${t.accent}20` : 'rgba(255,255,255,0.05)', color: isSelected || showOk ? t.accent : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{['A','B','C','D'][i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
          <button onClick={confirm} disabled={sel === null} style={{ padding: isMobile ? 11 : 12, borderRadius: 18, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: sel !== null ? 'pointer' : 'not-allowed', background: sel !== null ? `linear-gradient(135deg,${t.accent},${t.accentB})` : 'rgba(255,255,255,0.04)', color: sel !== null ? '#000' : 'rgba(255,255,255,0.2)', border: 'none', boxShadow: sel !== null ? t.btnGlow : 'none', transition: 'all 0.2s ease', flexShrink: 0 }}>
            Confirmar →
          </button>
        </>
      )}
    </div>
  );
}

// ─── Organizer Panel ──────────────────────────────────────────────────────────
function OrganizerPanel({ t, onGenerate, topics, isLoading, isMobile, limitInfo }: {
  t: any; onGenerate: () => void; topics: Topic[]; isLoading: boolean; isMobile?: boolean;
  limitInfo?: { remaining: number; message?: string } | null;
}) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const blocked = !!limitInfo && limitInfo.remaining <= 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: isMobile ? 16 : 20, gap: isMobile ? 12 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}66`, margin: 0 }}>Tópicos</p>
          {topics.length > 0 && <p style={{ fontSize: 11, color: t.accent, margin: '4px 0 0', fontWeight: 700 }}>{topics.length} tópicos</p>}
          {limitInfo && <p style={{ fontSize: 9, color: blocked ? '#f87171' : `${t.accent}80`, margin: '4px 0 0', fontWeight: 700 }}>{limitInfo.remaining}/{LIMIT_PER_DAY} hoje</p>}
        </div>
        <button onClick={onGenerate} disabled={isLoading || blocked} className="tool-btn" style={{ '--ac': t.accent, '--acd': t.accentDim, '--acb': t.border } as any}><Sparkles size={9} /> {isLoading ? 'Organizando...' : 'Organizar'}</button>
      </div>
      {blocked && limitInfo?.message && (
        <p style={{ fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '10px 14px', margin: 0 }}>{limitInfo.message}</p>
      )}
      {topics.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.accentDim, border: `1px solid ${t.border}` }}><ListChecks size={26} style={{ color: `${t.accent}60` }} /></div>
          <div>
            <p style={{ color: `rgba(255,255,255,0.5)`, fontSize: 12, maxWidth: 220, lineHeight: 1.6, margin: '0 0 6px', fontWeight: 600 }}>Nada organizado ainda</p>
            <p style={{ color: `${t.accent}50`, fontSize: 11, maxWidth: 220, lineHeight: 1.6, margin: 0 }}>Organiza a matéria em tópicos e subtópicos</p>
          </div>
          <button onClick={onGenerate} disabled={isLoading || blocked} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 20, cursor: blocked ? 'not-allowed' : 'pointer', background: blocked ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${t.accent},${t.accentB})`, border: 'none', color: blocked ? 'rgba(255,255,255,0.3)' : '#000', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', boxShadow: blocked ? 'none' : t.btnGlow }}>
            <Sparkles size={13} /> {isLoading ? 'Organizando...' : 'Organizar Matéria'}
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="custom-scroll">
          {topics.map((topic, i) => (
            <div key={i} style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${expanded === i ? topic.color + '44' : 'rgba(255,255,255,0.06)'}`, background: expanded === i ? `${topic.color}06` : 'rgba(255,255,255,0.02)', transition: 'all 0.2s ease' }}>
              <button onClick={() => setExpanded(expanded === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '11px 14px' : '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: topic.color, boxShadow: `0 0 8px ${topic.color}70`, flexShrink: 0 }} />
                  <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textAlign: 'left' }}>{topic.title}</span>
                </div>
                <ChevronRight size={12} color="rgba(255,255,255,0.2)" style={{ transform: expanded === i ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }} />
              </button>
              {expanded === i && (
                <div style={{ padding: `0 14px 12px`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topic.subtopics.map((sub, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: topic.color, marginTop: 7, flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────
function WelcomeScreen({ t, onChip, isMobile }: { t: any; onChip: (label: string) => void; isMobile?: boolean }) {
  const chips = [
    { icon: GraduationCap, label: 'Explicar um conceito' },
    { icon: ListChecks,    label: 'Resumir a matéria' },
    { icon: Brain,         label: 'Fazer um quiz rápido' },
    { icon: Clock,         label: 'Plano de estudo' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 24 : 36, padding: isMobile ? '0 20px' : '0 48px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 14 : 20, textAlign: 'center' }}>
        <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6em', color: `${t.accent}55`, margin: 0 }}>A.V.E.S Neural Link</p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <h1 style={{ fontSize: isMobile ? 'clamp(22px,6vw,32px)' : 'clamp(28px,4vw,48px)', fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em', background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Como posso
          </h1>
          <h1 style={{ fontSize: isMobile ? 'clamp(22px,6vw,32px)' : 'clamp(28px,4vw,48px)', fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em', background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accentB} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: `drop-shadow(0 0 32px ${t.accent}50)` }}>
            ajudar hoje?
          </h1>
        </div>
        <div style={{ width: 48, height: 2, background: `linear-gradient(90deg,transparent,${t.accent}60,transparent)`, borderRadius: 99 }} />
        <p style={{ fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: 400, maxWidth: 300, lineHeight: 1.6 }}>
          Escolhe uma sugestão ou escreve a tua pergunta abaixo
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: t.accentDim, border: `1px solid ${t.border}` }}>
          <GraduationCap size={11} style={{ color: t.accent }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: `${t.accent}` }}>Apenas conteúdos académicos — fora disso, não respondo</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 520 }}>
        {chips.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => onChip(label)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 14px' : '12px 20px', borderRadius: 24, background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.border}`, color: 'rgba(255,255,255,0.45)', fontSize: isMobile ? 11 : 13, cursor: 'pointer', transition: 'all 0.18s ease', fontWeight: 500 }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = t.accentDim;
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
              (e.currentTarget as HTMLElement).style.borderColor = t.borderHover;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
              (e.currentTarget as HTMLElement).style.borderColor = t.border;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <Icon size={isMobile ? 13 : 15} style={{ color: t.accent }} />{label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Timestamp helper ─────────────────────────────────────────────────────────
function formatTime(ts: any): string {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : ts.toDate?.() ?? new Date(ts);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// ─── useIsMobile hook ─────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
// ─── Limite diário de uso (flashcards / quiz / tópicos) ──────────────────────
// Cada uma destas 3 ferramentas só pode ser gerada 5x por dia, por
// utilizador. Guardado no Firestore (usageLimits/{uid}) para persistir
// entre sessões/dispositivos, não só na memória da aba.
const LIMIT_PER_DAY = 5;

/** Data de hoje no formato YYYY-MM-DD, no fuso horário local do dispositivo
 *  — usada para saber se o contador de um dia anterior deve ser "esquecido". */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ChatInterface({ onBack, isTeacher = false, role }: ChatInterfaceProps) {
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [inputValue,    setInputValue]    = useState('');
  const [isTyping,      setIsTyping]      = useState(false);
  const [isRecording,   setIsRecording]   = useState(false);
  const [voiceEnabled,  setVoiceEnabled]  = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [preview,       setPreview]       = useState<{ file: File; url: string; type: 'image' | 'video' | 'file' } | null>(null);
  const [sidePanel,     setSidePanel]     = useState<SidePanelMode>('none');
  const [flashcards,    setFlashcards]    = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [topics,        setTopics]        = useState<Topic[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<StudyMaterial | null>(null);
  // Texto extraído do documento aberto, guardado aqui até à próxima
  // mensagem ser enviada — nunca é mostrado no chat, só enriquece o que é
  // realmente enviado à IA (ver handleSend).
  const [pendingContext, setPendingContext] = useState<string | null>(null);
  const [toolLoading,   setToolLoading]   = useState<SidePanelMode>('none');
  // Limite diário de 5x para flashcards/quiz/tópicos — ver LIMIT_PER_DAY,
  // consumeUsage() e o useEffect que subscreve usageLimits/{uid} mais abaixo.
  const [usage, setUsage] = useState<{ date: string; flashcards: number; quiz: number; organizer: number }>({
    date: todayKey(), flashcards: 0, quiz: 0, organizer: 0,
  });
  const [limitMessage, setLimitMessage] = useState<{ flashcards?: string; quiz?: string; organizer?: string }>({});
  const [hoveredMsg,    setHoveredMsg]    = useState<string | null>(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);

  const isMobile = useIsMobile(768);
  useEffect(() => { if (isMobile) setSidebarOpen(false); }, [isMobile]);

  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const fileRef          = useRef<HTMLInputElement>(null);
  const imageRef         = useRef<HTMLInputElement>(null);
  const videoRef         = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks      = useRef<Blob[]>([]);
  const globalAudioRef   = useRef<HTMLAudioElement>(new Audio());
  const textareaRef      = useRef<HTMLTextAreaElement>(null);

  const location       = useLocation();
  const navigationRole = location.state?.role;
  const currentRole    = (role || navigationRole || (isTeacher ? 'professor' : 'normal')) as keyof typeof THEMES;
  const t              = THEMES[currentRole] ?? THEMES.normal;

  // ─── Recebe uma matéria (e/ou prompt) vinda do dashboard via navigate(state) ──
  // Abre automaticamente o painel lateral de leitura, tal como o Claude abre
  // um artefacto ao lado da conversa, para o utilizador ler e perguntar em simultâneo.
  useEffect(() => {
    const navState: any = location.state || {};
    if (navState.materia) {
      setActiveMaterial(navState.materia);
      setSidePanel('material');
      if (isMobile) setSidebarOpen(false);
    }
    if (navState.prompt) {
      setInputValue(navState.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sidePanel !== 'none' && !isMobile) setSidebarOpen(false);
  }, [sidePanel, isMobile]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, isMobile ? 80 : 120) + 'px';
  }, [inputValue, isMobile]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  useEffect(() => {
    // ✅ FIX: antes buscava toda a coleção "chats" sem filtro — qualquer
    // utilizador via o histórico (e podia abrir a conversa) de todos os
    // outros. Cada chat já grava "userId" ao ser criado; agora filtramos
    // por ele e re-subscrevemos sempre que o utilizador autenticado muda.
    let unsubChats: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubChats) { unsubChats(); unsubChats = null; }
      if (!u) { setChatHistories([]); return; }
      const q = query(
        collection(db, "chats"),
        where("userId", "==", u.uid),
        orderBy("createdAt", "desc"),
        limit(15)
      );
      unsubChats = onSnapshot(q, snap => setChatHistories(snap.docs.map(d => ({ id: d.id, title: d.data().title || "Protocolo Ativo" }))));
    });
    return () => { unsubAuth(); if (unsubChats) unsubChats(); };
  }, []);

  // ── Limite diário (flashcards/quiz/tópicos) — só se aplica a "normal" ──────
  // Aluno e professor não têm restrição nenhuma; só o utilizador comum
  // (currentRole === 'normal') fica sujeito ao tecto de 5x/dia por ferramenta.
  useEffect(() => {
    let unsubUsage: (() => void) | null = null;
    const unsubAuthUsage = onAuthStateChanged(auth, (u) => {
      if (unsubUsage) { unsubUsage(); unsubUsage = null; }
      if (!u) return;
      unsubUsage = onSnapshot(doc(db, 'usageLimits', u.uid), (snap) => {
        const today = todayKey();
        if (snap.exists()) {
          const d = snap.data() as any;
          setUsage(d.date === today
            ? { date: today, flashcards: d.flashcards || 0, quiz: d.quiz || 0, organizer: d.organizer || 0 }
            : { date: today, flashcards: 0, quiz: 0, organizer: 0 }); // dia mudou — mostra tudo disponível (o reset real na BD só acontece no próximo uso)
        } else {
          setUsage({ date: today, flashcards: 0, quiz: 0, organizer: 0 });
        }
      }, err => console.error(err));
    });
    return () => { unsubAuthUsage(); if (unsubUsage) unsubUsage(); };
  }, []);

  /** Verifica e regista o uso de uma ferramenta com limite diário. Devolve
   *  true se pode avançar, false se já atingiu o limite de hoje. Para
   *  aluno/professor, devolve sempre true (sem limite nenhum). */
  const consumeUsage = async (feature: 'flashcards' | 'quiz' | 'organizer'): Promise<boolean> => {
    if (currentRole !== 'normal') return true; // só o utilizador comum tem limite
    const u = auth.currentUser;
    if (!u) return true;
    try {
      const ref = doc(db, 'usageLimits', u.uid);
      const snap = await getDoc(ref);
      const today = todayKey();
      let current = { date: today, flashcards: 0, quiz: 0, organizer: 0 };
      if (snap.exists()) {
        const d = snap.data() as any;
        if (d.date === today) {
          current = { date: today, flashcards: d.flashcards || 0, quiz: d.quiz || 0, organizer: d.organizer || 0 };
        }
        // se o dia mudou, "current" já começa zerado — reset natural
      }
      if (current[feature] >= LIMIT_PER_DAY) return false;
      current[feature] += 1;
      await setDoc(ref, current); // substitui o documento inteiro de propósito, para o reset de dia ficar sempre correcto
      return true;
    } catch (err) {
      console.error('Erro ao verificar limite de uso diário:', err);
      return true; // falha de rede não deve bloquear o utilizador
    }
  };

  useEffect(() => {
    if (!currentChatId) {
      setMessages([{ id: 'init', text: "A.V.E.S Neural Link Online. Aguardando sincronização de dados...", sender: 'ai', timestamp: new Date() }]);
      return;
    }
    const q = query(collection(db, "chats", currentChatId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() || new Date() })) as Message[]));
  }, [currentChatId]);

  const unlockAudio = () => {
    if (audioUnlocked) return;
    const a = globalAudioRef.current;
    a.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    a.play().then(() => setAudioUnlocked(true)).catch(() => {});
  };

  const speak = async (text: string) => {
    if (!voiceEnabled) return;
    try {
      const res = await fetch(`${API}/api/tts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      globalAudioRef.current.src = URL.createObjectURL(await res.blob());
      await globalAudioRef.current.play();
    } catch {}
  };

  const handleSelectFile = (file: File | null) => {
    if (!file) return;
    const type: 'image' | 'video' | 'file' = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
    setPreview({ file, url: URL.createObjectURL(file), type });
  };

  const toggleRecording = async () => {
    unlockAudio();
    if (isRecording) { mediaRecorderRef.current?.stop(); mediaRecorderRef.current?.stream.getTracks().forEach(tr => tr.stop()); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder; audioChunks.current = [];
      recorder.ondataavailable = e => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        const fd = new FormData(); fd.append("audio", new Blob(audioChunks.current, { type: recorder.mimeType }), "voice.webm");
        const data = await (await fetch(`${API}/api/transcribe`, { method: "POST", body: fd })).json();
        if (data.text) setInputValue(v => v ? v + " " + data.text : data.text);
      };
      recorder.start(); setIsRecording(true);
    } catch { alert("Microfone inacessível!"); }
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !preview) return;
    unlockAudio();
    const user = auth.currentUser; if (!user) return;
    const textToSend = inputValue || `Anexo: ${preview?.file.name}`;
    const cp = preview;
    const contextForAI = pendingContext; // captura antes de limpar — só se aplica a este envio
    setInputValue(''); setPreview(null); setPendingContext(null); setIsTyping(true);
    if (isMobile) setSidebarOpen(false);
    try {
      let chatId = currentChatId;
      if (!chatId) {
        const ref = doc(collection(db, "chats"));
        await setDoc(ref, { title: textToSend.slice(0, 30), createdAt: serverTimestamp(), userId: user.uid });
        chatId = ref.id; setCurrentChatId(chatId);
      }
      let reply = "";
      if (cp) {
        const fd = new FormData();
        let ep = "analyze-file";
        if (cp.type === "image") { fd.append("image", cp.file); ep = "analyze-image"; }
        else if (cp.type === "video") { fd.append("video", cp.file); ep = "analyze-video"; }
        else fd.append("file", cp.file);
        await addDoc(collection(db, "chats", chatId, "messages"), { text: cp.file.name, sender: 'user', file: cp.url, fileType: cp.type, timestamp: serverTimestamp() });
        reply = ((await (await fetch(`${API}/api/${ep}`, { method: "POST", body: fd })).json()).result) || '';
      } else {
        // O que fica gravado/mostrado no chat é sempre o texto limpo
        // (textToSend). O que é enviado à IA pode ser maior — se houver um
        // documento lido (contextForAI), o conteúdo real do ficheiro vai
        // incluído no pedido, para a resposta ser sobre o documento a
        // sério, não uma suposição a partir do título.
        await addDoc(collection(db, "chats", chatId, "messages"), { text: textToSend, sender: 'user', timestamp: serverTimestamp() });
        const messageForAI = contextForAI
          ? `Segue o conteúdo do documento da matéria — usa-o para responder com precisão, em vez de assumires pelo título:\n"""\n${contextForAI}\n"""\n\nPedido do aluno: ${textToSend}`
          : textToSend;
        reply = (await (await fetch(`${API}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: messageForAI, userId: user.uid }) })).json()).reply;
      }
      await addDoc(collection(db, "chats", chatId, "messages"), { text: reply, sender: 'ai', timestamp: serverTimestamp() });
      speak(reply);
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); handleSend(); }
  };

  const getCtx = () => messages.slice(-8).map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');

  const callAI = async (prompt: string) => {
    const res = await fetch(`${API}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: prompt, userId: auth.currentUser?.uid }) });
    return JSON.parse((await res.json()).reply.replace(/```json|```/g, '').trim());
  };

  const generateFlashcards = async () => {
    const allowed = await consumeUsage('flashcards');
    if (!allowed) { setLimitMessage(prev => ({ ...prev, flashcards: `Atingiste o limite de ${LIMIT_PER_DAY} flashcards por dia. Tenta novamente amanhã.` })); return; }
    setToolLoading('flashcards');
    try { setFlashcards((await callAI(`Gera 6 flashcards JSON: [{"front":"...","back":"..."}]. Conversa: ${getCtx()}. Só JSON.`)).map((f: any) => ({ ...f, mastered: false }))); } catch {}
    setToolLoading('none');
  };

  const generateQuiz = async () => {
    const allowed = await consumeUsage('quiz');
    if (!allowed) { setLimitMessage(prev => ({ ...prev, quiz: `Atingiste o limite de ${LIMIT_PER_DAY} quizzes por dia. Tenta novamente amanhã.` })); return; }
    setToolLoading('quiz');
    try { setQuizQuestions(await callAI(`Cria 5 perguntas JSON: [{"question":"...","options":["A","B","C","D"],"correct":0}]. Conversa: ${getCtx()}. Só JSON.`)); } catch {}
    setToolLoading('none');
  };

  const generateOrganizer = async () => {
    const allowed = await consumeUsage('organizer');
    if (!allowed) { setLimitMessage(prev => ({ ...prev, organizer: `Atingiste o limite de ${LIMIT_PER_DAY} organizações de tópicos por dia. Tenta novamente amanhã.` })); return; }
    setToolLoading('organizer');
    const colors = [t.accent, '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];
    try { setTopics((await callAI(`Organiza em tópicos JSON: [{"title":"...","subtopics":["..."]}]. Máx 5. Conversa: ${getCtx()}. Só JSON.`)).map((tp: any, i: number) => ({ ...tp, color: colors[i % colors.length] }))); } catch {}
    setToolLoading('none');
  };

  // ─── Callback chamada quando o quiz termina ────────────────────────────────
  // Grava o resultado directamente no Firestore (studentStats/{uid}), em vez
  // de depender de uma função global exposta pelo StudentDashboard — assim
  // funciona mesmo que o aluno nunca tenha passado pelo Dashboard nesta sessão.
  const handleQuizComplete = useCallback(async (score: number, total: number, wrong: string[]) => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    const topic = lastUserMsg?.text?.slice(0, 40) || 'Quiz';

    const result = {
      topic,
      score,
      total,
      date: new Date().toLocaleDateString('pt-PT'),
      wrong,
    };

    // Só regista progresso para alunos — professor/normal também podem fazer
    // quizzes no chat normalmente, mas não têm nenhum "Progresso" onde isto
    // apareceria, por isso não faz sentido criar esse documento para eles.
    if (currentRole !== 'aluno') return;

    const u = auth.currentUser;
    if (!u) return;
    try {
      const ref = doc(db, "studentStats", u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { recentResults: arrayUnion(result), totalQuizzes: (snap.data().totalQuizzes || 0) + 1 });
      } else {
        await setDoc(ref, { totalQuizzes: 1, recentResults: [result], streak: 1 });
      }
    } catch (err) {
      console.error('Erro ao gravar resultado do quiz:', err);
    }
  }, [messages, currentRole]);

  const togglePanel = (mode: SidePanelMode) => {
    setSidePanel(p => p === mode ? 'none' : mode);
    if (isMobile) setSidebarOpen(false);
  };

  const TOOLS = [
    { id: 'material'   as SidePanelMode, icon: FileText,   label: 'Matéria' },
    { id: 'flashcards' as SidePanelMode, icon: BookOpen,   label: 'Cards' },
    { id: 'quiz'       as SidePanelMode, icon: Brain,      label: 'Quiz' },
    { id: 'organizer'  as SidePanelMode, icon: ListChecks, label: 'Tópicos' },
  ];

  const showWelcome = messages.length <= 1;

  const sidebarW    = isMobile ? '80vw' : 272;
  const studyPanelW = isMobile ? '100vw' : 440;

  const showBackdrop = isMobile && (sidebarOpen || sidePanel !== 'none');

  return (
    <div style={{ minHeight: '100vh', height: '100vh', backgroundColor: '#050208', color: '#fff', display: 'flex', overflow: 'hidden', position: 'relative', fontFamily: "'Sora','DM Sans',sans-serif" }}>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: t.radial, pointerEvents: 'none' }} />
      <Clouds color={t.cloudColor} />

      {showBackdrop && (
        <div
          onClick={() => { setSidebarOpen(false); setSidePanel('none'); }}
          style={{ position: 'fixed', inset: 0, zIndex: 25, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: isMobile ? 'fixed' : 'relative',
        zIndex: 30,
        left: isMobile ? (sidebarOpen ? 0 : '-80vw') : 0,
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        background: t.sidebarBg,
        borderRight: `1px solid ${t.border}`,
        backdropFilter: 'blur(32px)',
        width: isMobile ? '80vw' : (sidebarOpen ? 272 : 0),
        maxWidth: isMobile ? 320 : undefined,
        overflow: 'hidden',
        transition: isMobile
          ? 'left 0.3s cubic-bezier(0.4,0,0.2,1)'
          : 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: isMobile && sidebarOpen ? '4px 0 40px rgba(0,0,0,0.5)' : 'none',
      }}>
        <div style={{ width: isMobile ? '100%' : 272, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: isMobile ? '20px 16px 16px' : '24px 20px 20px', borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={onBack} className="back-btn" style={{ '--ac': t.accent } as any}>
                <ArrowLeft size={13} /> Voltar
              </button>
              {isMobile && (
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4 }}>
                  <X size={16} />
                </button>
              )}
            </div>
            <button onClick={() => { setCurrentChatId(null); if (isMobile) setSidebarOpen(false); }} style={{ width: '100%', padding: '13px 0', borderRadius: 18, background: t.btnGrad, boxShadow: t.btnGlow, border: 'none', color: '#000', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', marginTop: 14 }}>
              + New Protocol
            </button>
          </div>

          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 20px', borderBottom: `1px solid ${t.border}` }}>
              <div style={{ padding: 16, borderRadius: 28, background: t.accentDim, border: `1px solid ${t.border}`, boxShadow: `0 0 40px ${t.accent}10` }}>
                <AnimatedChickenMascot size="medium" isGesturing={isTyping} theme={t.mascoteTheme} />
              </div>
              <p style={{ marginTop: 12, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5em', color: `${t.accent}50` }}>A.V.E.S Neural Link</p>
              <div style={{ width: 48, height: 1, marginTop: 6, background: `linear-gradient(90deg,transparent,${t.accent}50,transparent)`, animation: 'linePulse 2.5s ease-in-out infinite' }} />
            </div>
          )}

          <div style={{ padding: isMobile ? '12px 12px 10px' : '14px 14px 10px', borderBottom: `1px solid ${t.border}` }}>
            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}35`, margin: '0 0 10px 4px' }}>Estudo</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {TOOLS.map(({ id, icon: Icon, label }) => {
                const active = sidePanel === id;
                return (
                  <button key={id} onClick={() => togglePanel(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: isMobile ? '10px 4px' : '11px 6px', borderRadius: 18, cursor: 'pointer', background: active ? `linear-gradient(135deg,${t.accent}18,${t.accentB}0a)` : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? t.borderHover : 'rgba(255,255,255,0.06)'}`, boxShadow: active ? `0 0 18px ${t.accent}18` : 'none', transition: 'all 0.2s ease' }}>
                    <Icon size={15} style={{ color: active ? t.accent : 'rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: active ? t.accent : 'rgba(255,255,255,0.2)' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="custom-scroll">
            <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: `${t.accent}35`, margin: '0 0 10px 4px' }}>Histórico</p>
            {chatHistories.map(chat => {
              const active = currentChatId === chat.id;
              return (
                <div key={chat.id} onClick={() => { setCurrentChatId(chat.id); if (isMobile) setSidebarOpen(false); }} style={{ padding: '9px 12px', borderRadius: 16, cursor: 'pointer', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, background: active ? `${t.accent}12` : 'transparent', border: `1px solid ${active ? t.borderHover : 'transparent'}`, transition: 'all 0.15s ease' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: active ? t.accent : 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.28)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {!isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          title="Mostrar sidebar"
          style={{
            position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
            zIndex: 30, width: 28, height: 64,
            background: t.sidebarBg, border: `1px solid ${t.border}`,
            borderLeft: 'none', borderRadius: '0 16px 16px 0',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: `${t.accent}70`, backdropFilter: 'blur(24px)',
            transition: 'all 0.15s ease',
            boxShadow: `4px 0 24px rgba(0,0,0,0.3)`,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.accent; (e.currentTarget as HTMLElement).style.width = '34px'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = `${t.accent}70`; (e.currentTarget as HTMLElement).style.width = '28px'; }}
        >
          <PanelLeftOpen size={13} />
        </button>
      )}

      {/* ── STUDY PANEL ── */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        right: isMobile ? 0 : undefined,
        top: isMobile ? 0 : undefined,
        zIndex: isMobile ? 35 : 20,
        height: '100vh',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: sidePanel !== 'none' ? (isMobile ? '100vw' : 440) : 0,
        opacity: sidePanel !== 'none' ? 1 : 0,
        transition: isMobile
          ? 'opacity 0.2s ease'
          : 'width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
        background: t.panelBg,
        borderRight: !isMobile ? `1px solid ${t.border}` : 'none',
        borderLeft: isMobile ? `1px solid ${t.border}` : 'none',
        pointerEvents: sidePanel !== 'none' ? 'auto' : 'none',
      }}>
        {sidePanel !== 'none' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!isMobile && (
                  <button
                    onClick={() => setSidebarOpen(v => !v)}
                    title={sidebarOpen ? 'Ocultar menu' : 'Mostrar menu'}
                    style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${t.border}`, background: t.accentDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent }}
                  >
                    {sidebarOpen ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
                  </button>
                )}
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: t.accent }}>
                  {sidePanel === 'material' ? 'Matéria' : sidePanel === 'flashcards' ? 'Flashcards' : sidePanel === 'quiz' ? 'Quiz' : 'Tópicos'}
                </span>
              </div>
              <button onClick={() => setSidePanel('none')} style={{ width: 30, height: 30, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} color="rgba(255,255,255,0.35)" />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
              {TOOLS.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setSidePanel(id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: isMobile ? '9px 0' : '10px 0', background: 'none', border: 'none', borderBottom: `2px solid ${sidePanel === id ? t.accent : 'transparent'}`, cursor: 'pointer', color: sidePanel === id ? t.accent : 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.15s ease' }}>
                  <Icon size={11} /> {label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
              {sidePanel === 'material' && (
                <MaterialPanel
                  t={t}
                  materia={activeMaterial}
                  onAskIA={(text) => { setInputValue(text); textareaRef.current?.focus(); }}
                  onContextReady={setPendingContext}
                  isMobile={isMobile}
                />
              )}
              {sidePanel === 'flashcards' && (
                <FlashcardPanel
                  t={t} cards={flashcards} onGenerate={generateFlashcards} isLoading={toolLoading === 'flashcards'} isMobile={isMobile}
                  limitInfo={currentRole === 'normal' ? { remaining: Math.max(0, LIMIT_PER_DAY - usage.flashcards), message: limitMessage.flashcards } : null}
                />
              )}
              {sidePanel === 'quiz' && (
                <QuizPanel
                  t={t}
                  questions={quizQuestions}
                  onGenerate={generateQuiz}
                  isLoading={toolLoading === 'quiz'}
                  isMobile={isMobile}
                  onComplete={handleQuizComplete}
                  limitInfo={currentRole === 'normal' ? { remaining: Math.max(0, LIMIT_PER_DAY - usage.quiz), message: limitMessage.quiz } : null}
                />
              )}
              {sidePanel === 'organizer' && (
                <OrganizerPanel
                  t={t} topics={topics} onGenerate={generateOrganizer} isLoading={toolLoading === 'organizer'} isMobile={isMobile}
                  limitInfo={currentRole === 'normal' ? { remaining: Math.max(0, LIMIT_PER_DAY - usage.organizer), message: limitMessage.organizer } : null}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MAIN CHAT ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, height: '100vh', minWidth: 0, overflow: 'hidden' }}>

        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${t.border}`, background: t.sidebarBg, backdropFilter: 'blur(24px)', flexShrink: 0, zIndex: 15 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, borderRadius: 12, border: `1px solid ${t.border}`, background: t.accentDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accent }}>
              <Menu size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, animation: 'glowPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: `${t.accent}80` }}>A.V.E.S</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {TOOLS.map(({ id, icon: Icon }) => (
                <button key={id} onClick={() => togglePanel(id)} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${sidePanel === id ? t.borderHover : t.border}`, background: sidePanel === id ? t.accentDim : 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sidePanel === id ? t.accent : 'rgba(255,255,255,0.25)' }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>
        )}

        {showWelcome ? (
          <WelcomeScreen t={t} onChip={setInputValue} isMobile={isMobile} />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px' : '24px 32px', display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }} className="custom-scroll">
            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className="msg-enter"
                style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}
                onMouseEnter={() => setHoveredMsg(msg.id)}
                onMouseLeave={() => setHoveredMsg(null)}
              >
                <div style={{ maxWidth: isMobile ? '88%' : 'clamp(240px, 65%, 560px)' }}>
                  <p style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: 5, paddingLeft: 4, paddingRight: 4, textAlign: msg.sender === 'user' ? 'right' : 'left', color: msg.sender === 'user' ? 'rgba(255,255,255,0.2)' : `${t.accent}60` }}>
                    {msg.sender === 'user' ? 'Operador' : 'A.V.E.S'}
                  </p>
                  <div style={{ padding: isMobile ? '12px 16px' : '16px 22px', fontSize: isMobile ? 12 : 13, lineHeight: 1.7, whiteSpace: msg.sender === 'user' ? 'pre-wrap' : 'normal', background: msg.sender === 'user' ? t.userMsg : t.aiMsg, borderRadius: msg.sender === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px', border: `1px solid ${msg.sender === 'user' ? 'rgba(255,255,255,0.1)' : t.border}`, backdropFilter: 'blur(16px)', color: 'rgba(255,255,255,0.88)', wordBreak: 'break-word' }}>
                    {msg.sender === 'ai' ? <MarkdownMessage text={msg.text} t={t} /> : msg.text}
                    {msg.file && (
                      <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {msg.fileType === 'image' && <img src={msg.file} style={{ width: '100%', maxHeight: isMobile ? 200 : 280, objectFit: 'contain' }} />}
                        {msg.fileType === 'video' && <video src={msg.file} controls style={{ width: '100%', maxHeight: isMobile ? 200 : 280 }} />}
                      </div>
                    )}
                  </div>
                  <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', paddingLeft: 4, paddingRight: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 8, color: `${t.accent}35`, transition: 'opacity 0.15s', opacity: hoveredMsg === msg.id ? 1 : 0 }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.sender === 'ai' && (
                    <div style={{ display: 'flex', gap: 6, paddingLeft: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      <CheckCircle2 size={8} style={{ color: t.accent }} />
                      <span style={{ fontSize: 8, color: `${t.accent}40`, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Sincronizado</span>
                      <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
                      <button onClick={() => { togglePanel('flashcards'); generateFlashcards(); }} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${t.accent}60`, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, padding: 0 }}><BookOpen size={8} /> Cards</button>
                      <button onClick={() => { togglePanel('quiz'); generateQuiz(); }} style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${t.accent}60`, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, padding: 0 }}><Brain size={8} /> Quiz</button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 18px', borderRadius: '4px 20px 20px 20px', background: t.aiMsg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, animation: `typingBounce 0.9s ease-in-out ${d}s infinite` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: `${t.accent}60` }}>A processar</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ── INPUT ── */}
        <div style={{ padding: isMobile ? '8px 12px 12px' : (showWelcome ? '0 24px 32px' : '0 24px 24px'), flexShrink: 0 }}>
          {preview && (
            <div style={{ marginBottom: 8, padding: '9px 14px', borderRadius: 16, background: t.accentDim, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: isMobile ? '100%' : 640, margin: `0 auto 8px` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                  {preview.type === 'image' ? <img src={preview.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Paperclip size={14} style={{ color: t.accent }} />}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: t.accent }}>Neural Ready</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', maxWidth: isMobile ? 140 : 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.file.name}</p>
                </div>
              </div>
              <button onClick={() => setPreview(null)} style={{ fontSize: 9, fontWeight: 900, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>✕</button>
            </div>
          )}

          {pendingContext && (
            <div style={{ marginBottom: 8, padding: '7px 14px', borderRadius: 14, background: t.accentDim, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8, maxWidth: isMobile ? '100%' : 640, margin: `0 auto 8px` }}>
              <FileText size={12} style={{ color: t.accent, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 10, color: t.accent, fontWeight: 700 }}>A IA vai ler o conteúdo do documento nesta resposta</p>
            </div>
          )}

          <div style={{ maxWidth: isMobile ? '100%' : 640, margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -1, borderRadius: isMobile ? 22 : 28, background: `linear-gradient(135deg,${t.accent}25,${t.accentB}15)`, filter: 'blur(6px)', pointerEvents: 'none', animation: 'glowPulse 3s ease-in-out infinite' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: isMobile ? 4 : 6, padding: isMobile ? '6px 6px 6px 10px' : '8px 8px 8px 12px', borderRadius: isMobile ? 22 : 28, background: 'rgba(6,4,12,0.9)', border: `1px solid ${t.border}`, backdropFilter: 'blur(32px)' }}>
              <div style={{ paddingRight: isMobile ? 6 : 8, borderRight: `1px solid ${t.border}`, alignSelf: 'center' }}>
                <AttachButton t={t} fileRef={fileRef} imageRef={imageRef} videoRef={videoRef} />
              </div>
              <button onClick={toggleRecording} style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 10, border: 'none', background: isRecording ? 'rgba(239,68,68,0.15)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isRecording ? '#f87171' : 'rgba(255,255,255,0.2)', flexShrink: 0, alignSelf: 'center' }}>
                <Mic size={isMobile ? 14 : 16} />
              </button>
              <button onClick={() => { unlockAudio(); setVoiceEnabled(!voiceEnabled); }} style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 10, border: 'none', background: voiceEnabled ? t.accentDim : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: voiceEnabled ? t.accent : 'rgba(255,255,255,0.2)', flexShrink: 0, alignSelf: 'center' }}>
                {voiceEnabled ? <Volume2 size={isMobile ? 14 : 16} /> : <VolumeX size={isMobile ? 14 : 16} />}
              </button>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isMobile ? "Escreve aqui..." : "Transmitir diretiva..."}
                rows={1}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: isMobile ? 14 : 13, color: 'rgba(255,255,255,0.85)', padding: isMobile ? '5px 6px' : '7px 8px', caretColor: t.accent, resize: 'none', lineHeight: 1.5, maxHeight: isMobile ? 80 : 120, overflowY: 'auto', fontFamily: 'inherit' }}
                className="custom-scroll"
              />
              <button onClick={handleSend} disabled={isTyping} style={{ width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: isMobile ? 18 : 20, background: t.btnGrad, boxShadow: t.btnGlow, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
                <Send size={isMobile ? 14 : 16} color="#000" />
              </button>
            </div>
            {!isMobile && (
              <p style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.12)', marginTop: 8 }}>Enter para enviar · Shift+Enter para nova linha · Apenas conteúdos académicos</p>
            )}
          </div>
        </div>
      </main>

      <input type="file" ref={fileRef}  hidden onChange={e => handleSelectFile(e.target.files?.[0] || null)} />
      <input type="file" ref={imageRef} hidden accept="image/*" onChange={e => handleSelectFile(e.target.files?.[0] || null)} />
      <input type="file" ref={videoRef} hidden accept="video/*" onChange={e => handleSelectFile(e.target.files?.[0] || null)} />

      <style>{`
        @keyframes cloudDrift    { from{transform:translateX(0)} to{transform:translateX(115vw)} }
        @keyframes spin          { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes typingBounce  { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-5px);opacity:1} }
        @keyframes glowPulse     { 0%,100%{opacity:0.5} 50%{opacity:0.9} }
        @keyframes linePulse     { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes msgIn         { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .msg-enter               { animation: msgIn 0.32s ease forwards }
        .custom-scroll::-webkit-scrollbar       { width:3px }
        .custom-scroll::-webkit-scrollbar-track { background:transparent }
        .custom-scroll::-webkit-scrollbar-thumb { background:${t.accent}28; border-radius:99px }
        .tool-btn  { display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:12px;cursor:pointer;border:1px solid var(--acb);background:var(--acd);color:var(--ac);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em }
        .tool-btn:disabled { opacity:0.5;cursor:not-allowed }
        .back-btn  { display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;color:var(--ac);opacity:0.5;transition:opacity 0.15s }
        .back-btn:hover { opacity:0.85 }
        textarea::placeholder { color:rgba(255,255,255,0.25) }
        @media (max-width:768px) {
          .tool-btn { padding:5px 8px; font-size:8px; }
        }
      `}</style>
    </div>
  );
}