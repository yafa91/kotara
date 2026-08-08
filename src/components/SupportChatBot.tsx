import { useState, useRef, useEffect } from "react";
import "./SupportChatBot.css";

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
};

// -----------------------------------------------
// 1) Base de réponses : ajoute/modifie ici tes Q/R
// -----------------------------------------------
const REPONSES: { motsCles: string[]; reponse: string }[] = [
  {
    motsCles: ["bonjour", "salut", "hello", "bonsoir"],
    reponse: "Bonjour 👋 Je suis l'assistant Kotara. Pose-moi une question (facturation, produits, employés, code PIN...).",
  },
  {
    motsCles: ["prix", "tarif", "abonnement", "coute", "coûte"],
    reponse: "Tu peux consulter et gérer ton abonnement dans Paramètres > Abonnement.",
  },
  {
    motsCles: ["code", "pin", "mot de passe", "confirmer le nouveau code"],
    reponse: "Pour changer ton code PIN : va dans Paramètres > Sécurité, saisis le nouveau code puis confirme-le.",
  },
  {
    motsCles: ["produit", "ajouter un produit", "inventaire"],
    reponse: "Tu peux ajouter un produit depuis le menu 'Ajouter des produits', ou gérer ton stock dans 'Inventaire'.",
  },
  {
    motsCles: ["employe", "employé", "salarié"],
    reponse: "La gestion des employés se fait dans la section 'Employés' du menu principal.",
  },
  {
    motsCles: ["export", "télécharger", "sauvegarde", "fichier"],
    reponse: "Dans Paramètres > Sauvegarde des données, tu peux télécharger un fichier contenant tout (menu, commandes, historique).",
  },
  {
    motsCles: ["contact", "humain", "telephone", "téléphone", "appeler"],
    reponse: "Tu peux nous appeler au +33 07 49 45 13 61 (Lun-Sam, 11h-18h) ou écrire à support@warabi.app.",
  },
  {
    motsCles: ["merci"],
    reponse: "Avec plaisir 🙂 Autre chose ?",
  },
];

const REPONSE_DEFAUT =
  "Je n'ai pas de réponse pré-écrite pour ça. Contacte-nous à support@warabi.app ou au +33 07 49 45 13 61.";

function trouverReponse(question: string): string {
  const q = question.toLowerCase();
  for (const entry of REPONSES) {
    if (entry.motsCles.some((mot) => q.includes(mot))) {
      return entry.reponse;
    }
  }
  return REPONSE_DEFAUT;
}

export default function SupportChatBot() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "bot", text: "Bonjour 👋 Comment puis-je t'aider ?" },
  ]);
  const [saisie, setSaisie] = useState("");
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ouvert]);

  function envoyer() {
    const texte = saisie.trim();
    if (!texte) return;

    const messageUser: Message = { id: Date.now(), from: "user", text: texte };
    const reponse: Message = {
      id: Date.now() + 1,
      from: "bot",
      text: trouverReponse(texte),
    };

    setMessages((prev) => [...prev, messageUser, reponse]);
    setSaisie("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") envoyer();
  }

  return (
    <div className="chatbot-container">
      {ouvert && (
        <div className="chatbot-fenetre">
          <div className="chatbot-header">
            <span>Assistant Kotara</span>
            <button className="chatbot-fermer" onClick={() => setOuvert(false)}>
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`chatbot-bulle chatbot-bulle-${m.from}`}>
                {m.text}
              </div>
            ))}
            <div ref={finRef} />
          </div>

          <div className="chatbot-saisie">
            <input
              type="text"
              placeholder="Écris ta question..."
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button onClick={envoyer}>Envoyer</button>
          </div>
        </div>
      )}

      <button className="chatbot-bouton" onClick={() => setOuvert((o) => !o)}>
        {ouvert ? "✕" : "💬"}
      </button>
    </div>
  );
}