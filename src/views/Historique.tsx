import { useMemo, useState } from 'react';
import { useHistorique, useDevise } from '../store/AppDataContext';
import type { ModePaiement } from '../types';
import { formatMontant } from '../lib/formatMontant';
import './Historique.css';

function dateDuJour() {
  return new Date().toISOString().slice(0, 10);
}

const COULEURS_PAIEMENT: Record<ModePaiement, string> = {
  espece: '#3B6D11',
  mobile_money: '#0057A3',
  en_attente: '#C0433F',
};

export default function Historique() {
  const { commandes } = useHistorique();
  const devise = useDevise();

  const [dateSelectionnee, setDateSelectionnee] = useState(dateDuJour());
  const [recherche, setRecherche] = useState('');
  const [filtrePaiement, setFiltrePaiement] = useState<'tout' | ModePaiement>('tout');

  const labelPaiement = (mode: ModePaiement): string => {
    if (mode === 'espece') return 'Espèces';
    if (mode === 'en_attente') return 'En attente';
    return devise === 'XOF' ? 'Mobile Money' : 'Carte bancaire';
  };

  const formatPrix = (n: number) => formatMontant(n, devise);
  const formatHeure = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const commandesDuJour = useMemo(
    () => commandes.filter((c) => c.dateCreation.slice(0, 10) === dateSelectionnee),
    [commandes, dateSelectionnee]
  );

  const totalTickets = commandesDuJour.length;
  const totalEspeces = commandesDuJour
    .filter((c) => c.modePaiement === 'espece')
    .reduce((s, c) => s + c.total, 0);
  const totalMobileMoney = commandesDuJour
    .filter((c) => c.modePaiement === 'mobile_money')
    .reduce((s, c) => s + c.total, 0);
  const totalEnAttente = commandesDuJour
    .filter((c) => c.modePaiement === 'en_attente')
    .reduce((s, c) => s + c.total, 0);

  const commandesFiltrees = useMemo(() => {
    return commandesDuJour.filter((c) => {
      const matchPaiement = filtrePaiement === 'tout' || c.modePaiement === filtrePaiement;
      const matchRecherche =
        recherche.trim() === '' || c.numero.toString().includes(recherche.trim());
      return matchPaiement && matchRecherche;
    });
  }, [commandesDuJour, filtrePaiement, recherche]);

  return (
    <div className="historique">
      <div className="historique-header">
        <h2>Historique</h2>
        <input
          type="date"
          className="selecteur-date"
          value={dateSelectionnee}
          onChange={(e) => setDateSelectionnee(e.target.value)}
        />
      </div>

      <div className="historique-recap">
        <div className="historique-recap-carte">
          <span className="historique-recap-label">Tickets</span>
          <span className="historique-recap-valeur">{totalTickets}</span>
        </div>
        <div className="historique-recap-carte">
          <span className="historique-recap-label">Espèces</span>
          <span className="historique-recap-valeur">{formatPrix(totalEspeces)}</span>
        </div>
        <div className="historique-recap-carte">
          <span className="historique-recap-label">{labelPaiement('mobile_money')}</span>
          <span className="historique-recap-valeur">{formatPrix(totalMobileMoney)}</span>
        </div>
        <div className="historique-recap-carte">
          <span className="historique-recap-label">En attente</span>
          <span className="historique-recap-valeur">{formatPrix(totalEnAttente)}</span>
        </div>
      </div>

      <div className="historique-filtres">
        <input
          type="text"
          className="historique-recherche"
          placeholder="Rechercher un n° de ticket..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />

        <div className="historique-filtre-paiement">
          {(['tout', 'espece', 'mobile_money', 'en_attente'] as const).map((mode) => (
            <button
              key={mode}
              className={`filtre-chip ${filtrePaiement === mode ? 'filtre-chip-actif' : ''}`}
              onClick={() => setFiltrePaiement(mode)}
            >
              {mode === 'tout' ? 'Tout' : labelPaiement(mode)}
            </button>
          ))}
        </div>
      </div>

      {commandesFiltrees.length === 0 ? (
        <div className="historique-vide">
          <p>Aucun ticket trouvé pour cette date</p>
        </div>
      ) : (
        <div className="historique-liste">
          {commandesFiltrees.map((commande) => (
            <div key={commande.id} className="historique-carte-ticket">
              <div className="historique-carte-header">
                <span className="historique-carte-numero">Ticket n°{commande.numero}</span>
                <span className="historique-carte-heure">
                  {formatHeure(commande.dateCreation)}
                </span>
                <span
                  className="historique-carte-badge"
                  style={{ background: COULEURS_PAIEMENT[commande.modePaiement] }}
                >
                  {labelPaiement(commande.modePaiement)}
                </span>
              </div>

              <div className="historique-carte-lignes">
                {commande.lignes.map((ligne) => (
                  <div key={ligne.articleId} className="historique-carte-ligne">
                    <span>
                      {ligne.quantite}x {ligne.nom}
                    </span>
                    <span>{formatPrix(ligne.prixUnitaire * ligne.quantite)}</span>
                  </div>
                ))}
              </div>

              <div className="historique-carte-total">
                <span>Total</span>
                <span>{formatPrix(commande.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}