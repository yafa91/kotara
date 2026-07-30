import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import './LoginScreen.css';

interface LoginScreenProps {
  onConnecte: () => void;
}

export default function LoginScreen({ onConnecte }: LoginScreenProps) {
  const [etape, setEtape] = useState<'saisie' | 'choixType' | 'nouveauCompte'>('saisie');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [typeEtablissement, setTypeEtablissement] = useState<'restaurant' | 'magasin' | null>(null);
  const [nomEtablissement, setNomEtablissement] = useState('');
  const [devise, setDevise] = useState<'EUR' | 'XOF'>('EUR');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [messageInfo, setMessageInfo] = useState('');

  const handleSubmitSaisie = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setMessageInfo('');

    if (!email.trim() || !motDePasse.trim()) {
      setErreur('Email et mot de passe requis.');
      return;
    }

    setChargement(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: motDePasse,
      });

      if (!error) {
        onConnecte();
        return;
      }

      setEtape('choixType');
    } finally {
      setChargement(false);
    }
  };

  const handleChoixType = (type: 'restaurant' | 'magasin') => {
    setTypeEtablissement(type);
    setEtape('nouveauCompte');
  };

  const handleSubmitNouveauCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    setMessageInfo('');

    if (!nomEtablissement.trim()) {
      setErreur(typeEtablissement === 'restaurant' ? 'Le nom du restaurant est requis.' : 'Le nom du magasin est requis.');
      return;
    }

    setChargement(true);
    try {
      // On stocke le nom, le type d'établissement et la devise dans les métadonnées
      // du compte. Ils seront utilisés pour créer la fiche dès la première
      // connexion réussie (après confirmation de l'email si nécessaire).
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: motDePasse,
        options: {
          data: {
            nom_restaurant: nomEtablissement.trim(),
            type_etablissement: typeEtablissement,
            devise,
          },
        },
      });

      if (error) {
        setErreur(
          error.message.toLowerCase().includes('registered')
            ? 'Ce compte existe déjà — mot de passe incorrect.'
            : error.message
        );
        return;
      }

      if (data.session) {
        // Confirmation email désactivée : on est déjà connecté
        onConnecte();
      } else {
        setMessageInfo(
          'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis reconnecte-toi ici.'
        );
        setEtape('saisie');
        setNomEtablissement('');
        setTypeEtablissement(null);
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="login-screen">
      <a href="#" className="login-aide">Aide</a>
      <p className="login-titre">
        <span className="login-k">K</span>otara
      </p>

      {etape === 'saisie' && (
        <form className="login-form" onSubmit={handleSubmitSaisie}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />

          {erreur && <p className="login-erreur">{erreur}</p>}
          {messageInfo && <p className="login-info">{messageInfo}</p>}

          <button type="submit" disabled={chargement}>
            {chargement ? 'Chargement...' : 'Continuer'}
          </button>
        </form>
      )}

      {etape === 'choixType' && (
        <div className="login-form">
          <p className="login-info">
            Aucun compte trouvé pour {email}. Qu'est-ce que tu gères ?
          </p>
          <button type="button" onClick={() => handleChoixType('restaurant')}>
            Un restaurant
          </button>
          <button type="button" onClick={() => handleChoixType('magasin')}>
            Un magasin
          </button>
          <button
            type="button"
            className="login-retour"
            onClick={() => setEtape('saisie')}
          >
            ← Retour
          </button>
        </div>
      )}

      {etape === 'nouveauCompte' && (
        <form className="login-form" onSubmit={handleSubmitNouveauCompte}>
          <p className="login-info">
            Complète ces infos pour créer ton compte
          </p>
          <input
            type="text"
            placeholder={typeEtablissement === 'restaurant' ? 'Nom du restaurant' : 'Nom du magasin'}
            value={nomEtablissement}
            onChange={(e) => setNomEtablissement(e.target.value)}
          />

          <div className="login-devise-choix">
            <label>
              <input
                type="radio"
                name="devise"
                value="EUR"
                checked={devise === 'EUR'}
                onChange={() => setDevise('EUR')}
              />
              Euro (€)
            </label>
            <label>
              <input
                type="radio"
                name="devise"
                value="XOF"
                checked={devise === 'XOF'}
                onChange={() => setDevise('XOF')}
              />
              Franc CFA (FCFA)
            </label>
          </div>

          {erreur && <p className="login-erreur">{erreur}</p>}

          <button type="submit" disabled={chargement}>
            {chargement ? 'Création...' : 'Créer mon compte'}
          </button>
          <button
            type="button"
            className="login-retour"
            onClick={() => {
              setEtape('choixType');
              setErreur('');
            }}
          >
            ← Retour
          </button>
        </form>
      )}
    </div>
  );
}