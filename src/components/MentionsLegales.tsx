import './MentionsLegales.css';

interface MentionsLegalesProps {
  onRetour: () => void;
}

export default function MentionsLegales({ onRetour }: MentionsLegalesProps) {
  return (
    <div className="mentions-legales">
      <button className="mentions-legales-retour" onClick={onRetour}>
        ← Retour
      </button>

      <p className="mentions-legales-titre">
        <span className="mentions-legales-k">K</span>otara
      </p>
      <h1>Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        Le logiciel Kotara, accessible via la présente application, est édité par :
      </p>
      <p>
        <strong>WARABI SAS</strong> est une société par actions simplifiée au capital de 100 €
        immatriculée au Registre du Commerce et des sociétés sous le numéro SIRET 101 908 762 00012 dont le siège
        social est situé au 37 rue de la Dauphine, 91100 Corbeil-Essonnes, France.
      </p>
      <p>
        Contact : support@warabi.app Téléphone : +33 07 49 45 13 61.
      </p>

      <h2>Directeur de la publication</h2>
      <p>
        Le directeur de la publication est monsieur Fall Yann 
      </p>

      <h2>Hébergement</h2>
      <p>
        L'application ou le site web est hébergée par :<br />
        <strong>Vercel Inc.</strong> — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis 
      </p>
      <p>
        La base de données et les fonctions serveur sont hébergées par :<br />
        <strong>Supabase, Inc.</strong> — 970 Toa Payoh North #07-04, Singapour 318992 
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments composant Kotara (architecture, textes, code source, logos,
        charte graphique, base de données) est la propriété exclusive de WARABI SAS, sauf mention
        contraire. Toute reproduction, représentation ou exploitation, totale ou partielle, sans
        autorisation préalable est interdite.
      </p>

      <h2>Protection des données personnelles</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
        Informatique et Libertés, l'Utilisateur dispose d'un droit d'accès, de rectification,
        d'effacement, de limitation et de portabilité de ses données personnelles, qu'il peut
        exercer en écrivant à support@warabi.app.
      </p>

      <h2>Responsabilité</h2>
      <p>
        WARABI SAS s'efforce d'assurer l'exactitude des informations diffusées sur Kotara mais ne
        saurait être tenue responsable des erreurs, omissions ou de l'indisponibilité temporaire
        du Service.
      </p>
    </div>
  );
}
