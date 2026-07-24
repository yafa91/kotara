import { useState } from 'react';
import './PaiementMockup.css';

interface PaiementMockupProps {
  planNom: string;
  planPrix: string;
  onSucces: () => void;
  onAnnuler: () => void;
}

export default function PaiementMockup({
  planNom,
  planPrix,
  onSucces,
  onAnnuler,
}: PaiementMockupProps) {
  const [numeroCarte, setNumeroCarte] = useState('');
  const [expiration, setExpiration] = useState('');
  const [cvv, setCvv] = useState('');
  const [traitement, setTraitement] = useState(false);

  const handlePayer = (e: React.FormEvent) => {
    e.preventDefault();
    setTraitement(true);
    setTimeout(() => {
      setTraitement(false);
      onSucces();
    }, 1500);
  };

  return (
    <div className="paiement-mockup">
      <button className="paiement-retour" onClick={onAnnuler}>
        ← Annuler
      </button>

      <h2>Paiement</h2>
      <p className="paiement-recap">
        Plan <strong>{planNom}</strong> — {planPrix}
      </p>

      <form className="paiement-form" onSubmit={handlePayer}>
        <label>Numéro de carte</label>
        <input
          type="text"
          placeholder="4242 4242 4242 4242"
          value={numeroCarte}
          onChange={(e) => setNumeroCarte(e.target.value)}
          maxLength={19}
          required
        />

        <div className="paiement-ligne">
          <div>
            <label>Expiration</label>
            <input
              type="text"
              placeholder="MM/AA"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              maxLength={5}
              required
            />
          </div>
          <div>
            <label>CVV</label>
            <input
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              maxLength={3}
              required
            />
          </div>
        </div>

        <button type="submit" className="paiement-bouton" disabled={traitement}>
          {traitement ? 'Traitement en cours...' : `Payer ${planPrix}`}
        </button>
      </form>

      <p className="paiement-note">
        Ceci est une simulation. Aucun paiement réel n'est effectué.
      </p>
    </div>
  );
}
