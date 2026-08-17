import { useState } from 'react';
import {
  useMenu,
  useTicket,
  useHistorique,
  useParametres,
  useCategories,
  useDevise,
} from '../store/AppDataContext';
import type { Categorie, ModePaiement } from '../types';
import { formatMontant } from '../lib/formatMontant';
import {
  bluetoothDisponible,
  imprimerTicketBluetooth,
} from '../lib/imprimanteBluetooth';
import './PriseCommande.css';

interface PriseCommandeProps {
  employeId: string | null;
}

export default function PriseCommande({ employeId }: PriseCommandeProps) {
  const { categories } = useCategories();
  const [categorieActive, setCategorieActive] = useState<'Tout' | Categorie>('Tout');
  const { articles } = useMenu();
  const { lignes, ajouterArticle, retirerArticle, viderTicket, total } = useTicket();
  const { prochainNumero, encaisser } = useHistorique();
  const { parametres } = useParametres();

  const [ticketOuvert, setTicketOuvert] = useState(false);
  const [modePaiementChoisi, setModePaiementChoisi] = useState<'espece' | 'mobile_money' | null>(
    null
  );
  const [enTraitement, setEnTraitement] = useState(false);
  const [enTraitementBluetooth, setEnTraitementBluetooth] = useState(false);
  const [erreurBluetooth, setErreurBluetooth] = useState('');

  const articlesFiltres = articles.filter(
    (a) => a.actif && (categorieActive === 'Tout' || a.categorie === categorieActive)
  );

  const totalArticles = lignes.reduce((s, l) => s + l.quantite, 0);

  const devise = useDevise();
  const formatPrix = (n: number) => formatMontant(n, devise);
  const labelMobileMoney = devise === 'XOF' ? 'Mobile Money' : 'Carte bancaire';

  const handleImprimerEtEncaisser = async () => {
    if (lignes.length === 0 || !modePaiementChoisi || enTraitement) return;

    setEnTraitement(true);
    await encaisser(lignes, total, modePaiementChoisi as ModePaiement, employeId);
    setEnTraitement(false);

    // window.print() est bloquant : le code reprend seulement une fois
    // la boîte de dialogue d'impression fermée par l'utilisateur.
    window.print();

    viderTicket();
    setTicketOuvert(false);
    setModePaiementChoisi(null);
  };

  const handleImprimerBluetooth = async () => {
    if (lignes.length === 0 || !modePaiementChoisi || enTraitementBluetooth) return;

    setEnTraitementBluetooth(true);
    setErreurBluetooth('');
    try {
      const numero = await encaisser(
        lignes,
        total,
        modePaiementChoisi as ModePaiement,
        employeId
      );
      await imprimerTicketBluetooth({
        nomResto: parametres.nomResto,
        adresseResto: parametres.adresseResto,
        telephoneResto: parametres.telephoneResto,
        numero,
        lignes: lignes.map((l) => ({
          nom: l.nom,
          quantite: l.quantite,
          montant: formatPrix(l.prixUnitaire * l.quantite),
        })),
        total: formatPrix(total),
        modePaiement: modePaiementChoisi === 'espece' ? 'Especes' : labelMobileMoney,
      });
      viderTicket();
      setTicketOuvert(false);
      setModePaiementChoisi(null);
    } catch (e) {
      setErreurBluetooth(e instanceof Error ? e.message : "Erreur d'impression Bluetooth.");
    } finally {
      setEnTraitementBluetooth(false);
    }
  };

  return (
    <div className="prise-commande-fullwidth">
      <div className="prise-commande-header">
        <h2>Nouvelle commande</h2>
        <div className="categories-row">
          <button
            className={`categorie-chip ${categorieActive === 'Tout' ? 'categorie-chip-actif' : ''}`}
            onClick={() => setCategorieActive('Tout')}
          >
            Tout
          </button>
          {categories.map((cat) => (
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
                            categorie: categorieActive === 'Tout' ? 'Autres' : categorieActive,
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
                {labelMobileMoney}
              </button>
            </div>

            <button
              className="bouton-paiement bouton-imprimer"
              disabled={lignes.length === 0 || !modePaiementChoisi || enTraitement}
              onClick={handleImprimerEtEncaisser}
            >
              {enTraitement ? 'Enregistrement...' : '🖨️ Imprimer le ticket'}
            </button>

            {bluetoothDisponible() && (
              <button
                className="bouton-paiement bouton-imprimer"
                style={{ marginTop: 8 }}
                disabled={lignes.length === 0 || !modePaiementChoisi || enTraitementBluetooth}
                onClick={handleImprimerBluetooth}
              >
                {enTraitementBluetooth
                  ? 'Impression...'
                  : '📶 Imprimer (imprimante Bluetooth)'}
              </button>
            )}
            {erreurBluetooth && <p className="message-erreur">{erreurBluetooth}</p>}

            {/* Zone visible uniquement à l'impression */}
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
                {modePaiementChoisi === 'espece'
                  ? 'Espèces'
                  : modePaiementChoisi === 'mobile_money'
                  ? labelMobileMoney
                  : ''}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}