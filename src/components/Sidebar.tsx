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
}

const ITEMS: { id: VueActive; label: string; premium?: boolean }[] = [
  { id: 'commande', label: 'Prise de commande' },
  { id: 'caisse', label: 'Caisse' },
  { id: 'historique', label: 'Historique' },
  { id: 'menu', label: 'Menu / produits' },
  { id: 'employes', label: 'Employés', premium: true },
  { id: 'rapports', label: 'Rapports', premium: true },
  { id: 'comptabilite', label: 'Comptabilité' },
  { id: 'parametres', label: 'Paramètres' },
  { id: 'support', label: 'Support' },
];

export default function Sidebar({ vueActive, onChangerVue, planActuel }: SidebarProps) {
  const itemsVisibles = ITEMS.filter((item) => !item.premium || planActuel === 'premium');

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
    </nav>
  );
}
