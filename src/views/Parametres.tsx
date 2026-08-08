import { useState } from 'react';
import AbonnementDetail from './AbonnementDetail';
import { useParametres, useCategories } from '../store/AppDataContext';
import './Parametres.css';

interface ParametresProps {
  planActuel: 'standard' | 'premium' | null;
  onChangerPlan: (plan: 'standard' | 'premium') => void;
}

export default function Parametres({ planActuel, onChangerPlan }: ParametresProps) {
  const [vue, setVue] = useState<'liste' | 'abonnement'>('liste');
  const { parametres, modifierParametres, verifierCodeAdmin } = useParametres();
  const { categories, ajouterCategorie, supprimerCategorie } = useCategories();

  // Infos du restaurant
  const [nomResto, setNomResto] = useState(parametres.nomResto);
  const [adresseResto, setAdresseResto] = useState(parametres.adresseResto);
  const [telephoneResto, setTelephoneResto] = useState(parametres.telephoneResto);
  const [messageInfos, setMessageInfos] = useState('');

  // Sécurité
  const [ancienCode, setAncienCode] = useState('');
  const [nouveauCode, setNouveauCode] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [messageSecurite, setMessageSecurite] = useState('');

  // Compte
  const [identifiantCompte, setIdentifiantCompte] = useState(parametres.identifiantCompte);
  const [motDePasseCompte, setMotDePasseCompte] = useState(parametres.motDePasseCompte);
  const [messageCompte, setMessageCompte] = useState('');

  // Catégories
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [messageCategorie, setMessageCategorie] = useState('');

  if (vue === 'abonnement') {
    return (
      <AbonnementDetail
        planActuel={planActuel}
        dateEcheance="12 août 2026"
        expire={false}
        onRetour={() => setVue('liste')}
        onChangerPlan={onChangerPlan}
      />
    );
  }

  const handleEnregistrerInfos = () => {
    modifierParametres({ nomResto, adresseResto, telephoneResto });
    setMessageInfos('Enregistré ✅');
    setTimeout(() => setMessageInfos(''), 2000);
  };

  const handleChangerCode = () => {
    setMessageSecurite('');
    if (!verifierCodeAdmin(ancienCode)) {
      setMessageSecurite('Ancien code incorrect');
      return;
    }
    if (nouveauCode.length < 4) {
      setMessageSecurite('Le nouveau code doit faire au moins 4 chiffres');
      return;
    }
    if (nouveauCode !== confirmationCode) {
      setMessageSecurite('Les deux codes ne correspondent pas');
      return;
    }
    modifierParametres({ codeAdmin: nouveauCode });
    setAncienCode('');
    setNouveauCode('');
    setConfirmationCode('');
    setMessageSecurite('Code mis à jour ✅');
    setTimeout(() => setMessageSecurite(''), 2000);
  };

  const handleTelechargerSauvegarde = () => {
    const sauvegarde: Record<string, unknown> = {};
    Object.keys(window.localStorage)
      .filter((cle) => cle.startsWith('kotara_'))
      .forEach((cle) => {
        try {
          sauvegarde[cle] = JSON.parse(window.localStorage.getItem(cle) || 'null');
        } catch {
          sauvegarde[cle] = window.localStorage.getItem(cle);
        }
      });

    const blob = new Blob([JSON.stringify(sauvegarde, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    lien.href = url;
    lien.download = `kotara-sauvegarde-${date}.json`;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
  };

  const handleEnregistrerCompte = () => {
    if (!identifiantCompte.trim() || !motDePasseCompte.trim()) {
      setMessageCompte('Identifiant et mot de passe requis');
      return;
    }
    modifierParametres({ identifiantCompte, motDePasseCompte });
    setMessageCompte('Enregistré ✅');
    setTimeout(() => setMessageCompte(''), 2000);
  };

  const handleAjouterCategorie = () => {
    const nom = nouvelleCategorie.trim();
    if (!nom) return;
    if (categories.some((c) => c.toLowerCase() === nom.toLowerCase())) {
      setMessageCategorie('Cette catégorie existe déjà');
      setTimeout(() => setMessageCategorie(''), 2000);
      return;
    }
    ajouterCategorie(nom);
    setNouvelleCategorie('');
  };

  const handleSupprimerCategorie = (nom: string) => {
    const confirme = window.confirm(
      `Supprimer la catégorie "${nom}" ? Les articles déjà classés dedans garderont cette catégorie.`
    );
    if (confirme) supprimerCategorie(nom);
  };

  return (
    <div className="parametres">
      <h2>Paramètres</h2>

      <section className="parametres-section">
        <h3>Infos du restaurant</h3>
        <div className="parametres-carte">
          <label className="parametres-champ">
            <span>Nom du restaurant</span>
            <input
              type="text"
              value={nomResto}
              onChange={(e) => setNomResto(e.target.value)}
            />
          </label>
          <label className="parametres-champ">
            <span>Adresse</span>
            <input
              type="text"
              value={adresseResto}
              onChange={(e) => setAdresseResto(e.target.value)}
            />
          </label>
          <label className="parametres-champ">
            <span>Téléphone</span>
            <input
              type="text"
              value={telephoneResto}
              onChange={(e) => setTelephoneResto(e.target.value)}
            />
          </label>
          <div className="parametres-actions">
            <button className="parametres-bouton" onClick={handleEnregistrerInfos}>
              Enregistrer
            </button>
            {messageInfos && <span className="parametres-message">{messageInfos}</span>}
          </div>
        </div>
      </section>

      <section className="parametres-section">
        <h3>Catégories de produits</h3>
        <div className="parametres-carte">
          <p className="parametres-sous-titre">
            Ajoute, renomme ou supprime les catégories utilisées dans "Menu / produits".
          </p>
          <ul className="parametres-liste-categories">
            {categories.map((cat) => (
              <li key={cat} className="parametres-categorie-ligne">
                <span>{cat}</span>
                <button
                  type="button"
                  className="parametres-categorie-supprimer"
                  onClick={() => handleSupprimerCategorie(cat)}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
          <div className="parametres-actions">
            <input
              type="text"
              placeholder="Nouvelle catégorie (ex: Épicerie)"
              value={nouvelleCategorie}
              onChange={(e) => setNouvelleCategorie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAjouterCategorie();
                }
              }}
            />
            <button className="parametres-bouton" onClick={handleAjouterCategorie}>
              Ajouter
            </button>
            {messageCategorie && (
              <span className="parametres-message parametres-message-erreur">
                {messageCategorie}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="parametres-section">
        <h3>Sécurité</h3>
        <div className="parametres-carte">
          <label className="parametres-champ">
            <span>Code administrateur actuel</span>
            <input
              type="password"
              value={ancienCode}
              onChange={(e) => setAncienCode(e.target.value)}
            />
          </label>
          <label className="parametres-champ">
            <span>Nouveau code</span>
            <input
              type="password"
              value={nouveauCode}
              onChange={(e) => setNouveauCode(e.target.value)}
            />
          </label>
          <label className="parametres-champ">
            <span>Confirmer le nouveau code</span>
            <input
              type="password"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
            />
          </label>
          <div className="parametres-actions">
            <button className="parametres-bouton" onClick={handleChangerCode}>
              Changer le code
            </button>
            {messageSecurite && (
              <span className="parametres-message parametres-message-erreur">
                {messageSecurite}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="parametres-section">
        <h3>Sauvegarde des données</h3>
        <div className="parametres-carte">
          <p className="parametres-sous-titre">
            Télécharge un fichier contenant tout (menu, commandes, historique, paramètres).
            Copie-le ensuite sur une clé USB pour garder une copie de sécurité en dehors de
            l'ordinateur ou la tablette.
          </p>
          <button className="parametres-bouton" onClick={handleTelechargerSauvegarde}>
            Télécharger la sauvegarde
          </button>
        </div>
      </section>

      <section className="parametres-section">
        <h3>Compte</h3>
        <div className="parametres-carte">
          <label className="parametres-champ">
            <span>Identifiant</span>
            <input
              type="text"
              value={identifiantCompte}
              onChange={(e) => setIdentifiantCompte(e.target.value)}
            />
          </label>
          <label className="parametres-champ">
            <span>Mot de passe</span>
            <input
              type="password"
              value={motDePasseCompte}
              onChange={(e) => setMotDePasseCompte(e.target.value)}
            />
          </label>
          <div className="parametres-actions">
            <button className="parametres-bouton" onClick={handleEnregistrerCompte}>
              Enregistrer
            </button>
            {messageCompte && <span className="parametres-message">{messageCompte}</span>}
          </div>
        </div>
      </section>

      <section className="parametres-section">
        <h3>Abonnement</h3>
        <div className="abonnement-carte">
          <div className="abonnement-info">
            <p className="abonnement-plan">
              Plan {planActuel === 'premium' ? 'Premium' : 'Standard'}
            </p>
            <p className="abonnement-statut">Actif</p>
          </div>
          <button className="abonnement-bouton" onClick={() => setVue('abonnement')}>
            Gérer l'abonnement
          </button>
        </div>
      </section>
    </div>
  );
}