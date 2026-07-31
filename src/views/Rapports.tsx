import { useMemo, useState } from 'react';
import { useHistorique } from '../store/AppDataContext';
import BarChart from '../components/BarChart';
import './Rapports.css';
import { useDevise } from '../store/AppDataContext';
import { formatMontant } from '../lib/formatMontant';

type Periode = 7 | 30;

function dateDuJour() {
  return new Date();
}

function formatDateJourMois(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export default function Rapports() {
  const { commandes } = useHistorique();
  const [periode, setPeriode] = useState<Periode>(7);

  const devise = useDevise();
  const formatPrix = (n: number) => formatMontant(n, devise);

  // Commandes réellement payées uniquement
  const commandesPayees = useMemo(
    () => commandes.filter((c) => c.modePaiement !== 'en_attente'),
    [commandes]
  );

  const bornePeriode = useMemo(() => {
    const debut = dateDuJour();
    debut.setDate(debut.getDate() - (periode - 1));
    debut.setHours(0, 0, 0, 0);
    return debut;
  }, [periode]);

  const commandesDansPeriode = useMemo(
    () => commandesPayees.filter((c) => new Date(c.dateCreation) >= bornePeriode),
    [commandesPayees, bornePeriode]
  );

  // Panier moyen
  const panierMoyen =
    commandesDansPeriode.length > 0
      ? commandesDansPeriode.reduce((s, c) => s + c.total, 0) / commandesDansPeriode.length
      : 0;

  const totalTickets = commandesDansPeriode.length;
  const totalCA = commandesDansPeriode.reduce((s, c) => s + c.total, 0);

  // Évolution du CA jour par jour sur la période
  const evolutionCA = useMemo(() => {
    const jours: { label: string; valeur: number; cle: string }[] = [];
    for (let i = periode - 1; i >= 0; i--) {
      const d = dateDuJour();
      d.setDate(d.getDate() - i);
      const cle = d.toISOString().slice(0, 10);
      jours.push({ label: formatDateJourMois(d), valeur: 0, cle });
    }
    commandesDansPeriode.forEach((c) => {
      const cle = c.dateCreation.slice(0, 10);
      const jour = jours.find((j) => j.cle === cle);
      if (jour) jour.valeur += c.total;
    });
    return jours;
  }, [commandesDansPeriode, periode]);

  // Heures de pointe : nombre de tickets par heure de la journée
  const heuresDePointe = useMemo(() => {
    const heures = Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, valeur: 0 }));
    commandesDansPeriode.forEach((c) => {
      const h = new Date(c.dateCreation).getHours();
      heures[h].valeur += 1;
    });
    // On affiche seulement 8h à 23h pour rester lisible (plage resto typique)
    return heures.slice(8, 24);
  }, [commandesDansPeriode]);

  return (
    <div className="rapports">
      <div className="rapports-header">
        <h2>Rapports</h2>
        <div className="rapports-periode">
          <button
            className={`periode-chip ${periode === 7 ? 'periode-chip-actif' : ''}`}
            onClick={() => setPeriode(7)}
          >
            7 derniers jours
          </button>
          <button
            className={`periode-chip ${periode === 30 ? 'periode-chip-actif' : ''}`}
            onClick={() => setPeriode(30)}
          >
            30 derniers jours
          </button>
        </div>
      </div>

      <div className="rapports-grille">
        <div className="rapports-carte">
          <span className="rapports-label">Panier moyen</span>
          <span className="rapports-valeur">{formatPrix(panierMoyen)}</span>
        </div>
        <div className="rapports-carte">
          <span className="rapports-label">Tickets</span>
          <span className="rapports-valeur">{totalTickets}</span>
        </div>
        <div className="rapports-carte rapports-carte-accent">
          <span className="rapports-label">CA sur la période</span>
          <span className="rapports-valeur">{formatPrix(totalCA)}</span>
        </div>
      </div>

      <section className="rapports-section">
        <h3>Évolution du chiffre d'affaires</h3>
        <BarChart donnees={evolutionCA} formatValeur={formatPrix} couleur="#FF9500" />
      </section>

      <section className="rapports-section">
        <h3>Heures de pointe (nombre de tickets)</h3>
        <BarChart donnees={heuresDePointe} couleur="#0057A3" />
      </section>
    </div>
  );
}
