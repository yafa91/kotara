import './CGUCGV.css';

interface CGUCGVProps {
  onRetour: () => void;
}

export default function CGUCGV({ onRetour }: CGUCGVProps) {
  return (
    <div className="cgu-cgv">
      <button className="cgu-cgv-retour" onClick={onRetour}>
        ← Retour
      </button>

      <p className="cgu-cgv-titre">
        <span className="cgu-cgv-k">K</span>otara
      </p>
      <h1>Conditions Générales d'Utilisation et Conditions Générales de Vente</h1>
      <p className="cgu-cgv-sous-titre">
       Dernière mise à jour le 18 aout 2026
      </p>

      <h2>PARTIE 1 — CONDITIONS GÉNÉRALES D'UTILISATION (CGU)</h2>

      <h3>Article 1 — Objet</h3>
      <p>
        Les présentes Conditions Générales d'Utilisation (« CGU ») ont pour objet de définir les
        modalités et conditions dans lesquelles la société WARABI SAS met à disposition de ses
        utilisateurs le logiciel de caisse « Kotara » (ci-après le « Service »), ainsi que les
        droits et obligations des parties dans ce cadre.
      </p>
      <p>
        Le Service est édité par WARABI SAS, société par actions simplifiée au capital de 100 euros, immatriculée au
        Registre du Commerce et des Sociétés sous le numéro SIREN 101 908 762 (ci-après
        « l'Éditeur » ou « WARABI »).
      </p>

      <h3>Article 2 — Acceptation des CGU</h3>
      <p>
        L'accès et l'utilisation du Service impliquent l'acceptation pleine et entière des
        présentes CGU par tout utilisateur (ci-après « l'Utilisateur » ou « le client »).
        L'Utilisateur reconnaît avoir pris connaissance des présentes CGU au moment de la création
        de son compte et déclare les accepter sans réserve.
      </p>

      <h3>Article 3 — Accès au Service</h3>
      <p>
        Le Service est accessible via une interface web à l'adresse du site de Kotara, ainsi que
        par tout autre moyen que l'Éditeur pourrait proposer ultérieurement. L'accès nécessite la
        création d'un compte utilisateur associé à une adresse e-mail valide et un mot de passe.
      </p>
      <p>
        Kotara est un logiciel conçu pour une utilisation sur tablette ou ordinateur. L'accès
        depuis un téléphone mobile (smartphone) n'est pas pris en charge et peut être restreint
        techniquement par l'Éditeur.
      </p>

      <h3>Article 4 — Compte utilisateur</h3>
      <p>
        L'Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion.
        Toute action réalisée depuis son compte est présumée effectuée par lui ou sous son
        autorité. L'Utilisateur s'engage à informer immédiatement l'Éditeur de toute utilisation
        non autorisée de son compte dont il aurait connaissance.
      </p>
      <p>
        L'Utilisateur garantit l'exactitude des informations fournies lors de la création de son
        compte (nom de l'établissement, type d'activité, adresse, coordonnées) et s'engage à les
        maintenir à jour.
      </p>

      <h3>Article 5 — Obligations de l'Utilisateur</h3>
      <p>L'Utilisateur s'engage à :</p>
      <ul>
        <li>
          utiliser le Service conformément à sa destination, à savoir la gestion de caisse, la
          prise de commande, la gestion de menu/produits et les fonctionnalités associées ;
        </li>
        <li>ne pas détourner le Service à des fins frauduleuses ou illicites ;</li>
        <li>
          ne pas tenter de porter atteinte à la sécurité ou à l'intégrité du Service, de ses
          serveurs ou de son infrastructure ;
        </li>
        <li>
          respecter l'ensemble des réglementations applicables à son activité commerciale,
          notamment en matière fiscale et comptable (voir Article 9 des CGV) ;
        </li>
        <li>
          ne pas céder, sous-licencier ou revendre l'accès au Service à un tiers sans accord
          préalable de l'Éditeur.
        </li>
      </ul>

      <h3>Article 6 — Propriété intellectuelle</h3>
      <p>
        Le Service, son code source, son interface, sa charte graphique, sa marque « Kotara »
        ainsi que l'ensemble des éléments qui le composent sont la propriété exclusive de WARABI
        SAS et sont protégés par le droit de la propriété intellectuelle.
      </p>
      <p>
        L'utilisation du Service ne confère à l'Utilisateur aucun droit de propriété
        intellectuelle sur le Service lui-même. Seul un droit d'usage, personnel, non exclusif et
        non transférable, est concédé à l'Utilisateur pour la durée de son abonnement.
      </p>
      <p>
        Les données saisies par l'Utilisateur dans le cadre de son activité (menu, commandes,
        historique de ventes, données de son établissement) demeurent la propriété de
        l'Utilisateur.
      </p>

      <h3>Article 7 — Protection des données personnelles</h3>
      <p>
        WARABI traite les données personnelles des Utilisateurs conformément au Règlement Général
        sur la Protection des Données (RGPD) et à la loi Informatique et Libertés. Les données sont
        hébergées au sein de l'Union Européenne.
      </p>
      <p>
        Les données collectées (identité, coordonnées, données de connexion, données de
        facturation) sont utilisées aux seules fins de fourniture du Service, de gestion de la
        relation contractuelle et du support technique. Elles ne sont ni vendues ni communiquées à
        des tiers à des fins commerciales.
      </p>
      <p>
        Conformément à la réglementation, l'Utilisateur dispose d'un droit d'accès, de
        rectification, d'effacement, de limitation et de portabilité de ses données, qu'il peut
        exercer en écrivant à support@warabi.app.
      </p>

      <h3>Article 8 — Disponibilité du Service</h3>
      <p>
        L'Éditeur s'efforce d'assurer une disponibilité continue du Service mais ne garantit pas
        une disponibilité ininterrompue. Le Service peut être temporairement suspendu pour des
        opérations de maintenance, de mise à jour ou en cas de force majeure, sans que la
        responsabilité de l'Éditeur puisse être engagée à ce titre.
      </p>
      <p>
        L'Éditeur recommande à l'Utilisateur de conserver des sauvegardes régulières de ses
        données sensibles, notamment via la fonctionnalité d'export prévue à cet effet dans le
        Service.
      </p>

      <h3>Article 9 — Responsabilité</h3>
      <p>
        L'Éditeur met en œuvre les moyens raisonnables pour assurer le bon fonctionnement du
        Service. Sa responsabilité ne saurait toutefois être engagée en cas de dommage résultant
        d'une utilisation non conforme du Service, d'une défaillance du matériel ou de la
        connexion internet de l'Utilisateur, ou d'un cas de force majeure.
      </p>
      <p>
        L'Utilisateur demeure seul responsable de la conformité de son activité commerciale à la
        réglementation applicable, notamment fiscale et comptable. Le Service constitue un outil
        d'aide à la gestion et ne saurait se substituer aux obligations légales incombant à
        l'Utilisateur en sa qualité de commerçant.
      </p>

      <h3>Article 10 — Modification des CGU</h3>
      <p>
        L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment, notamment pour
        les adapter aux évolutions du Service ou de la réglementation. Les Utilisateurs seront
        informés de toute modification substantielle par e-mail ou par notification au sein du
        Service.
      </p>

      <h3>Article 11 — Droit applicable et juridiction compétente</h3>
      <p>
        Les présentes CGU sont soumises au droit français. En cas de litige et à défaut de
        résolution amiable, les tribunaux de Paris seront seuls compétents, sous réserve des
        règles de procédure impératives applicables.
      </p>

      <h2>PARTIE 2 — CONDITIONS GÉNÉRALES DE VENTE (CGV)</h2>

      <h3>Article 1 — Objet et champ d'application</h3>
      <p>
        Les présentes Conditions Générales de Vente (« CGV ») s'appliquent à la souscription de
        tout abonnement payant au logiciel Kotara, édité par WARABI SAS. Elles complètent les
        Conditions Générales d'Utilisation exposées en Partie 1 du présent document.
      </p>
      <p>
        Les présentes CGV s'appliquent exclusivement à une clientèle de professionnels agissant
        dans le cadre de leur activité commerciale (restaurateurs, commerçants et assimilés), à
        l'exclusion de toute clientèle de consommateurs au sens du droit de la consommation.
      </p>

      <h3>Article 2 — Identification de l'éditeur</h3>
      <p>
        WARABI SAS est une société par actions simplifiée au capital de 100 € dont le numéro SIRET est 101 908 762 00012
        Contact : support@warabi.app 
        Téléphone : +33 07 49 45 13 61.
      </p>

      <h3>Article 3 — Description des offres</h3>
      <p>
        Kotara est proposé sous la forme de deux offres d'abonnement mensuel, sans engagement de
        durée :
      </p>
      <ul>
        <li>
          Offre Standard — 20 € / mois (ou 15 000 FCFA / mois selon la devise du compte) : prise
          de commande, gestion de caisse, gestion du menu et des produits, 1 point de vente.
        </li>
        <li>
          Offre Premium — 49 € / mois (ou 26 000 FCFA / mois selon la devise du compte) :
          l'ensemble des fonctionnalités de l'offre Standard, rapports avancés, gestion
          multi-employés, support prioritaire, points de vente illimités.
        </li>
      </ul>
      <p>
        Le détail exact des fonctionnalités incluses dans chaque offre est présenté au sein de
        l'interface du Service et peut évoluer. Toute évolution substantielle des fonctionnalités
        incluses fera l'objet d'une information préalable des clients concernés.
      </p>

      <h3>Article 4 — Prix et modalités de paiement</h3>
      <p>
        Les prix des offres sont indiqués en euros (EUR) ou en francs CFA (XOF) selon la devise
        associée au compte du client, toutes taxes applicables comprises, sauf mention contraire.
      </p>
      <p>
        Le paiement s'effectue exclusivement par carte bancaire via la plateforme de paiement
        sécurisée Stripe. En souscrivant à une offre, le client autorise WARABI à procéder au
        prélèvement automatique et récurrent du montant de l'abonnement choisi, selon une
        périodicité mensuelle, jusqu'à résiliation de l'abonnement dans les conditions de l'Article
        5.
      </p>
      <p>
        En cas d'échec de prélèvement, WARABI ou son prestataire de paiement pourra procéder à de
        nouvelles tentatives de prélèvement selon un calendrier automatisé. À défaut de
        régularisation dans le délai indiqué au client, l'abonnement pourra être automatiquement
        résilié et l'accès aux fonctionnalités payantes du Service suspendu.
      </p>

      <h3>Article 5 — Durée et résiliation</h3>
      <p>
        L'abonnement est conclu sans engagement de durée et se renouvelle automatiquement chaque
        mois par tacite reconduction, sauf résiliation par le client.
      </p>
      <p>
        Le client peut résilier son abonnement à tout moment, avec effet à la fin de la période
        mensuelle en cours, directement depuis le Service ou via le portail de gestion
        d'abonnement mis à sa disposition. La résiliation n'ouvre droit à aucun remboursement, y
        compris partiel ou au prorata, du montant déjà réglé pour la période en cours.
      </p>
      <p>
        WARABI se réserve le droit de résilier ou suspendre l'accès au Service en cas de
        manquement grave du client aux présentes CGV ou aux CGU, notamment en cas d'utilisation
        frauduleuse ou de non-paiement persistant.
      </p>

      <h3>Article 6 — Absence de droit de rétractation</h3>
      <p>
        Conformément à l'article L. 221-3 du Code de la consommation, le droit de rétractation de
        14 jours prévu pour les consommateurs n'est pas applicable aux présentes CGV, celles-ci
        s'adressant exclusivement à des professionnels agissant dans le cadre de leur activité.
      </p>

      <h3>Article 7 — Absence de remboursement</h3>
      <p>
        Sauf disposition légale impérative contraire, aucun remboursement ne sera effectué au
        titre d'une période d'abonnement déjà facturée, y compris en cas de résiliation anticipée
        par le client ou de non-utilisation du Service pendant tout ou partie de la période
        concernée.
      </p>

      <h3>Article 8 — Responsabilité et garanties</h3>
      <p>
        WARABI s'engage à fournir le Service avec diligence et selon les règles de l'art, sans
        toutefois garantir un résultat commercial déterminé pour l'activité du client. La
        responsabilité de WARABI, tous préjudices confondus, est limitée au montant des sommes
        effectivement versées par le client au titre des trois (3) derniers mois d'abonnement
        précédant le fait générateur du dommage.
      </p>
      <p>
        WARABI ne saurait être tenue responsable des pertes de données, de chiffre d'affaires ou
        de tout préjudice indirect résultant de l'utilisation ou de l'impossibilité d'utiliser le
        Service.
      </p>

      <h3>Article 9 — Conformité fiscale et obligations du client</h3>
      <p>
        Le client, en sa qualité de professionnel assujetti à la TVA, demeure seul responsable du
        respect de ses obligations légales et fiscales, notamment celles résultant de l'article
        286 I 3° bis du Code Général des Impôts relatif aux logiciels de caisse (exigences
        d'inaltérabilité, de sécurisation, de conservation et d'archivage des données de
        transaction).
      </p>
      <p>
        WARABI met en œuvre les moyens techniques appropriés pour permettre au client de
        satisfaire à ces obligations (conservation des données, export des transactions), sans que
        cela ne dispense le client de vérifier, le cas échéant avec son expert-comptable, la
        conformité de son utilisation du Service à la réglementation qui lui est applicable.
      </p>

      <h3>Article 10 — Données et sécurité</h3>
      <p>
        Les données du client sont hébergées auprès de prestataires techniques tiers (hébergement
        de base de données et hébergement applicatif) situés au sein de l'Union Européenne. WARABI
        met en œuvre des mesures de sécurité raisonnables pour protéger l'accès et l'intégrité de
        ces données, notamment via des règles de contrôle d'accès garantissant qu'un client ne
        peut accéder qu'aux données de son propre établissement.
      </p>

      <h3>Article 11 — Modification des CGV</h3>
      <p>
        WARABI se réserve le droit de modifier les présentes CGV à tout moment. Les modifications
        substantielles, notamment tarifaires, seront notifiées aux clients par e-mail au moins
        trente (30) jours avant leur entrée en vigueur. La poursuite de l'utilisation du Service
        après cette notification vaut acceptation des nouvelles CGV.
      </p>

      <h3>Article 12 — Droit applicable et règlement des litiges</h3>
      <p>
        Les présentes CGV sont soumises au droit français. Tout litige relatif à leur validité,
        leur interprétation ou leur exécution sera, à défaut de résolution amiable préalable,
        soumis à la compétence exclusive des tribunaux de Paris.
      </p>
    </div>
  );
}
