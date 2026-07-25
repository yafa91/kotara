import './BarChart.css';

export interface BarreDonnee {
  label: string;
  valeur: number;
}

interface BarChartProps {
  donnees: BarreDonnee[];
  formatValeur?: (n: number) => string;
  couleur?: string;
}

export default function BarChart({ donnees, formatValeur, couleur = '#FF9500' }: BarChartProps) {
  const format = formatValeur ?? ((n: number) => n.toLocaleString('fr-FR'));
  const max = Math.max(...donnees.map((d) => d.valeur), 1);

  if (donnees.every((d) => d.valeur === 0)) {
    return <p className="barchart-vide">Aucune donnée pour cette période</p>;
  }

  return (
    <div className="barchart-conteneur">
      {donnees.map((d) => (
        <div key={d.label} className="barchart-colonne">
          <span className="barchart-valeur">{d.valeur > 0 ? format(d.valeur) : ''}</span>
          <div className="barchart-barre-fond">
            <div
              className="barchart-barre"
              style={{ height: `${(d.valeur / max) * 100}%`, background: couleur }}
            />
          </div>
          <span className="barchart-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
