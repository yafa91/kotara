import { useState } from 'react';
import { useMenu, useTicket, useHistorique, useParametres } from '../store/AppDataContext';
import type { ModePaiement } from '../types';
import './PriseCommande.css';
import './ScannerProduit.css';

const LABELS_PAIEMENT: Record<'espece' | 'mobile_money', string> = {
  espece: 'Espèces',
  mobile_money: 'Mobile Money',
};

export default function ScannerProduit() {
  const [recherche, setRecherche] = useState('');
  const { articles } = useMenu();
  const { lignes, ajouterArticle, retirerArticle, viderTicket, total } = useTicket();
  const { prochainNumero, encaisser } = useHistorique();
  const { parametres } = useParametres();

  const [ticketOuvert, setTicketOuvert] = useState(false);
  const [modePaiementChoisi, setModePaiementChoisi] = useState<'espece' | 'mobile_money' | null>(
    null
  );

  const articlesFiltres = articles.filter(
    (a) =>
      a.actif &&
      (recherche.trim() === '' || a.nom.toLowerCase().includes(recherche.trim().toLowerCase()))
  );

  const totalArticles = lignes.reduce((s, l) => s + l.quantite, 0);
  const formatPrix = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

  const handleAjouterEtViderRecherche = (article: (typeof articles)[number]) => {
    ajouterArticle(article);
    setRecherche('');
  };

  const handleImprimerEtEncaisser = () => {
    if (lignes.length === 0 || !modePaiementChoisi) return;
    encaisser(lignes, total, modePaiementChoisi as ModePaiement);
    window.print();
    viderTicket();
    setTicketOuvert(false);
    setModePaiementChoisi(null);
  };

  return (
    <div className="prise-commande-fullwidth">
      <div className="scanner-header">
        <h2>Scanner un produit</h2>
        <div className="scanner-barre">
          <span className="scanner-icone">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder="Scanner un code-barres ou rechercher un produit..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      {articlesFiltres.length === 0 ? (
        <p className="ticket-vide">
          {recherche.trim() === '' ? 'Aucun produit dans le stock' : 'Aucun produit trouvé'}
        </p>
      ) : (
        <div className="grille-articles">
          {articlesFiltres.map((article) => (
            <button
              key={article.id}
              className="carte-article"
              onClick={() => handleAjouterEtViderRecherche(article)}
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
              <p className="ticket-resto-telephone">{parametres.telephoneResto}</p>
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
                            categorie: 'Autres',
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

            <p className="ticket-choix-paiement-label">Mode de règlement</p>
            <div className="boutons-choix-paiement">
              <button
                className={`bouton-choix bouton-choix-espece ${
                  modePaiementChoisi === 'espece' ? 'bouton-choix-actif' : ''
                }`}
                onClick={() => setModePaiementChoisi('espece')}
              >
                Espèces
              </button>
              <button
                className={`bouton-choix bouton-choix-mobile ${
                  modePaiementChoisi === 'mobile_money' ? 'bouton-choix-actif' : ''
                }`}
                onClick={() => setModePaiementChoisi('mobile_money')}
              >
                Mobile Money
              </button>
            </div>

            <button
              className="bouton-paiement bouton-imprimer"
              disabled={lignes.length === 0 || !modePaiementChoisi}
              onClick={handleImprimerEtEncaisser}
            >
              🖨️ Imprimer le ticket
            </button>

            <div className="zone-impression">
              <p className="impression-nom">{parametres.nomResto}</p>
              <p className="impression-adresse">{parametres.adresseResto}</p>
              <p className="impression-telephone">{parametres.telephoneResto}</p>
              <p className="impression-numero">Ticket n°{prochainNumero}</p>
              <hr />
              {lignes.map((ligne) => (
                <div key={ligne.articleId} className="impression-ligne">
                  <span>
                    {ligne.quantite}x {ligne.nom}
                  </span>
                  <span>{formatPrix(ligne.prixUnitaire * ligne.quantite)}</span>
                </div>
              ))}
              <hr />
              <div className="impression-total">
                <span>Total</span>
                <span>{formatPrix(total)}</span>
              </div>
              <p className="impression-paiement">
                Mode de règlement :{' '}
                {modePaiementChoisi ? LABELS_PAIEMENT[modePaiementChoisi] : ''}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
