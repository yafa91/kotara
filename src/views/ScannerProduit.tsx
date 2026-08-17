import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine } from 'lucide-react';
import { useMenu, useTicket, useHistorique, useParametres, useDevise } from '../store/AppDataContext';
import type { ModePaiement } from '../types';
import { formatMontant } from '../lib/formatMontant';
import {
  bluetoothDisponible,
  imprimerTicketBluetooth,
} from '../lib/imprimanteBluetooth';
import './PriseCommande.css';
import './ScannerProduit.css';

interface ScannerProduitProps {
  employeId: string | null;
}

export default function ScannerProduit({ employeId }: ScannerProduitProps) {
  const [recherche, setRecherche] = useState('');
  const { articles } = useMenu();
  const { lignes, ajouterArticle, retirerArticle, viderTicket, total } = useTicket();
  const { prochainNumero, encaisser } = useHistorique();
  const { parametres } = useParametres();

  const [ticketOuvert, setTicketOuvert] = useState(false);
  const [modePaiementChoisi, setModePaiementChoisi] = useState<'espece' | 'mobile_money' | null>(
    null
  );
  const [enTraitementBluetooth, setEnTraitementBluetooth] = useState(false);
  const [erreurBluetooth, setErreurBluetooth] = useState('');

  // --- Scanner caméra ---
  const [scannerOuvert, setScannerOuvert] = useState(false);
  const [erreurScan, setErreurScan] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!scannerOuvert) return;

    const scanner = new Html5Qrcode('zone-scan-camera');
    scannerRef.current = scanner;
    setErreurScan(null);

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (codeDetecte) => {
          const article = articles.find((a) => a.codeBarre === codeDetecte);
          if (article) {
            ajouterArticle(article);
            setScannerOuvert(false);
          } else {
            setErreurScan(`Aucun produit ne correspond au code ${codeDetecte}`);
          }
        },
        () => {
          // erreurs de lecture image par image : on ignore, c'est normal
        }
      )
      .catch(() => {
        setErreurScan("Impossible d'accéder à la caméra.");
      });

    return () => {
      // stop() est asynchrone : il faut attendre qu'il se termine avant
      // d'appeler clear(), sinon html5-qrcode lève "Cannot clear while
      // scan is ongoing" et fait planter le composant React.
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          scanner.clear();
        });
    };
  }, [scannerOuvert, articles, ajouterArticle]);

  const articlesFiltres = articles.filter(
    (a) =>
      a.actif &&
      (recherche.trim() === '' || a.nom.toLowerCase().includes(recherche.trim().toLowerCase()))
  );

  const totalArticles = lignes.reduce((s, l) => s + l.quantite, 0);
  const devise = useDevise();
  const formatPrix = (n: number) => formatMontant(n, devise);
  const labelMobileMoney = devise === 'XOF' ? 'Mobile Money' : 'Carte bancaire';

  const handleAjouterEtViderRecherche = (article: (typeof articles)[number]) => {
    ajouterArticle(article);
    setRecherche('');
  };

  const handleImprimerEtEncaisser = async () => {
    if (lignes.length === 0 || !modePaiementChoisi) return;
    await encaisser(lignes, total, modePaiementChoisi as ModePaiement, employeId);
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
          <button
            type="button"
            className="bouton-scan-camera"
            onClick={() => setScannerOuvert(true)}
            title="Scanner avec la caméra"
          >
            <ScanLine size={20} />
          </button>
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

      {scannerOuvert && (
        <div className="scanner-overlay">
          <div className="scanner-panel">
            <div className="scanner-panel-header">
              <h3>Scanner un produit</h3>
              <button className="ticket-fermer" onClick={() => setScannerOuvert(false)}>
                ✕
              </button>
            </div>
            <div id="zone-scan-camera" className="zone-scan-camera" />
            {erreurScan && <p className="scanner-erreur">{erreurScan}</p>}
          </div>
        </div>
      )}

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
                {labelMobileMoney}
              </button>
            </div>

            <button
              className="bouton-paiement bouton-imprimer"
              disabled={lignes.length === 0 || !modePaiementChoisi}
              onClick={handleImprimerEtEncaisser}
            >
              🖨️ Imprimer le ticket
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