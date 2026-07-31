import { useState } from 'react';
import PaiementMockup from './PaiementMockup';
import { useDevise } from '../store/AppDataContext';
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
  const [planEnPaiement, setPlanEnPaiement] = useState<Plan | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  const prixAffiche = (plan: Plan) => plan.prixParDevise[devise];

  const handleClicPlan = (plan: Plan) => {
    setPlanEnPaiement(plan);
  };

  const handleSucces = () => {
    if (planEnPaiement) {
      onChangerPlan(planEnPaiement.id as 'standard' | 'premium');
    }
    setPlanEnPaiement(null);
    setConfirmation(true);
  };

  const getLabelBouton = (plan: Plan) => {
    const estPlanActuel = plan.id === planActuel;
    if (estPlanActuel && expire) return 'Renouveler';
    if (estPlanActuel) return 'Plan actif';
    return 'Choisir ce plan';
  };

  if (planEnPaiement) {
    return (
      <PaiementMockup
        planNom={planEnPaiement.nom}
        planPrix={prixAffiche(planEnPaiement)}
        onSucces={handleSucces}
        onAnnuler={() => setPlanEnPaiement(null)}
      />
    );
  }

  if (confirmation) {
    return (
      <div className="abonnement-detail">
        <h2>Paiement réussi</h2>
        <p className="abonnement-echeance">Ton abonnement a bien été mis à jour.</p>
        <button className="plan-bouton" onClick={() => setConfirmation(false)}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="abonnement-detail">
      <button className="abonnement-retour" onClick={onRetour}>
        ← Retour
      </button>

      <h2>Gérer l'abonnement</h2>
      <p className="abonnement-echeance">
        {expire
          ? `Ton abonnement a expiré le ${dateEcheance}.`
          : `Prochain renouvellement le ${dateEcheance}.`}
      </p>

      <div className="plans-grille">
        {PLANS.map((plan) => {
          const estPlanActuel = plan.id === planActuel;
          const label = getLabelBouton(plan);
          const desactive = estPlanActuel && !expire;

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