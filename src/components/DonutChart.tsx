import './DonutChart.css';

export interface SegmentDonut {
  label: string;
  valeur: number;
  couleur: string;
}

interface DonutChartProps {
  segments: SegmentDonut[];
  formatValeur?: (n: number) => string;
}

export default function DonutChart({ segments, formatValeur }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.valeur, 0);

  if (total === 0) {
    return <p className="donut-vide">Aucune vente pour l'instant</p>;
  }

  const rayon = 60;
  const circonference = 2 * Math.PI * rayon;
  let offsetCumule = 0;

  const format = formatValeur ?? ((n: number) => n.toLocaleString('fr-FR'));

  return (
    <div className="donut-conteneur">
      <svg viewBox="0 0 160 160" className="donut-svg">
        <circle cx="80" cy="80" r={rayon} fill="none" stroke="#f0f0f0" strokeWidth="20" />
        {segments.map((seg) => {
          if (seg.valeur === 0) return null;
          const part = seg.valeur / total;
          const longueur = part * circonference;
          const dashArray = `${longueur} ${circonference - longueur}`;
          const dashOffset = -offsetCumule;
          offsetCumule += longueur;

          return (
            <circle
              key={seg.label}
              cx="80"
              cy="80"
              r={rayon}
              fill="none"
              stroke={seg.couleur}
              strokeWidth="20"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 80 80)"
            />
          );
        })}
        <text x="80" y="76" textAnchor="middle" className="donut-total-label">
          Total
        </text>
        <text x="80" y="94" textAnchor="middle" className="donut-total-valeur">
          {format(total)}
        </text>
      </svg>

      <div className="donut-legende">
        {segments
          .filter((seg) => seg.valeur > 0)
          .sort((a, b) => b.valeur - a.valeur)
          .map((seg) => (
            <div key={seg.label} className="donut-legende-item">
              <span className="donut-legende-pastille" style={{ background: seg.couleur }} />
              <span className="donut-legende-label">{seg.label}</span>
              <span className="donut-legende-valeur">{format(seg.valeur)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
