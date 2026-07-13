// ═══════════════════════════════════════════════════════════════════════════
// TeacherUploadModal.tsx
// ───────────────────────────────────────────────────────────────────────────
// Modal simples de upload de matéria: título, descrição, ficheiro (PDF ou
// imagem, convertido para base64) → grava directamente na coleção
// "materias" do Firestore.
//
// ⚠️ REPARA NISTO se te pedirem para "corrigir o upload" ou "porque há
// duas formas de publicar matéria":
// Este ficheiro faz EXACTAMENTE a mesma coisa que o "TeacherModal" que já
// existe dentro de TeacherDashboard.tsx (aba "Enviar Matéria") — os dois
// escrevem para a mesma coleção "materias", com os mesmos campos
// (titulo, descricao, arquivoUrl, tipo, dataCriacao, autor). A única
// diferença real é visual (este é mais simples, sem a aba de "Gerar
// Perguntas" que o outro tem).
//
// Se um exame pedir para "adicionar um campo novo ao upload" (ex: uma
// disciplina/matéria associada), e só editares um dos dois ficheiros, o
// outro continua a funcionar à moda antiga — se este componente estiver
// mesmo a ser usado nalgum sítio da app (confirma com um
// `grep -rn "TeacherUploadModal" src/` no terminal), lembra-te de editar
// os dois em conjunto para não ficarem inconsistentes.
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherUploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Padrão comum a todos os modais desta app: se não estiver aberto, não
  // renderiza nada (evita ter de gerir visibilidade via CSS/classes).
  if (!isOpen) return null;

  // Converte o ficheiro seleccionado (PDF/imagem) para uma string base64,
  // que depois é guardada directamente no campo "arquivoUrl" do documento
  // Firestore — ou seja, o próprio ficheiro fica "dentro" da base de
  // dados, não num link externo. Simples de implementar, mas atenção:
  // ficheiros grandes tornam os documentos do Firestore pesados (o limite
  // por documento é 1 MiB) — se pedirem para suportar ficheiros maiores,
  // a solução certa é subir para o Firebase Storage e guardar só o URL
  // aqui, não o ficheiro inteiro em base64.
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo!");
    if (!title.trim()) return alert("Digite o título!");

    setUploading(true);

    try {
      // Converte o ficheiro para base64 antes de gravar
      const base64String = await convertToBase64(file);

      // Grava directamente na coleção "materias" — é a mesma coleção que
      // o StudentDashboard e o TeacherDashboard leem para mostrar as
      // matérias disponíveis, por isso não precisas de mexer em mais
      // nenhum sítio para isto aparecer lá.
      await addDoc(collection(db, "materias"), {
        titulo: title,
        descricao: description,
        arquivoUrl: base64String, // o próprio conteúdo do ficheiro, não um link
        tipo: file.type,          // ex: "application/pdf", "image/png" — usado para decidir como mostrar o ficheiro depois
        dataCriacao: serverTimestamp(),
        autor: "Professor"
      });

      setUploading(false);
      setTitle('');
      setDescription('');
      setFile(null);
      onClose();
      alert("Matéria publicada com sucesso via Linha de Dados!");
    } catch (error) {
      console.error("Erro ao processar upload:", error);
      alert("Falha no upload de dados.");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
      <div className="bg-[#120a1f] w-full max-w-xl rounded-3xl border border-purple-500/30 text-white">
        {/* HEADER */}
        <div className="p-5 flex justify-between items-center border-b border-white/10">
          <h2 className="font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            Enviar Matéria (Via Protocolo de Dados)
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 space-y-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            className="w-full p-3 h-24 rounded-xl bg-white/5 border border-white/10 text-white"
          />

          {/* FILE — input real fica invisível (opacity-0) por cima da área
              visual, para o clique em qualquer parte desta caixa abrir o
              selector de ficheiros do sistema operativo */}
          <div className="relative border border-dashed border-white/20 rounded-2xl p-6 text-center">
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="text-green-400 flex flex-col items-center gap-2">
                <CheckCircle2 />
                {file.name}
              </div>
            ) : (
              <div className="text-white/40 flex flex-col items-center gap-2">
                <FileText />
                Clique para selecionar arquivo (PDF ou Imagem)
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-4 bg-purple-600 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-white"
          >
            {uploading ? <Loader2 className="animate-spin" /> : "Publicar Matéria"}
          </button>
        </div>
      </div>
    </div>
  );
}