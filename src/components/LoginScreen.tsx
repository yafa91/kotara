import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import CGUCGV from './CGUCGV';
import MentionsLegales from './MentionsLegales';
import DecouvrirKotara from './DecouvrirKotara';
import './LoginScreen.css';

interface LoginScreenProps {
  onConnecte: () => void;
  estTelephone?: boolean;
  estPortrait?: boolean;
}

export default function LoginScreen({
  onConnecte,
  estTelephone = false,
  estPortrait = false,
}: LoginScreenProps) {
  const [pageAffichee, setPageAffichee] = useState<
    'connexion' | 'cgu' | 'mentions' | 'decouvrir'
  >('decouvrir');
  const [etape, setEtape] = useState<'saisie' | 'choixType' | 'nouveauCompte'>('saisie');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [typeEtablissement, setTypeEtablissement] = useState<'restaurant' | 'magasin' | null>(null);
  const [nomEtablissement, setNomEtablissement] = useState('');
  const [devise, setDevise] = useState<'EUR' | 'XOF'>('EUR');
  const [cguAccepte, setCguAccepte] = useState(false);
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

    if (!cguAccepte) {
      setErreur("Tu dois accepter les CGU et CGV pour créer ton compte.");
      return;
    }

    setChargement(true);
    try {
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
        onConnecte();
      } else {
        setMessageInfo(
          'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis reconnecte-toi ici.'
        );
        setEtape('saisie');
        setNomEtablissement('');
        setTypeEtablissement(null);
        setCguAccepte(false);
      }
    } finally {
      setChargement(false);
    }
  };

  if (pageAffichee === 'mentions') {
    return <MentionsLegales onRetour={() => setPageAffichee('connexion')} />;
  }

  if (pageAffichee === 'cgu') {
    return <CGUCGV onRetour={() => setPageAffichee('connexion')} />;
  }

  if (pageAffichee === 'decouvrir') {
    return (
      <DecouvrirKotara
        onRetour={() => setPageAffichee('connexion')}
        onMentionsLegales={() => setPageAffichee('mentions')}
        onCGU={() => setPageAffichee('cgu')}
      />
    );
  }

  if (estTelephone) {
    return (
      <div className="app-verification-restaurant">
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <h2>Continue sur tablette</h2>
          <p>
            Kotara est un logiciel de caisse conçu pour une utilisation sur tablette ou
            ordinateur. Merci de te connecter depuis un appareil avec un écran plus grand.
          </p>
          <button
            type="button"
            className="login-lien-cgu-haut"
            style={{ marginTop: 16 }}
            onClick={() => setPageAffichee('decouvrir')}
          >
            ← Retour à la découverte de Kotara
          </button>
        </div>
      </div>
    );
  }

  if (estPortrait) {
    return (
      <div className="app-verification-restaurant">
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <h2>Tourne ta tablette</h2>
          <p>Kotara s'utilise en mode paysage. Fais pivoter ton appareil pour continuer.</p>
          <button
            type="button"
            className="login-lien-cgu-haut"
            style={{ marginTop: 16 }}
            onClick={() => setPageAffichee('decouvrir')}
          >
            ← Retour à la découverte de Kotara
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-liens-haut">
        <button
          type="button"
          className="login-lien-cgu-haut"
          onClick={() => setPageAffichee('decouvrir')}
        >
          Découvrir
        </button>
        <button
          type="button"
          className="login-lien-cgu-haut"
          onClick={() => setPageAffichee('mentions')}
        >
          Mentions légales
        </button>
        <button
          type="button"
          className="login-lien-cgu-haut"
          onClick={() => setPageAffichee('cgu')}
        >
          CGU/CGV
        </button>
        <a href="mailto:support@warabi.app" className="login-aide">Aide</a>
      </div>

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

          <label className="login-cgu-checkbox">
            <input
              type="checkbox"
              checked={cguAccepte}
              onChange={(e) => setCguAccepte(e.target.checked)}
            />
            <span>
              J'ai lu et j'accepte les{' '}
              <button
                type="button"
                className="login-lien-cgu"
                onClick={() => setPageAffichee('cgu')}
              >
                CGU et CGV
              </button>{' '}
              de Kotara.
            </span>
          </label>

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

      <p style={{
        position: 'fixed',
        bottom: '16px',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '12px',
        color: '#999',
      }}>
        Kotara © 2026, Logiciel édité par WARABI SAS. Tous droits réservés.
      </p>
    </div>
  );
}