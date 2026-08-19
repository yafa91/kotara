import { useState } from 'react';
import { useDevise } from '../store/AppDataContext';
import { supabase } from '../lib/supabaseClient';
import './AbonnementDetail.css';

interface Plan {
  id: string;
  nom: string;
  prixParDevise: {
    EUR: string;
    XOF: string;
  };
  fonctionnalites: string[];
}

const PLANS: Plan[] = [
  {
    id: 'standard',
    nom: 'Standard',
    prixParDevise: {
      EUR: '29,99 € / mois',
      XOF: '22 000 FCFA / mois',
    },
    fonctionnalites: [
      'Prise de commande',
      'Gestion de caisse',
      'Menu et produits',
      '1 point de vente',
      'Tablette + imprimante fournies',
    ],
  },
  {
    id: 'premium',
    nom: 'Premium',
    prixParDevise: {
      EUR: '49,99 € / mois',
      XOF: '38 000 FCFA / mois',
    },
    fonctionnalites: [
      'Tout le plan Standard',
      'Rapports avancés',
      'Gestion multi-employés',
      'Support prioritaire',
      'Points de vente illimités',
      'Tablette + imprimante fournies',
    ],
  },
];

// Remplace par l'URL de ton projet Supabase (visible dans Project Settings > API)
const SUPABASE_FUNCTIONS_URL = 'https://oiongrhqunlrzfuinjmy.supabase.co/functions/v1';

interface AbonnementDetailProps {
  planActuel: string;
  dateEcheance: string;
  expire: boolean;
  onRetour: () => void;
  onChangerPlan: (plan: 'standard' | 'premium') => void;
}

export default function AbonnementDetail({
  planActuel,
  dateEcheance,
  expire,
  onRetour,
  onChangerPlan,
}: AbonnementDetailProps) {
  const devise = useDevise();
  const [chargement, setChargement] = useState<string | null>(null);
  const [chargementPortail, setChargementPortail] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const prixAffiche = (plan: Plan) => plan.prixParDevise[devise];

  const handleClicPlan = async (plan: Plan) => {
    setErreur(null);
    setChargement(plan.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error('Impossible de récupérer ton compte. Reconnecte-toi.');
      }

      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          email: user.email,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
      }

      window.location.href = data.url;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue');
      setChargement(null);
    }
  };

  const handleGererAbonnement = async () => {
    setChargementPortail(true);
    setErreur(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Reconnecte-toi pour accéder à cette page.');

      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Erreur lors de l'ouverture du portail.");
      }

      window.location.href = data.url;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue');
      setChargementPortail(false);
    }
  };

  const getLabelBouton = (plan: Plan) => {
    if (chargement === plan.id) return 'Redirection...';
    const estPlanActuel = plan.id === planActuel;
    if (estPlanActuel && expire) return 'Renouveler';
    if (estPlanActuel) return 'Plan actif';
    return 'Choisir ce plan';
  };

  return (
    <div className="abonnement-detail">
      <h2>Gérer l'abonnement</h2>
      <p className="abonnement-echeance">
        {!dateEcheance
          ? "Aucun abonnement actif, choisis un plan pour commencer."
          : expire
            ? `Ton abonnement a expiré le ${dateEcheance}.`
            : `Prochain renouvellement le ${dateEcheance}.`}
      </p>

      {erreur && <p className="abonnement-erreur">{erreur}</p>}

      <div className="plans-grille">
        {PLANS.map((plan) => {
          const estPlanActuel = plan.id === planActuel;
          const label = getLabelBouton(plan);
          const desactive = (estPlanActuel && !expire) || chargement !== null;

          return (
            <div
              key={plan.id}
              className={`plan-carte ${estPlanActuel ? 'plan-carte-actif' : ''}`}
            >
              <p className="plan-nom">{plan.nom}</p>
              <p className="plan-prix">{prixAffiche(plan)}</p>
              <ul className="plan-fonctionnalites">
                {plan.fonctionnalites.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className={`plan-bouton ${desactive ? 'plan-bouton-desactive' : ''}`}
                disabled={desactive}
                onClick={() => handleClicPlan(plan)}
              >
                {label}
              </button>
            </div>
          );
        })}
      </div>

      {planActuel !== 'aucun' && (
        <button
          className="abonnement-annuler"
          onClick={handleGererAbonnement}
          disabled={chargementPortail}
          style={{ marginBottom: '8px' }}
        >
          {chargementPortail
            ? 'Redirection...'
            : 'Gérer mon abonnement (facture, moyen de paiement, résiliation)'}
        </button>
      )}

      <button className="abonnement-annuler" onClick={onRetour}>
        Annuler
      </button>
    </div>
  );
}