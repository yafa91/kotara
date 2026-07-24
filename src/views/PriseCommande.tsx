import { useState } from 'react';
import { useMenu, useTicket, useHistorique, useParametres } from '../store/AppDataContext';
import type { Categorie, ModePaiement } from '../types';
import './PriseCommande.css';

const CATEGORIES: ('Tout' | Categorie)[] = [
  'Tout',
  'Plats',
  'Boissons',
  'Desserts',
  'Frites',
  'Sandwichs',
  'Salades',
  'Sauces',
  'Menus',
  'Pates',
  'Autres',
];

export default function PriseCommande() {
  const [categorieActive, setCategorieActive] = useState<'Tout' | Categorie>('Tout');
  const { articles } = useMenu();
  const { lignes, ajouterArticle, retirerArticle, viderTicket, total } = useTicket();
  const { prochainNumero, encaisser } = useHistorique();
  const { parametres } = useParametres();

  const [ticketOuvert, setTicketOuvert] = useState(false);

  const articlesFiltres = articles.filter(
    (a) => a.actif && (categorieActive === 'Tout' || a.categorie === categorieActive)
  );

  const totalArticles = lignes.reduce((s, l) => s + l.quantite, 0);

  const formatPrix = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

  const handleValider = (mode: ModePaiement) => {
    if (lignes.length === 0) return;
    const numero = encaisser(lignes, total, mode);
    viderTicket();
    setTicketOuvert(false);

    const libelles: Record<ModePaiement, string> = {
      espece: 'payé en espèces',
      mobile_money: 'payé en Mobile Money',
      en_attente: 'mis en attente (à encaisser depuis la Caisse)',
    };
    alert(`Ticket n°${numero} enregistré — ${libelles[mode]}`);
  };

  return (
    <div className="prise-commande-fullwidth">
      <div className="prise-commande-header">
        <h2>Nouvelle commande</h2>
        <div className="categories-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`categorie-chip ${categorieActive === cat ? 'categorie-chip-actif' : ''}`}
              onClick={() => setCategorieActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {articlesFiltres.length === 0 ? (
        <p className="ticket-vide">Aucun article dans cette catégorie</p>
      ) : (
        <div className="grille-articles">
          {articlesFiltres.map((article) => (
            <button
              key={article.id}
              className="carte-article"
              onClick={() => ajouterArticle(article)}
            >
              <div className="carte-article-icone">
                {article.photo ? (
                  <img src={article.photo} alt={article.nom} className="carte-article-photo" />
                ) : (
                  article.nom.charAt(0)
                )}
              </div>
              <p className="carte-article-nom">{article.nom}</p>
              <p className="carte-article-prix">{formatPrix(article.prix)}</p>
            </button>
          ))}
        </div>
      )}

      <button
        className={`panier-flottant ${totalArticles === 0 ? 'panier-flottant-cache' : ''}`}
        onClick={() => setTicketOuvert(true)}
      >
        🛒
        {totalArticles > 0 && <span className="panier-flottant-badge">{totalArticles}</span>}
      </button>

      {ticketOuvert && (
        <>
          <div className="ticket-overlay" onClick={() => setTicketOuvert(false)} />
          <div className="ticket-panel ticket-panel-flottant">
            <div className="ticket-panel-header">
              <button className="ticket-fermer" onClick={() => setTicketOuvert(false)}>
                ✕
              </button>
            </div>

            <div className="ticket-entete-resto">
              <p className="ticket-resto-nom">{parametres.nomResto}</p>
              <p className="ticket-resto-adresse">{parametres.adresseResto}</p>
            </div>

            <div className="ticket-numero">Ticket n°{prochainNumero}</div>

            {lignes.length === 0 ? (
              <p className="ticket-vide">Aucun article pour l'instant</p>
            ) : (
              <div className="ticket-lignes">
                {lignes.map((ligne) => (
                  <div key={ligne.articleId} className="ticket-ligne">
                    <div className="ticket-ligne-info">
                      <p className="ticket-ligne-nom">{ligne.nom}</p>
                      <p className="ticket-ligne-prix">
                        {formatPrix(ligne.prixUnitaire * ligne.quantite)}
                      </p>
                    </div>
                    <div className="ticket-ligne-qte">
                      <button onClick={() => retirerArticle(ligne.articleId)}>-</button>
                      <span>{ligne.quantite}</span>
                      <button
                        onClick={() =>
                          ajouterArticle({
                            id: ligne.articleId,
                            nom: ligne.nom,
                            prix: ligne.prixUnitaire,
                            categorie: 'Plats',
                            icone: '',
                            actif: true,
                          })
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="ticket-total">
              <span>Total</span>
              <span>{formatPrix(total)}</span>
            </div>

            <div className="boutons-paiement">
              <button
                className="bouton-paiement bouton-espece"
                disabled={lignes.length === 0}
                onClick={() => handleValider('espece')}
              >
                Espèces
              </button>
              <button
                className="bouton-paiement bouton-mobile"
                disabled={lignes.length === 0}
                onClick={() => handleValider('mobile_money')}
              >
                Mobile Money
              </button>
              <button
                className="bouton-paiement bouton-attente"
                disabled={lignes.length === 0}
                onClick={() => handleValider('en_attente')}
              >
                En attente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
