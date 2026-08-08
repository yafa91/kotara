import { useState, useRef, useEffect } from "react";
import { useHistorique, useMenu, useDevise } from "../store/AppDataContext";
import "./SupportChatBot.css";

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
};

const REPONSES_STATIQUES: { motsCles: string[]; reponse: string }[] = [
  {
    motsCles: ["bonjour", "salut", "hello", "bonsoir"],
    reponse:
      "Bonjour 👋 Je suis l'assistant Kotara. Demande-moi par exemple : 'quel est mon revenu ce mois' ou 'il reste combien de [produit]'.",
  },
  {
    motsCles: ["prix", "tarif", "abonnement", "coute", "coûte"],
    reponse: "Tu peux consulter et gérer ton abonnement dans Paramètres > Abonnement.",
  },
  {
    motsCles: ["code", "pin", "confirmer le nouveau code"],
    reponse:
      "Pour changer ton code PIN : va dans Paramètres > Sécurité, saisis le nouveau code puis confirme-le.",
  },
  {
    motsCles: ["ajouter un produit", "nouveau produit"],
    reponse: "Tu peux ajouter un produit depuis le menu 'Ajouter des produits'.",
  },
  {
    motsCles: ["employe", "employé", "salarié"],
    reponse: "La gestion des employés se fait dans la section 'Employés' du menu principal.",
  },
  {
    motsCles: ["export", "télécharger", "sauvegarde", "fichier"],
    reponse:
      "Dans Paramètres > Sauvegarde des données, tu peux télécharger un fichier contenant tout (menu, commandes, historique).",
  },
  {
    motsCles: ["contact", "humain", "telephone", "téléphone", "appeler"],
    reponse:
      "Tu peux nous appeler au +33 07 49 45 13 61 (Lun-Sam, 11h-18h) ou écrire à support@warabi.app.",
  },
  {
    motsCles: ["merci"],
    reponse: "Avec plaisir 🙂 Autre chose ?",
  },
];

const REPONSE_DEFAUT =
  "Je n'ai pas de réponse pour ça. Essaie 'revenu du mois', 'stock de [produit]' ou contacte-nous à support@warabi.app.";

function formaterMontant(montant: number, devise: "EUR" | "XOF") {
  if (devise === "XOF") return `${Math.round(montant).toLocaleString("fr-FR")} FCFA`;
  return `${montant.toFixed(2).replace(".", ",")} €`;
}

function estMemeMois(dateIso: string, reference: Date) {
  const d = new Date(dateIso);
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth();
}

function estMemeJour(dateIso: string, reference: Date) {
  const d = new Date(dateIso);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

export default function SupportChatBot() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: "bot", text: "Bonjour 👋 Comment puis-je t'aider ?" },
  ]);
  const [saisie, setSaisie] = useState("");
  const finRef = useRef<HTMLDivElement>(null);

  const { commandes } = useHistorique();
  const { articles } = useMenu();
  const devise = useDevise();

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ouvert]);

  function repondreRevenu(question: string): string | null {
    if (!/(revenu|chiffre d.affaires|\bca\b|recette)/i.test(question)) return null;

    const maintenant = new Date();
    const aujourdhui = /aujourd.?hui|jour/i.test(question);

    const commandesPayees = commandes.filter((c) => c.modePaiement !== "en_attente");
    const filtrees = aujourdhui
      ? commandesPayees.filter((c) => estMemeJour(c.dateCreation, maintenant))
      : commandesPayees.filter((c) => estMemeMois(c.dateCreation, maintenant));

    const total = filtrees.reduce((s, c) => s + c.total, 0);
    const periode = aujourdhui ? "aujourd'hui" : "ce mois-ci";

    return `💰 Revenu ${periode} : ${formaterMontant(total, devise)} (${filtrees.length} vente${
      filtrees.length > 1 ? "s" : ""
    }).`;
  }

  function repondreCommandes(question: string): string | null {
    if (!/(nombre de commande|combien de commande)/i.test(question)) return null;

    const maintenant = new Date();
    const aujourdhui = /aujourd.?hui|jour/i.test(question);
    const filtrees = aujourdhui
      ? commandes.filter((c) => estMemeJour(c.dateCreation, maintenant))
      : commandes.filter((c) => estMemeMois(c.dateCreation, maintenant));

    const periode = aujourdhui ? "aujourd'hui" : "ce mois-ci";
    return `🧾 ${filtrees.length} commande${filtrees.length > 1 ? "s" : ""} ${periode}.`;
  }

  function repondreStock(question: string): string | null {
    if (!/(stock|inventaire|reste|il reste)/i.test(question)) return null;

    // Cherche si un nom de produit précis est mentionné
    const q = question.toLowerCase();
    const articleTrouve = articles.find((a) => q.includes(a.nom.toLowerCase()));

    if (articleTrouve) {
      return `📦 Il reste ${articleTrouve.stock} "${articleTrouve.nom}" en stock.`;
    }

    // Sinon, résumé global de l'inventaire
    const enAlerte = articles.filter((a) => a.stock <= a.seuilAlerte);
    const totalStock = articles.reduce((s, a) => s + a.stock, 0);

    let reponse = `📦 Tu as ${articles.length} produit${
      articles.length > 1 ? "s" : ""
    } au menu, ${totalStock} unités en stock au total.`;

    if (enAlerte.length > 0) {
      const liste = enAlerte
        .slice(0, 5)
        .map((a) => `${a.nom} (${a.stock})`)
        .join(", ");
      reponse += ` ⚠️ Stock bas sur : ${liste}${enAlerte.length > 5 ? "..." : ""}.`;
    }

    return reponse;
  }

  function trouverReponse(question: string): string {
    const reponseRevenu = repondreRevenu(question);
    if (reponseRevenu) return reponseRevenu;

    const reponseCommandes = repondreCommandes(question);
    if (reponseCommandes) return reponseCommandes;

    const reponseStock = repondreStock(question);
    if (reponseStock) return reponseStock;

    const q = question.toLowerCase();
    for (const entry of REPONSES_STATIQUES) {
      if (entry.motsCles.some((mot) => q.includes(mot))) {
        return entry.reponse;
      }
    }

    return REPONSE_DEFAUT;
  }

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