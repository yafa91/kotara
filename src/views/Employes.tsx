import { useState } from 'react';
import { useEmployes } from '../store/AppDataContext';
import type { RoleEmploye } from '../types';
import './Employes.css';

export default function Employes() {
  const { employes, ajouterEmploye, modifierEmploye, supprimerEmploye } = useEmployes();

  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState<RoleEmploye>('employe');
  const [erreur, setErreur] = useState('');

  const handleAjouter = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');

    if (!nom.trim()) {
      setErreur('Le nom est obligatoire.');
      return;
    }
    if (!/^\d{4}$/.test(code)) {
      setErreur('Le code doit faire exactement 4 chiffres.');
      return;
    }
    if (employes.some((emp) => emp.code === code)) {
      setErreur('Ce code est déjà utilisé par un autre employé.');
      return;
    }

    ajouterEmploye(nom.trim(), code, role);
    setNom('');
    setCode('');
    setRole('employe');
  };

  const handleSupprimer = (id: string, nomEmploye: string) => {
    if (window.confirm(`Supprimer "${nomEmploye}" ?`)) {
      supprimerEmploye(id);
    }
  };

  return (
    <div className="employes">
      <h2>Employés</h2>

      <form className="employes-form" onSubmit={handleAjouter}>
        <input
          type="text"
          placeholder="Nom de l'employé"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="Code PIN (4 chiffres)"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        />
        <select value={role} onChange={(e) => setRole(e.target.value as RoleEmploye)}>
          <option value="employe">Employé</option>
          <option value="gerant">Gérant</option>
        </select>
        <button type="submit" className="employes-bouton-ajouter">
          Ajouter
        </button>
      </form>

      {erreur && <p className="employes-erreur">{erreur}</p>}

      {employes.length === 0 ? (
        <p className="employes-vide">Aucun employé enregistré</p>
      ) : (
        <div className="employes-liste">
          {employes.map((emp) => (
            <div key={emp.id} className="employe-ligne">
              <div className="employe-info">
                <p className="employe-nom">{emp.nom}</p>
                <p className="employe-meta">
                  Code : {emp.code} ·{' '}
                  <span className={`employe-role employe-role-${emp.role}`}>
                    {emp.role === 'gerant' ? 'Gérant' : 'Employé'}
                  </span>
                </p>
              </div>

              <div className="employe-actions">
                <label className="employe-toggle">
                  <input
                    type="checkbox"
                    checked={emp.actif}
                    onChange={(e) => modifierEmploye(emp.id, { actif: e.target.checked })}
                  />
                  Actif
                </label>
                <button
                  className="employe-supprimer"
                  onClick={() => handleSupprimer(emp.id, emp.nom)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
