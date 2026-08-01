import { useMemo, useState } from 'react';
import {
  useHistorique,
  useService,
  useParametres,
  useSortiesCaisse,
  useDevise,
} from '../store/AppDataContext';
import PavePinCode from '../components/PavePinCode';
import { formatMontant } from '../lib/formatMontant';
import './Caisse.css';

function dateDuJour() {
  return new Date().toISOString().slice(0, 10);
}

export default function Caisse() {
  const { commandes, commandesEnAttente, marquerPayee } = useHistorique();
  const { serviceOuvertAujourdHui, demarrerService, cloturerServiceAvecComptage } = useService();
  const { verifierCodeAdmin } = useParametres();
  const { sortiesCaisse, ajouterSortieCaisse } = useSortiesCaisse();

  const [estAuthentifie, setEstAuthentifie] = useState(false);
  const [codeSaisi, setCodeSaisi] = useState('');
  const [erreurCode, setErreurCode] = useState('');
  const [dateSelectionnee, setDateSelectionnee] = useState(dateDuJour());
  const [modeComptage, setModeComptage] = useState(false);
  const [montantSaisi, setMontantSaisi] = useState('');
  const [clotureEnCours, setClotureEnCours] = useState(false);

  const [modeSortie, setModeSortie] = useState(false);
  const [motifSortie, setMotifSortie] = useState('');
  const [montantSortie, setMontantSortie] = useState('');
  const [erreurSortie, setErreurSortie] = useState('');

  const devise = useDevise();
  const formatPrix = (n: number) => formatMontant(n, devise);
  const labelMobileMoney = devise === 'XOF' ? 'Mobile Money' : 'Carte bancaire';
  const formatHeure = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handleValiderCodeAcces = (codeComplet: string) => {
    if (verifierCodeAdmin(codeComplet)) {
      setEstAuthentifie(true);
      setErreurCode('');
      setCodeSaisi('');
    } else {
      setErreurCode('Code incorrect');
      setCodeSaisi('');
    }
  };

  const commandesDuJourSelectionne = useMemo(
    () => commandes.filter((c) => c.dateCreation.slice(0, 10) === dateSelectionnee),
    [commandes, dateSelectionnee]
  );

  const sortiesDuJourSelectionne = useMemo(
    () => sortiesCaisse.filter((s) => s.date === dateSelectionnee),
    [sortiesCaisse, dateSelectionnee]
  );

  if (!estAuthentifie) {
    return (
      <div className="caisse-verrouillee">
        <h2>Caisse verrouillée</h2>
        <p className="comptage-texte">Saisis le code administrateur pour y accéder.</p>
        <PavePinCode
          code={codeSaisi}
          onChangerCode={(c) => {
            setCodeSaisi(c);
            setErreurCode('');
          }}
          onValider={handleValiderCodeAcces}
        />
        {erreurCode && <p className="message-erreur-code">{erreurCode}</p>}
      </div>
    );
  }

  const totalEspecesVentes = commandesDuJourSelectionne
    .filter((c) => c.modePaiement === 'espece')
    .reduce((s, c) => s + c.total, 0);
  const totalMobileMoney = commandesDuJourSelectionne
    .filter((c) => c.modePaiement === 'mobile_money')
    .reduce((s, c) => s + c.total, 0);
  const totalEnAttente = commandesDuJourSelectionne
    .filter((c) => c.modePaiement === 'en_attente')
    .reduce((s, c) => s + c.total, 0);
  const totalSorties = sortiesDuJourSelectionne.reduce((s, sortie) => s + sortie.montant, 0);
  const totalEspeces = totalEspecesVentes - totalSorties;
  const totalJour = totalEspecesVentes + totalMobileMoney + totalEnAttente;
  const estAujourdHui = dateSelectionnee === dateDuJour();

  const handleDemanderCloture = () => {
    if (commandesEnAttente.length > 0) {
      alert(
        `Impossible de clôturer : il reste ${commandesEnAttente.length} ticket(s) en attente d'encaissement. Encaisse-les d'abord (Espèces ou Mobile Money) ci-dessous.`
      );
      return;
    }
    setModeComptage(true);
  };

  const montantSaisiNombre = Number(montantSaisi);
  const ecart = montantSaisiNombre - totalEspeces;
  const saisieValide = montantSaisi !== '' && !Number.isNaN(montantSaisiNombre);

  const handleConfirmerCloture = async () => {
    if (!saisieValide || clotureEnCours) return;
    setClotureEnCours(true);
    await cloturerServiceAvecComptage({
      montantEspecesReel: montantSaisiNombre,
      totalEspecesTheorique: totalEspeces,
      totalMobileMoney,
      totalGeneral: totalJour,
    });
    setClotureEnCours(false);
    setModeComptage(false);
    setMontantSaisi('');
  };

  const handleAjouterSortie = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurSortie('');
    const montantNombre = Number(montantSortie);
    if (!motifSortie.trim()) {
      setErreurSortie('Le motif est obligatoire.');
      return;
    }
    if (!montantSortie || Number.isNaN(montantNombre) || montantNombre <= 0) {
      setErreurSortie('Le montant doit être un nombre supérieur à 0.');
      return;
    }
    await ajouterSortieCaisse(motifSortie.trim(), montantNombre);
    setMotifSortie('');
    setMontantSortie('');
    setModeSortie(false);
  };

  return (
    <div className="caisse">
      <div className="caisse-header">
        <h2>Caisse</h2>
        <input
          type="date"
          className="selecteur-date"
          value={dateSelectionnee}
          onChange={(e) => setDateSelectionnee(e.target.value)}
        />
      </div>

      {estAujourdHui && (
        <div className="bloc-service">
          {serviceOuvertAujourdHui ? (
            <>
              <span className="statut-service statut-ouvert">Service en cours</span>
              {!modeComptage && (
                <button className="bouton-cloturer" onClick={handleDemanderCloture}>
                  Clôturer le service
                </button>
              )}
            </>
          ) : (
            <>
              <span className="statut-service statut-ferme">Service non démarré</span>
              <button className="bouton-demarrer" onClick={() => demarrerService()}>
                Démarrer le service
              </button>
            </>
          )}
        </div>
      )}

      {modeComptage && (
        <div className="bloc-comptage">
          <h3>Comptage de caisse</h3>
          <p className="comptage-texte">
            Compte l'argent liquide présent dans la caisse et saisis le montant réel.
          </p>
          <div className="comptage-ligne">
            <span>Total espèces théorique (ventes - sorties)</span>
            <span>{formatPrix(totalEspeces)}</span>
          </div>
          <input
            type="number"
            className="comptage-input"
            placeholder={`Montant réel compté (${devise === 'XOF' ? 'FCFA' : '€'})`}
            value={montantSaisi}
            onChange={(e) => setMontantSaisi(e.target.value)}
          />
          {saisieValide && (
            <div
              className={`comptage-ecart ${
                ecart === 0 ? 'ecart-ok' : ecart > 0 ? 'ecart-surplus' : 'ecart-manque'
              }`}
            >
              {ecart === 0
                ? 'La caisse est juste ✅'
                : ecart > 0
                ? `Surplus de ${formatPrix(ecart)}`
                : `Manque de ${formatPrix(Math.abs(ecart))}`}
            </div>
          )}
          <div className="comptage-actions">
            <button className="bouton-annuler" onClick={() => setModeComptage(false)}>
              Annuler
            </button>
            <button
              className="bouton-confirmer-cloture"
              disabled={!saisieValide || clotureEnCours}
              onClick={handleConfirmerCloture}
            >
              {clotureEnCours ? 'Clôture en cours...' : 'Confirmer la clôture'}
            </button>
          </div>
        </div>
      )}

      <div className="recap-jour">
        <div className="recap-carte">
          <span className="recap-label">Espèces (net)</span>
          <span className="recap-valeur">{formatPrix(totalEspeces)}</span>
        </div>
        <div className="recap-carte">
          <span className="recap-label">{labelMobileMoney}</span>
          <span className="recap-valeur">{formatPrix(totalMobileMoney)}</span>
        </div>
        <div className="recap-carte">
          <span className="recap-label">En attente</span>
          <span className="recap-valeur">{formatPrix(totalEnAttente)}</span>
        </div>
        <div className="recap-carte recap-carte-total">
          <span className="recap-label">Total du jour</span>
          <span className="recap-valeur">{formatPrix(totalJour)}</span>
        </div>
      </div>

      <div className="bloc-sorties">
        <div className="bloc-sorties-header">
          <p className="caisse-sous-titre">
            Sorties de caisse{totalSorties > 0 && ` — Total : ${formatPrix(totalSorties)}`}
          </p>
          {!modeSortie && (
            <button className="bouton-ajouter-sortie" onClick={() => setModeSortie(true)}>
              + Nouvelle sortie
            </button>
          )}
        </div>

        {modeSortie && (
          <form className="form-sortie" onSubmit={handleAjouterSortie}>
            <input
              type="text"
              placeholder="Motif (ex: achat de gaz, course fournisseur...)"
              value={motifSortie}
              onChange={(e) => setMotifSortie(e.target.value)}
            />
            <input
              type="number"
              placeholder={`Montant (${devise === 'XOF' ? 'FCFA' : '€'})`}
              value={montantSortie}
              onChange={(e) => setMontantSortie(e.target.value)}
            />
            <div className="form-sortie-actions">
              <button
                type="button"
                className="bouton-annuler"
                onClick={() => {
                  setModeSortie(false);
                  setErreurSortie('');
                  setMotifSortie('');
                  setMontantSortie('');
                }}
              >
                Annuler
              </button>
              <button type="submit" className="bouton-confirmer-sortie">
                Enregistrer
              </button>
            </div>
            {erreurSortie && <p className="message-erreur">{erreurSortie}</p>}
          </form>
        )}

        {sortiesDuJourSelectionne.length > 0 && (
          <div className="liste-sorties">
            {sortiesDuJourSelectionne.map((sortie) => (
              <div key={sortie.id} className="ligne-sortie">
                <span className="ligne-sortie-motif">{sortie.motif}</span>
                <span className="ligne-sortie-heure">{formatHeure(sortie.dateCreation)}</span>
                <span className="ligne-sortie-montant">-{formatPrix(sortie.montant)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="caisse-sous-titre">Tickets en attente d'encaissement</p>
      {commandesEnAttente.length === 0 ? (
        <div className="caisse-vide">
          <p>Aucun ticket en attente </p>
        </div>
      ) : (
        <div className="liste-tickets-attente">
          {commandesEnAttente.map((commande) => (
            <div key={commande.id} className="carte-ticket-attente">
              <div className="carte-ticket-header">
                <span className="carte-ticket-numero">Ticket n°{commande.numero}</span>
                <span className="carte-ticket-heure">{formatHeure(commande.dateCreation)}</span>
              </div>
              <div className="carte-ticket-lignes">
                {commande.lignes.map((ligne) => (
                  <div key={ligne.articleId} className="carte-ticket-ligne">
                    <span>
                      {ligne.quantite}x {ligne.nom}
                    </span>
                    <span>{formatPrix(ligne.prixUnitaire * ligne.quantite)}</span>
                  </div>
                ))}
              </div>
              <div className="carte-ticket-total">
                <span>Total</span>
                <span>{formatPrix(commande.total)}</span>
              </div>
              <div className="carte-ticket-actions">
                <button
                  className="bouton-encaisser bouton-espece"
                  onClick={() => marquerPayee(commande.id, 'espece')}
                >
                  Espèces
                </button>
                <button
                  className="bouton-encaisser bouton-mobile"
                  onClick={() => marquerPayee(commande.id, 'mobile_money')}
                >
                  {labelMobileMoney}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}