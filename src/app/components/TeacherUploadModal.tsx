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

  if (!isOpen) return null;

  // Função auxiliar para transformar o ficheiro em String Base64
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
      // Convertemos o PDF/Imagem para texto legível pela Base de Dados
      const base64String = await convertToBase64(file);

      // Enviamos diretamente para a coleção do Firestore que já funciona!
      await addDoc(collection(db, "materias"), {
        titulo: title,
        descricao: description,
        arquivoUrl: base64String, // Agora o link é a própria string do ficheiro!
        tipo: file.type,
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

          {/* FILE */}
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