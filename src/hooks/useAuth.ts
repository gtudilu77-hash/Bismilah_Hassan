import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Importação necessária para ler dados do usuário
import { auth, db } from "../firebase"; // 'db' é o seu Firestore exportado

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"aluno" | "professor" | null>(null); // Estado para o cargo
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Quando o user loga, vamos buscar o 'role' dele no Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          }
        } catch (error) {
          console.error("Erro ao buscar papel do usuário:", error);
        }
        setUser(u);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, role, loading };
}