import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Parametres from './views/Parametres';
import Support from './views/Support';
import Comptabilite from './views/Comptabilite';
import type { VueActive } from './components/Sidebar';
import PriseCommande from './views/PriseCommande';
import MenuProduits from './views/MenuProduits';
import Caisse from './views/Caisse';
import ServiceFerme from './components/ServiceFerme';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import { useService } from './store/AppDataContext';
import './App.css';

function VuePlaceholder({ titre }: { titre: string }) {
  return (
    <div className="vue-placeholder">
      <h2>{titre}</h2>
      <p>Bientôt disponible</p>
    </div>
  );
}

export default function App() {
  const [vueActive, setVueActive] = useState<VueActive>('commande');
  const { serviceOuvertAujourdHui } = useService();

  const [chargement, setChargement] = useState(true);
  const [connecte, setConnecte] = useState(false);
  const [planActuel, setPlanActuel] = useState<'standard' | 'premium'>('standard');

  useEffect(() => {
    const timer = setTimeout(() => setChargement(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (identifiant: string, motDePasse: string) => {
    // TODO: remplacer par une vraie vérification
    if (identifiant && motDePasse) {
      setConnecte(true);
    }
  };

  const renderVue = () => {
    switch (vueActive) {
      case 'commande':
        if (!serviceOuvertAujourdHui) {
          return <ServiceFerme onAllerCaisse={() => setVueActive('caisse')} />;
        }
        return <PriseCommande />;
      case 'caisse':
        return <Caisse />;
      case 'historique':
        return <VuePlaceholder titre="Historique" />;
      case 'menu':
        return <MenuProduits />;
      case 'employes':
        return <VuePlaceholder titre="Employés" />;
      case 'rapports':
        return <VuePlaceholder titre="Rapports" />;
      case 'comptabilite':
        return <Comptabilite planActuel={planActuel} />;
      case 'parametres':
        return <Parametres planActuel={planActuel} onChangerPlan={setPlanActuel} />;
      case 'support':
        return <Support planActuel={planActuel} />;
      default:
        return null;
    }
  };

  if (chargement) return <SplashScreen />;
  if (!connecte) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="app-layout">
      <Sidebar vueActive={vueActive} onChangerVue={setVueActive} planActuel={planActuel} />
      <main className="app-contenu">{renderVue()}</main>
    </div>
  );
}
