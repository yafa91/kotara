import './Support.css';

interface SupportProps {
  planActuel: 'standard' | 'premium';
}

export default function Support({ planActuel }: SupportProps) {
  const handlePriseEnMain = () => {
    window.open('https://get.teamviewer.com/kotara-support', '_blank');
  };

  return (
    <div className="support">
      <h2>Support</h2>
      <p className="support-intro">
        Une question, un problème technique ? Notre équipe est là pour t'aider.
      </p>

      <div className="support-carte">
        <p className="support-label">Email</p>
        <p className="support-valeur">support@kotara.app</p>
      </div>

      <div className="support-carte">
        <p className="support-label">Téléphone</p>
        <p className="support-valeur">+33 0749451361</p>
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
              Laisse notre équipe prendre la main sur ton écran pour résoudre le problème directement.
            </p>
            <button className="support-bouton" onClick={handlePriseEnMain}>
              Démarrer une session
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
