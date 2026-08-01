import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { useHistorique, useMenu, useExportComptable } from '../store/AppDataContext';
import DonutChart, { type SegmentDonut } from '../components/DonutChart';
import type { Categorie } from '../types';
import './Comptabilite.css';
import { useDevise } from '../store/AppDataContext';
import { formatMontant } from '../lib/formatMontant';

interface ComptabiliteProps {
  planActuel: 'standard' | 'premium' | null;
}

interface Charge {
  id: string;
  nom: string;
  montant: number;
}

const NOMS_MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const COULEURS_CATEGORIE: Record<Categorie, string> = {
  Plats: '#FF9500',
  Boissons: '#0057A3',
  Desserts: '#C0433F',
  Frites: '#E6B800',
  Sandwichs: '#854F0B',
  Salades: '#3B6D11',
  Sauces: '#993C1D',
  Menus: '#6B4EA6',
  Pates: '#D97CA8',
  Autres: '#8E8E93',
};

function cleDuMois(iso: string) {
  return iso.slice(0, 7); // yyyy-mm
}

function libelleDuMois(cle: string) {
  const [annee, mois] = cle.split('-');
  const index = parseInt(mois, 10) - 1;
  return `${NOMS_MOIS[index]} ${annee}`;
}

// Échappe une valeur pour un champ CSV (double les guillemets, entoure de guillemets)
function champCSV(valeur: string | number) {
  const s = String(valeur ?? '');
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function Comptabilite({ planActuel }: ComptabiliteProps) {
  const estPremium = planActuel === 'premium';
  const { commandes } = useHistorique();
  const { articles } = useMenu();
  const { recupererTransactionsBrutesDuMois } = useExportComptable();

  const [vue, setVue] = useState<'resume' | 'bilan' | 'detail'>('resume');
  const [moisSelectionne, setMoisSelectionne] = useState<string | null>(null);
  const [chargesParMois, setChargesParMois] = useState<{ [cle: string]: Charge[] }>({});
  const [nouveauNom, setNouveauNom] = useState('');
  const [nouveauMontant, setNouveauMontant] = useState('');
  const [exportCSVEnCours, setExportCSVEnCours] = useState(false);

  const devise = useDevise();
  const formatFCFA = (n: number) => formatMontant(n, devise);

  // Catégorie de chaque article, pour retrouver la catégorie d'une ligne de ticket
  const categorieParArticleId = useMemo(() => {
    const map: Record<string, Categorie> = {};
    articles.forEach((a) => {
      map[a.id] = a.categorie;
    });
    return map;
  }, [articles]);

  // Seules les commandes réellement encaissées comptent comme revenu
  const commandesPayees = useMemo(
    () => commandes.filter((c) => c.modePaiement !== 'en_attente'),
    [commandes]
  );

  const cleMoisActuel = new Date().toISOString().slice(0, 7);

  // Liste des mois pour lesquels on a des données, du plus ancien au plus récent
  const clesMoisDisponibles = useMemo(() => {
    const set = new Set<string>(commandesPayees.map((c) => cleDuMois(c.dateCreation)));
    set.add(cleMoisActuel); // toujours inclure le mois en cours, même vide
    return Array.from(set).sort();
  }, [commandesPayees, cleMoisActuel]);

  const getRevenusDuMois = (cle: string) =>
    commandesPayees
      .filter((c) => cleDuMois(c.dateCreation) === cle)
      .reduce((s, c) => s + c.total, 0);

  const getChargesDuMois = (cle: string) => chargesParMois[cle] || [];
  const getTotalChargesDuMois = (cle: string) =>
    getChargesDuMois(cle).reduce((s, c) => s + c.montant, 0);

  const getVentesParCategorieDuMois = (cle: string): SegmentDonut[] => {
    const totaux: Record<string, number> = {};
    commandesPayees
      .filter((c) => cleDuMois(c.dateCreation) === cle)
      .forEach((c) => {
        c.lignes.forEach((l) => {
          const cat = categorieParArticleId[l.articleId] || 'Autres';
          totaux[cat] = (totaux[cat] || 0) + l.prixUnitaire * l.quantite;
        });
      });

    return Object.entries(totaux).map(([label, valeur]) => ({
      label,
      valeur,
      couleur: COULEURS_CATEGORIE[label as Categorie] || '#8E8E93',
    }));
  };

  const getTopProduitsDuMois = (cle: string) => {
    const parProduit: Record<string, { quantite: number; montant: number }> = {};
    commandesPayees
      .filter((c) => cleDuMois(c.dateCreation) === cle)
      .forEach((c) => {
        c.lignes.forEach((l) => {
          if (!parProduit[l.nom]) parProduit[l.nom] = { quantite: 0, montant: 0 };
          parProduit[l.nom].quantite += l.quantite;
          parProduit[l.nom].montant += l.prixUnitaire * l.quantite;
        });
      });

    return Object.entries(parProduit)
      .map(([nom, v]) => ({ nom, ...v }))
      .sort((a, b) => b.montant - a.montant)
      .slice(0, 8);
  };

  const totalRevenus = clesMoisDisponibles.reduce((s, cle) => s + getRevenusDuMois(cle), 0);
  const totalCharges = clesMoisDisponibles.reduce((s, cle) => s + getTotalChargesDuMois(cle), 0);
  const totalBenefice = totalRevenus - totalCharges;

  const handleAjouterCharge = () => {
    if (!moisSelectionne || !nouveauNom || !nouveauMontant) return;
    const montant = parseInt(nouveauMontant, 10);
    if (isNaN(montant) || montant <= 0) return;

    const nouvelleCharge: Charge = {
      id: Date.now().toString(),
      nom: nouveauNom,
      montant,
    };

    setChargesParMois((prev) => ({
      ...prev,
      [moisSelectionne]: [...(prev[moisSelectionne] || []), nouvelleCharge],
    }));
    setNouveauNom('');
    setNouveauMontant('');
  };

  const handleSupprimerCharge = (id: string) => {
    if (!moisSelectionne) return;
    setChargesParMois((prev) => ({
      ...prev,
      [moisSelectionne]: (prev[moisSelectionne] || []).filter((c) => c.id !== id),
    }));
  };

  const exporterPDF = () => {
    if (!moisSelectionne) return;
    const revenus = getRevenusDuMois(moisSelectionne);
    const charges = getTotalChargesDuMois(moisSelectionne);
    const listeCharges = getChargesDuMois(moisSelectionne);
    const ventes = getVentesParCategorieDuMois(moisSelectionne);
    const topProduits = getTopProduitsDuMois(moisSelectionne);

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text(`Bilan comptable - ${libelleDuMois(moisSelectionne)}`, 14, y);
    y += 12;

    doc.setFontSize(11);
    doc.text(`Revenus: ${formatFCFA(revenus)}`, 14, y);
    y += 8;
    doc.text(`Charges: ${formatFCFA(charges)}`, 14, y);
    y += 8;
    doc.text(`Benefice net: ${formatFCFA(revenus - charges)}`, 14, y);
    y += 14;

    doc.setFontSize(13);
    doc.text('Ventes par categorie', 14, y);
    y += 8;
    doc.setFontSize(10);
    ventes.forEach((v) => {
      doc.text(`${v.label}: ${formatFCFA(v.valeur)}`, 14, y);
      y += 6;
    });
    y += 8;

    doc.setFontSize(13);
    doc.text('Produits les plus vendus', 14, y);
    y += 8;
    doc.setFontSize(10);
    topProduits.forEach((p) => {
      doc.text(`${p.nom} - Qte: ${p.quantite} - ${formatFCFA(p.montant)}`, 14, y);
      y += 6;
    });
    y += 8;

    doc.setFontSize(13);
    doc.text('Detail des charges', 14, y);
    y += 8;
    doc.setFontSize(10);
    listeCharges.forEach((c) => {
      doc.text(`${c.nom}: ${formatFCFA(c.montant)}`, 14, y);
      y += 6;
    });

    doc.save(`bilan-${moisSelectionne}.pdf`);
  };

  // Export brut, une ligne par article vendu, avec toutes les transactions
  // (y compris les enregistrements "remplacés" grâce à l'inaltérabilité) —
  // exploitable en cas de contrôle fiscal.
  const exporterTransactionsCSV = async () => {
    if (!moisSelectionne || exportCSVEnCours) return;
    setExportCSVEnCours(true);

    try {
      const brut = await recupererTransactionsBrutesDuMois(moisSelectionne);

      const entetes = [
        'id_commande',
        'numero_ticket',
        'date_creation',
        'date_encaissement',
        'mode_paiement',
        'statut',
        'commande_remplacee_id',
        'article',
        'quantite',
        'prix_unitaire',
        'montant_ligne',
        'total_commande',
      ];

      const lignesCSV: string[] = [entetes.join(';')];

      brut.forEach((commande: any) => {
        const estRemplacee = commande.commande_parent_id ? 'REMPLACEE' : 'ACTIVE';
        const lignesArticles = Array.isArray(commande.lignes) ? commande.lignes : [];

        if (lignesArticles.length === 0) {
          // Sécurité : commande sans lignes, on l'exporte quand même sur une ligne
          lignesCSV.push(
            [
              commande.id,
              commande.numero,
              commande.date_creation,
              commande.date_encaissement || '',
              commande.mode_paiement,
              estRemplacee,
              commande.commande_parent_id || '',
              '',
              '',
              '',
              '',
              commande.total,
            ]
              .map(champCSV)
              .join(';')
          );
          return;
        }

        lignesArticles.forEach((ligne: any) => {
          lignesCSV.push(
            [
              commande.id,
              commande.numero,
              commande.date_creation,
              commande.date_encaissement || '',
              commande.mode_paiement,
              estRemplacee,
              commande.commande_parent_id || '',
              ligne.nom,
              ligne.quantite,
              ligne.prixUnitaire,
              ligne.prixUnitaire * ligne.quantite,
              commande.total,
            ]
              .map(champCSV)
              .join(';')
          );
        });
      });

      const contenu = '\uFEFF' + lignesCSV.join('\n'); // \uFEFF = BOM pour Excel/accents
      const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `transactions-${moisSelectionne}.csv`;
      document.body.appendChild(lien);
      lien.click();
      document.body.removeChild(lien);
      URL.revokeObjectURL(url);
    } finally {
      setExportCSVEnCours(false);
    }
  };

  if (vue === 'detail' && moisSelectionne) {
    const revenus = getRevenusDuMois(moisSelectionne);
    const charges = getTotalChargesDuMois(moisSelectionne);
    const listeCharges = getChargesDuMois(moisSelectionne);
    const ventes = getVentesParCategorieDuMois(moisSelectionne);
    const topProduits = getTopProduitsDuMois(moisSelectionne);

    return (
      <div className="comptabilite">
        <div className="comptabilite-entete">
          <button className="comptabilite-retour" onClick={() => setVue('bilan')}>
            ← Retour au bilan
          </button>
          <button className="comptabilite-bouton" onClick={exporterPDF}>
            Exporter en PDF
          </button>
          <button
            className="comptabilite-bouton"
            onClick={exporterTransactionsCSV}
            disabled={exportCSVEnCours}
          >
            {exportCSVEnCours ? 'Export en cours...' : 'Exporter les transactions (CSV)'}
          </button>
        </div>
        <h2>Détail — {libelleDuMois(moisSelectionne)}</h2>

        <div className="comptabilite-grille">
          <div className="comptabilite-carte">
            <p className="comptabilite-label">Revenus</p>
            <p className="comptabilite-valeur">{formatFCFA(revenus)}</p>
          </div>
          <div className="comptabilite-carte">
            <p className="comptabilite-label">Charges</p>
            <p className="comptabilite-valeur">{formatFCFA(charges)}</p>
          </div>
          <div className="comptabilite-carte comptabilite-carte-accent">
            <p className="comptabilite-label">Bénéfice</p>
            <p className="comptabilite-valeur">{formatFCFA(revenus - charges)}</p>
          </div>
        </div>

        <section className="comptabilite-section">
          <h3>Ventes par catégorie</h3>
          <DonutChart segments={ventes} formatValeur={formatFCFA} />
        </section>

        <section className="comptabilite-section">
          <h3>Produits les plus vendus</h3>
          {topProduits.length === 0 ? (
            <p className="comptabilite-vide">Aucune vente ce mois-ci</p>
          ) : (
            <table className="comptabilite-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {topProduits.map((p) => (
                  <tr key={p.nom}>
                    <td>{p.nom}</td>
                    <td>{p.quantite}</td>
                    <td>{formatFCFA(p.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="comptabilite-section">
          <h3>Charges</h3>
          {listeCharges.length === 0 ? (
            <p className="comptabilite-vide">Aucune charge enregistrée pour ce mois</p>
          ) : (
            <table className="comptabilite-table">
              <thead>
                <tr>
                  <th>Charge</th>
                  <th>Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listeCharges.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nom}</td>
                    <td>{formatFCFA(c.montant)}</td>
                    <td>
                      <button
                        className="comptabilite-supprimer"
                        onClick={() => handleSupprimerCharge(c.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="comptabilite-ajout-charge">
            <input
              type="text"
              placeholder="Nom de la charge"
              value={nouveauNom}
              onChange={(e) => setNouveauNom(e.target.value)}
            />
            <input
              type="number"
              placeholder={`Montant (${devise === 'XOF' ? 'FCFA' : '€'})`}
              value={nouveauMontant}
              onChange={(e) => setNouveauMontant(e.target.value)}
            />
            <button className="comptabilite-bouton" onClick={handleAjouterCharge}>
              Ajouter
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (vue === 'bilan') {
    return (
      <div className="comptabilite">
        <button className="comptabilite-retour" onClick={() => setVue('resume')}>
          ← Retour
        </button>
        <h2>Bilan annuel</h2>

        <div className="comptabilite-grille">
          <div className="comptabilite-carte">
            <p className="comptabilite-label">Revenus totaux</p>
            <p className="comptabilite-valeur">{formatFCFA(totalRevenus)}</p>
          </div>
          <div className="comptabilite-carte">
            <p className="comptabilite-label">Charges totales</p>
            <p className="comptabilite-valeur">{formatFCFA(totalCharges)}</p>
          </div>
          <div className="comptabilite-carte comptabilite-carte-accent">
            <p className="comptabilite-label">Bénéfice net</p>
            <p className="comptabilite-valeur">{formatFCFA(totalBenefice)}</p>
          </div>
        </div>

        <table className="comptabilite-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th>Revenus</th>
              <th>Charges</th>
              <th>Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            {clesMoisDisponibles.map((cle) => {
              const revenus = getRevenusDuMois(cle);
              const charges = getTotalChargesDuMois(cle);
              return (
                <tr
                  key={cle}
                  className="comptabilite-ligne-cliquable"
                  onClick={() => {
                    setMoisSelectionne(cle);
                    setVue('detail');
                  }}
                >
                  <td>{libelleDuMois(cle)}</td>
                  <td>{formatFCFA(revenus)}</td>
                  <td>{formatFCFA(charges)}</td>
                  <td>{formatFCFA(revenus - charges)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const revenusDuMoisActuel = getRevenusDuMois(cleMoisActuel);
  const chargesDuMoisActuel = getTotalChargesDuMois(cleMoisActuel);
  const ventesDuMoisActuel = getVentesParCategorieDuMois(cleMoisActuel);

  return (
    <div className="comptabilite">
      <h2>Comptabilité</h2>

      <div className="comptabilite-grille">
        <div className="comptabilite-carte">
          <p className="comptabilite-label">Revenus du mois</p>
          <p className="comptabilite-valeur">{formatFCFA(revenusDuMoisActuel)}</p>
        </div>
        <div className="comptabilite-carte">
          <p className="comptabilite-label">Charges du mois</p>
          <p className="comptabilite-valeur">{formatFCFA(chargesDuMoisActuel)}</p>
        </div>
        <div className="comptabilite-carte comptabilite-carte-accent">
          <p className="comptabilite-label">Bénéfice net</p>
          <p className="comptabilite-valeur">
            {formatFCFA(revenusDuMoisActuel - chargesDuMoisActuel)}
          </p>
        </div>
      </div>

      <section className="comptabilite-section">
        <h3>Répartition des ventes par catégorie — {libelleDuMois(cleMoisActuel)}</h3>
        <DonutChart segments={ventesDuMoisActuel} formatValeur={formatFCFA} />
      </section>

      <section className="comptabilite-section">
        <h3>Export et historique</h3>
        {estPremium ? (
          <div className="comptabilite-outils">
            <button className="comptabilite-bouton">Exporter en Excel</button>
            <button className="comptabilite-bouton">Exporter en PDF</button>
            <button className="comptabilite-bouton" onClick={() => setVue('bilan')}>
              Voir le bilan annuel
            </button>
          </div>
        ) : (
          <div className="comptabilite-verrou">
            <p>L'export comptable et le bilan annuel sont réservés au plan Premium.</p>
            <span className="comptabilite-badge-premium">Premium</span>
          </div>
        )}
      </section>
    </div>
  );
}