import './ServiceFerme.css';

interface ServiceFermeProps {
  onAllerCaisse: () => void;
}

export default function ServiceFerme({ onAllerCaisse }: ServiceFermeProps) {
  return (
    <div className="service-ferme">
      <h2>Service non démarré</h2>
      <p>
        Tu dois démarrer le service du jour depuis la Caisse avant de pouvoir
        prendre des commandes.
      </p>
      <button className="bouton-aller-caisse" onClick={onAllerCaisse}>
        Aller à la Caisse
      </button>
    </div>
  );
}
