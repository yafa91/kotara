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
      EUR: '20 € / mois',
      XOF: '15 000 FCFA / mois',
    },
    fonctionnalites: [
      'Prise de commande',
      'Gestion de caisse',
      'Menu et produits',
      '1 point de vente',
    ],
  },
  {
    id: 'premium',
    nom: 'Premium',
    prixParDevise: {
      EUR: '49 € / mois',
      XOF: '26 000 FCFA / mois',
    },
    fonctionnalites: [
      'Tout le plan Standard',
      'Rapports avancés',
      'Gestion multi-employés',
      'Support prioritaire',
      'Points de vente illimités',
    ],
  },
];

// ⚠️ Remplace par l'URL de ton projet Supabase (visible dans Project Settings > API)
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

      // Redirige vers la page de paiement hébergée par Stripe
      window.location.href = data.url;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue');
      setChargement(null);
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
      <button className="abonnement-fermer" onClick={onRetour} aria-label="Fermer">
  ×
</button>

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
    </div>
  );
}