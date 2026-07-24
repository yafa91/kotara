import { useState } from 'react';
import AbonnementDetail from './AbonnementDetail';
import './Parametres.css';

interface ParametresProps {
  planActuel: 'standard' | 'premium';
  onChangerPlan: (plan: 'standard' | 'premium') => void;
}

export default function Parametres({ planActuel, onChangerPlan }: ParametresProps) {
  const [vue, setVue] = useState<'liste' | 'abonnement'>('liste');

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

  return (
    <div className="parametres">
      <h2>Paramètres</h2>

      <section className="parametres-section">
        <h3>Abonnement</h3>
        <div className="abonnement-carte">
          <div className="abonnement-info">
            <p className="abonnement-plan">
              Plan {planActuel === 'premium' ? 'Premium' : 'Standard'}
            </p>
            <p className="abonnement-statut">Actif</p>
          </div>
          <button
            className="abonnement-bouton"
            onClick={() => setVue('abonnement')}
          >
            Gérer l'abonnement
          </button>
        </div>
      </section>
    </div>
  );
}
