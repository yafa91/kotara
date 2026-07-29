import { useState } from 'react';
import { useEmployes, useParametres } from '../store/AppDataContext';
import PavePinCode from './PavePinCode';
import './SelectionEmploye.css';

export interface Session {
  nom: string;
  role: 'employe' | 'gerant';
}

interface SelectionEmployeProps {
  onConnecte: (session: Session) => void;
  onDeconnexionCompte?: () => void;
}

type CibleEmploye = { type: 'employe'; nom: string; codeAttendu: string };
type CibleGerant = { type: 'gerant' };
type Cible = CibleEmploye | CibleGerant;

export default function SelectionEmploye({ onConnecte, onDeconnexionCompte }: SelectionEmployeProps) {
  const { employes } = useEmployes();
  const { verifierCodeAdmin } = useParametres();

  const [cibleChoisie, setCibleChoisie] = useState<Cible | null>(null);
  const [codeSaisi, setCodeSaisi] = useState('');
  const [erreur, setErreur] = useState('');

  const employesActifs = employes.filter((e) => e.actif);

  const handleValiderCode = (codeComplet: string) => {
    if (!cibleChoisie) return;

    if (cibleChoisie.type === 'gerant') {
      if (verifierCodeAdmin(codeComplet)) {
        onConnecte({ nom: 'Gérant', role: 'gerant' });
      } else {
        setErreur('Code incorrect');
        setCodeSaisi('');
      }
      return;
    }

    if (codeComplet === cibleChoisie.codeAttendu) {
      onConnecte({ nom: cibleChoisie.nom, role: 'employe' });
    } else {
      setErreur('Code incorrect');
      setCodeSaisi('');
    }
  };

  if (cibleChoisie) {
    return (
      <div className="selection-employe">
        <div className="selection-employe-carte">
          <h2>{cibleChoisie.type === 'gerant' ? 'Code gérant' : `Bonjour ${cibleChoisie.nom}`}</h2>
          <p className="selection-employe-sous-titre">Saisis ton code PIN</p>
          <PavePinCode
            code={codeSaisi}
            onChangerCode={(c) => {
              setCodeSaisi(c);
              setErreur('');
            }}
            onValider={handleValiderCode}
          />
          {erreur && <p className="selection-employe-erreur">{erreur}</p>}
          <button
            className="selection-employe-retour"
            onClick={() => {
              setCibleChoisie(null);
              setCodeSaisi('');
              setErreur('');
            }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="selection-employe">
      <div className="selection-employe-carte">
        <h2>Qui prend le service ?</h2>
        <p className="selection-employe-sous-titre">Choisis ton profil pour continuer</p>

        <div className="selection-employe-grille">
          <button
            className="selection-employe-tuile selection-employe-tuile-gerant"
            onClick={() => setCibleChoisie({ type: 'gerant' })}
          >
            Gérant
          </button>

          {employesActifs.map((emp) => (
            <button
              key={emp.id}
              className="selection-employe-tuile"
              onClick={() =>
                setCibleChoisie({ type: 'employe', nom: emp.nom, codeAttendu: emp.code })
              }
            >
              {emp.nom}
            </button>
          ))}
        </div>

        {employesActifs.length === 0 && (
          <p className="selection-employe-vide">
            Aucun employé enregistré, connecte-toi en Gérant pour en ajouter.
          </p>
        )}

        {onDeconnexionCompte && (
          <button className="selection-employe-deconnexion" onClick={onDeconnexionCompte}>
            Déconnecter
          </button>
        )}
      </div>
    </div>
  );
}
