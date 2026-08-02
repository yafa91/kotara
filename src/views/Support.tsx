import './Support.css';

interface SupportProps {
  planActuel: 'standard' | 'premium' | null;
}

export default function Support({ planActuel }: SupportProps) {
  const handlePriseEnMain = () => {
    window.open('https://meet.google.com/new', '_blank');
  };

  return (
    <div className="support">
      <h2>Support</h2>
      <p className="support-intro">
        Une question, un problème technique ? Notre équipe est là pour t'aider.
      </p>

      <div className="support-carte">
        <p className="support-label">Email</p>
        <p className="support-valeur">support@warabi.app</p>
      </div>

      <div className="support-carte">
        <p className="support-label">Téléphone</p>
        <p className="support-valeur">+33 07 49 45 13 61</p>
      </div>

      <div className="support-carte">
        <p className="support-label">Horaires</p>
        <p className="support-valeur">Lundi - Samedi, 11h - 18h</p>
      </div>

      <div className="support-carte support-carte-distance">
        <p className="support-label">Assistance à distance</p>
        {planActuel === 'premium' ? (
          <>
            <p className="support-description">
              Démarre une visio et partage ton écran avec notre équipe pour résoudre le problème ensemble.
            </p>
            <button className="support-bouton" onClick={handlePriseEnMain}>
              Démarrer une visio
            </button>
          </>
        ) : (
          <>
            <p className="support-description">
              Fonctionnalité réservée au plan Premium.
            </p>
            <span className="support-badge-premium"></span>
          </>
        )}
      </div>
    </div>
  );
}