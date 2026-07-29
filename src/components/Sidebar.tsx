import type { Session } from './SelectionEmploye';
import './Sidebar.css';

export type VueActive =
  | 'commande'
  | 'caisse'
  | 'historique'
  | 'menu'
  | 'employes'
  | 'rapports'
  | 'comptabilite'
  | 'parametres'
  | 'support';

interface SidebarProps {
  vueActive: VueActive;
  onChangerVue: (vue: VueActive) => void;
  planActuel: 'standard' | 'premium';
  session: Session;
  onDeconnexionSession: () => void;
  vuesAutorisees: VueActive[] | null; // null = tout est autorisé (gérant)
  typeEtablissement?: 'restaurant' | 'magasin';
}

export default function Sidebar({
  vueActive,
  onChangerVue,
  planActuel,
  session,
  onDeconnexionSession,
  vuesAutorisees,
  typeEtablissement = 'restaurant',
}: SidebarProps) {
  const estMagasin = typeEtablissement === 'magasin';

  const ITEMS: { id: VueActive; label: string; premium?: boolean }[] = [
    { id: 'commande', label: estMagasin ? 'Scanner un produit' : 'Prise de commande' },
    { id: 'caisse', label: 'Caisse' },
    { id: 'historique', label: 'Historique' },
    { id: 'menu', label: estMagasin ? 'Ajouter des produits' : 'Menu / produits' },
    { id: 'employes', label: 'Employés', premium: true },
    { id: 'rapports', label: 'Rapports', premium: true },
    { id: 'comptabilite', label: 'Comptabilité' },
    { id: 'parametres', label: 'Paramètres' },
    { id: 'support', label: 'Support' },
  ];

  const itemsVisibles = ITEMS.filter((item) => {
    if (item.premium && planActuel !== 'premium') return false;
    if (vuesAutorisees && !vuesAutorisees.includes(item.id)) return false;
    return true;
  });

  return (
    <nav className="sidebar">
      <p className="sidebar-titre">
        <span className="sidebar-titre-k">K</span>otara
      </p>

      {itemsVisibles.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${vueActive === item.id ? 'sidebar-item-actif' : ''}`}
          onClick={() => onChangerVue(item.id)}
        >
          {item.label}
        </button>
      ))}

      <div className="sidebar-session">
        <div className="sidebar-session-info">
          <span className="sidebar-session-nom">{session.nom}</span>
          <span className={`sidebar-session-role sidebar-session-role-${session.role}`}>
            {session.role === 'gerant' ? 'Gérant' : 'Employé'}
          </span>
        </div>
        <button className="sidebar-session-changer" onClick={onDeconnexionSession}>
          Changer
        </button>
      </div>
    </nav>
  );
}