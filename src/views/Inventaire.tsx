import { useMemo, useState } from 'react';
import { useMenu } from '../store/AppDataContext';
import './Inventaire.css';

export default function Inventaire() {
  const { articles, modifierArticle } = useMenu();
  const [recherche, setRecherche] = useState('');

  const articlesTries = useMemo(
    () => [...articles].sort((a, b) => a.nom.localeCompare(b.nom)),
    [articles]
  );

  const articlesFiltres = articlesTries.filter((a) =>
    recherche.trim() === '' ? true : a.nom.toLowerCase().includes(recherche.trim().toLowerCase())
  );

  const articlesEnAlerte = articlesTries.filter((a) => a.stock <= a.seuilAlerte);

  const handleChangerStock = (id: string, valeur: string) => {
    const nombre = Number(valeur);
    if (valeur === '' || Number.isNaN(nombre) || nombre < 0) return;
    modifierArticle(id, { stock: nombre });
  };

  const handleAjuster = (id: string, stockActuel: number, delta: number) => {
    const nouveauStock = Math.max(0, stockActuel + delta);
    modifierArticle(id, { stock: nouveauStock });
  };

  const handleChangerSeuil = (id: string, valeur: string) => {
    const nombre = Number(valeur);
    if (valeur === '' || Number.isNaN(nombre) || nombre < 0) return;
    modifierArticle(id, { seuilAlerte: nombre });
  };

  return (
    <div className="inventaire">
      <div className="inventaire-header">
        <h2>Inventaire</h2>
        <input
          type="text"
          className="inventaire-recherche"
          placeholder="Rechercher un produit..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {articlesEnAlerte.length > 0 && (
        <div className="inventaire-alerte-globale">
          ⚠️ {articlesEnAlerte.length} produit{articlesEnAlerte.length > 1 ? 's' : ''} en stock
          bas : {articlesEnAlerte.map((a) => a.nom).join(', ')}
        </div>
      )}

      {articlesFiltres.length === 0 ? (
        <p className="inventaire-vide">Aucun produit trouvé</p>
      ) : (
        <div className="inventaire-liste">
          <div className="inventaire-ligne inventaire-ligne-entete">
            <span>Produit</span>
            <span>Stock actuel</span>
            <span>Ajuster</span>
            <span>Seuil d'alerte</span>
          </div>

          {articlesFiltres.map((article) => {
            const enAlerte = article.stock <= article.seuilAlerte;
            return (
              <div
                key={article.id}
                className={`inventaire-ligne ${enAlerte ? 'inventaire-ligne-alerte' : ''}`}
              >
                <div className="inventaire-produit">
                  <span className="inventaire-produit-nom">{article.nom}</span>
                  {enAlerte && <span className="inventaire-badge-alerte">Stock bas</span>}
                </div>

                <input
                  type="number"
                  className="inventaire-input-stock"
                  value={article.stock}
                  onChange={(e) => handleChangerStock(article.id, e.target.value)}
                  min={0}
                />

                <div className="inventaire-ajuster">
                  <button onClick={() => handleAjuster(article.id, article.stock, -1)}>-</button>
                  <button onClick={() => handleAjuster(article.id, article.stock, 1)}>+</button>
                </div>

                <input
                  type="number"
                  className="inventaire-input-seuil"
                  value={article.seuilAlerte}
                  onChange={(e) => handleChangerSeuil(article.id, e.target.value)}
                  min={0}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}