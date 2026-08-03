import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine } from 'lucide-react';
import { useMenu, useCategories, useDevise } from '../store/AppDataContext';
import type { Categorie } from '../types';
import { formatMontant } from '../lib/formatMontant';
import { jouerBip } from '../lib/jouerBip';
import './MenuProduits.css';
import './ScannerProduit.css';

interface MenuProduitsProps {
  typeEtablissement?: 'restaurant' | 'magasin';
}

export default function MenuProduits({ typeEtablissement = 'restaurant' }: MenuProduitsProps) {
  const { articles, ajouterArticle, modifierArticle, supprimerArticle } = useMenu();
  const { categories } = useCategories();
  const [nom, setNom] = useState('');
  const [prix, setPrix] = useState('');
  const [categorie, setCategorie] = useState<Categorie>(categories[0] || 'Autres');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [codeBarre, setCodeBarre] = useState<string | undefined>(undefined);
  const [erreur, setErreur] = useState('');

  const [idEnEdition, setIdEnEdition] = useState<string | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editPrix, setEditPrix] = useState('');
  const [editCategorie, setEditCategorie] = useState<Categorie>(categories[0] || 'Autres');
  const [editCommentaire, setEditCommentaire] = useState('');

  const devise = useDevise();
  const formatPrix = (n: number) => formatMontant(n, devise);

  const [scannerOuvert, setScannerOuvert] = useState(false);
  const [erreurScan, setErreurScan] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!scannerOuvert) return;

    const scanner = new Html5Qrcode('zone-scan-camera-menu');
    scannerRef.current = scanner;
    setErreurScan(null);

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (codeDetecte) => {
          jouerBip();
          const articleExistant = articles.find((a) => a.codeBarre === codeDetecte);
          if (articleExistant) {
            commencerEdition(articleExistant);
            setScannerOuvert(false);
            return;
          }
          setCodeBarre(codeDetecte);
          setScannerOuvert(false);
        },
        () => {}
      )
      .catch(() => {
        setErreurScan("Impossible d'accéder à la caméra.");
      });

    return () => {
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          scanner.clear();
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOuvert]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = () => setPhoto(lecteur.result as string);
    lecteur.readAsDataURL(fichier);
  };

  const handleAjouter = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!nom.trim()) {
      setErreur('Le nom du plat est obligatoire.');
      return;
    }
    const prixNombre = Number(prix);
    if (prix === '' || Number.isNaN(prixNombre) || prixNombre < 0) {
      setErreur('Le prix doit être un nombre valide (0 ou plus).');
      return;
    }
    ajouterArticle(nom.trim(), prixNombre, categorie, photo, codeBarre);
    setNom('');
    setPrix('');
    setPhoto(undefined);
    setCodeBarre(undefined);
  };

  const handleSupprimer = (id: string, nomArticle: string) => {
    const confirme = window.confirm(`Supprimer "${nomArticle}" du menu ?`);
    if (confirme) supprimerArticle(id);
  };

  const handlePhotoModifiee = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = () => modifierArticle(id, { photo: lecteur.result as string });
    lecteur.readAsDataURL(fichier);
  };

  const commencerEdition = (article: typeof articles[number]) => {
    setIdEnEdition(article.id);
    setEditNom(article.nom);
    setEditPrix(String(article.prix));
    setEditCategorie(article.categorie);
    setEditCommentaire(article.commentaire || '');
  };

  const annulerEdition = () => {
    setIdEnEdition(null);
  };

  const enregistrerEdition = (id: string) => {
    const prixNombre = Number(editPrix);
    if (!editNom.trim() || editPrix === '' || Number.isNaN(prixNombre) || prixNombre < 0) {
      return;
    }
    modifierArticle(id, {
      nom: editNom.trim(),
      prix: prixNombre,
      categorie: editCategorie,
      commentaire: editCommentaire.trim() || undefined,
    });
    setIdEnEdition(null);
  };

  return (
    <div className="menu-produits">
      <h2>Menu / produits</h2>
      <form className="form-ajout" onSubmit={handleAjouter}>
        <label className="input-photo">
          {photo ? (
            <img src={photo} alt="Aperçu" className="apercu-photo" />
          ) : (
            <span>+ Photo</span>
          )}
          <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
        </label>
        {typeEtablissement === 'magasin' && (
          <button
            type="button"
            className="bouton-scan-camera"
            onClick={() => setScannerOuvert(true)}
            title="Scanner un code-barres pour préremplir la fiche"
          >
            <ScanLine size={20} />
          </button>
        )}
        <input
          type="text"
          placeholder="Nom du plat"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <input
          type="number"
          placeholder={`Prix (${devise === 'XOF' ? 'FCFA' : '€'})`}
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
        />
        <select value={categorie} onChange={(e) => setCategorie(e.target.value as Categorie)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button type="submit" className="bouton-ajouter">
          Ajouter
        </button>
      </form>
      {codeBarre && (
        <p className="menu-produits-codebarre-info">
          Code-barres scanné : <strong>{codeBarre}</strong>
          <button
            type="button"
            className="menu-produits-codebarre-effacer"
            onClick={() => setCodeBarre(undefined)}
          >
            ✕
          </button>
        </p>
      )}
      {erreur && <p className="message-erreur">{erreur}</p>}

      {scannerOuvert && (
        <div className="scanner-overlay">
          <div className="scanner-panel">
            <div className="scanner-panel-header">
              <h3>Scanner un produit</h3>
              <button className="ticket-fermer" onClick={() => setScannerOuvert(false)}>
                ✕
              </button>
            </div>
            <div id="zone-scan-camera-menu" className="zone-scan-camera" />
            {erreurScan && <p className="scanner-erreur">{erreurScan}</p>}
          </div>
        </div>
      )}

      <div className="liste-articles">
        {articles.length === 0 ? (
          <p className="liste-vide">Aucun article dans le menu</p>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="ligne-article">
              {idEnEdition === article.id ? (
                <div className="ligne-article-edition">
                  <input
                    type="text"
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    placeholder="Nom du plat"
                  />
                  <input
                    type="number"
                    value={editPrix}
                    onChange={(e) => setEditPrix(e.target.value)}
                    placeholder={`Prix (${devise === 'XOF' ? 'FCFA' : '€'})`}
                  />
                  <select
                    value={editCategorie}
                    onChange={(e) => setEditCategorie(e.target.value as Categorie)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editCommentaire}
                    onChange={(e) => setEditCommentaire(e.target.value)}
                    placeholder="Commentaire (ex: sans oignon)"
                    className="input-commentaire"
                  />
                  <div className="ligne-article-edition-actions">
                    <button
                      className="bouton-enregistrer"
                      onClick={() => enregistrerEdition(article.id)}
                    >
                      Enregistrer
                    </button>
                    <button className="bouton-annuler" onClick={annulerEdition}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ligne-article-gauche">
                    <label className="miniature-photo">
                      {article.photo ? (
                        <img src={article.photo} alt={article.nom} />
                      ) : (
                        <span>{article.nom.charAt(0)}</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoModifiee(article.id, e)}
                        hidden
                      />
                    </label>
                    <div className="ligne-article-info">
                      <p className="ligne-article-nom">{article.nom}</p>
                      <p className="ligne-article-meta">
                        {article.categorie} · {formatPrix(article.prix)}
                      </p>
                      {article.commentaire && (
                        <p className="ligne-article-commentaire">{article.commentaire}</p>
                      )}
                    </div>
                  </div>
                  <div className="ligne-article-actions">
                    <label className="toggle-actif">
                      <input
                        type="checkbox"
                        checked={article.actif}
                        onChange={(e) =>
                          modifierArticle(article.id, { actif: e.target.checked })
                        }
                      />
                      Actif
                    </label>
                    <button
                      className="bouton-modifier"
                      onClick={() => commencerEdition(article)}
                    >
                      Modifier
                    </button>
                    <button
                      className="bouton-supprimer"
                      onClick={() => handleSupprimer(article.id, article.nom)}
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
