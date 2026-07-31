import { useEffect, useState } from 'react';
import type { Session as AuthSession } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Parametres from './views/Parametres';
import Support from './views/Support';
import Comptabilite from './views/Comptabilite';
import type { VueActive } from './components/Sidebar';
import PriseCommande from './views/PriseCommande';
import ScannerProduit from './views/ScannerProduit';
import MenuProduits from './views/MenuProduits';
import Inventaire from './views/Inventaire';
import Caisse from './views/Caisse';
import Historique from './views/Historique';
import Rapports from './views/Rapports';
import Employes from './views/Employes';
import ServiceFerme from './components/ServiceFerme';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import type { Session } from './components/SelectionEmploye';
import { AppDataProvider, useService } from './store/AppDataContext';
import { supabase } from './lib/supabaseClient';
import './App.css';

const VUES_EMPLOYE: VueActive[] = ['commande', 'caisse', 'historique', 'support'];

type TypeEtablissement = 'restaurant' | 'magasin';
type Devise = 'EUR' | 'XOF';

function AppAuthentifie({
  restaurantId,
  typeEtablissement,
  devise,
  onDeconnexionCompte,
}: {
  restaurantId: string;
  typeEtablissement: TypeEtablissement;
  devise: Devise;
  onDeconnexionCompte: () => void;
}) {
  const [vueActive, setVueActive] = useState<VueActive>('commande');
  const { serviceOuvertAujourdHui } = useService();
  const [session] = useState<Session>({ nom: 'Gérant', role: 'gerant' });
  const [planActuel, setPlanActuel] = useState<'standard' | 'premium'>('standard');

  const handleDeconnexionSession = () => {
    onDeconnexionCompte();
    setVueActive('commande');
  };

  const renderVue = () => {
    switch (vueActive) {
      case 'commande':
        if (!serviceOuvertAujourdHui) {
          return <ServiceFerme onAllerCaisse={() => setVueActive('caisse')} />;
        }
        return typeEtablissement === 'magasin' ? <ScannerProduit /> : <PriseCommande />;
      case 'caisse':
        return <Caisse />;
      case 'historique':
        return <Historique />;
      case 'menu':
        return <MenuProduits />;
      case 'inventaire':
        return <Inventaire />;
      case 'employes':
        return <Employes />;
      case 'rapports':
        return <Rapports />;
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

  return (
    <div className="app-layout">
      <Sidebar
        vueActive={vueActive}
        onChangerVue={setVueActive}
        planActuel={planActuel}
        session={session}
        onDeconnexionSession={handleDeconnexionSession}
        vuesAutorisees={session.role === 'gerant' ? null : VUES_EMPLOYE}
        typeEtablissement={typeEtablissement}
      />
      <main className="app-contenu">{renderVue()}</main>
    </div>
  );
}

export default function App() {
  const [chargement, setChargement] = useState(true);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [typeEtablissement, setTypeEtablissement] = useState<TypeEtablissement>('restaurant');
  const [devise, setDevise] = useState<Devise>('EUR');
  const [nomRestaurantManquant, setNomRestaurantManquant] = useState(false);
  const [nomRestaurantSaisi, setNomRestaurantSaisi] = useState('');
  const [erreurRestaurant, setErreurRestaurant] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthSession(data.session);
      setChargement(false);
    });

    const { data: ecouteur } = supabase.auth.onAuthStateChange((_event, nouvelleSession) => {
      setAuthSession(nouvelleSession);
      setRestaurantId(null);
      setNomRestaurantManquant(false);
    });

    return () => ecouteur.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authSession) return;

    (async () => {
      const { data: restaurantsExistants, error } = await supabase
        .from('restaurants')
        .select('id, type_etablissement, devise')
        .eq('owner_id', authSession.user.id)
        .limit(1);

      if (error) {
        setErreurRestaurant(error.message);
        return;
      }

      if (restaurantsExistants && restaurantsExistants.length > 0) {
        setRestaurantId(restaurantsExistants[0].id);
        setTypeEtablissement(
          (restaurantsExistants[0].type_etablissement as TypeEtablissement) || 'restaurant'
        );
        setDevise((restaurantsExistants[0].devise as Devise) || 'EUR');
        return;
      }

      const nomDepuisMetadata = authSession.user.user_metadata?.nom_restaurant as
        | string
        | undefined;
      const typeDepuisMetadata = authSession.user.user_metadata?.type_etablissement as
        | TypeEtablissement
        | undefined;
      const deviseDepuisMetadata = authSession.user.user_metadata?.devise as
        | Devise
        | undefined;

      if (!nomDepuisMetadata) {
        setNomRestaurantManquant(true);
        return;
      }

      const { data: nouveauRestaurant, error: erreurInsertion } = await supabase
        .from('restaurants')
        .insert({
          nom: nomDepuisMetadata,
          owner_id: authSession.user.id,
          type_etablissement: typeDepuisMetadata || 'restaurant',
          devise: deviseDepuisMetadata || 'EUR',
        })
        .select('id, type_etablissement, devise')
        .single();

      if (erreurInsertion) {
        setErreurRestaurant(erreurInsertion.message);
        return;
      }

      setRestaurantId(nouveauRestaurant.id);
      setTypeEtablissement(
        (nouveauRestaurant.type_etablissement as TypeEtablissement) || 'restaurant'
      );
      setDevise((nouveauRestaurant.devise as Devise) || 'EUR');
    })();
  }, [authSession]);

  const handleCreerRestaurantManquant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authSession || !nomRestaurantSaisi.trim()) return;

    const typeDepuisMetadata = authSession.user.user_metadata?.type_etablissement as
      | TypeEtablissement
      | undefined;
    const deviseDepuisMetadata = authSession.user.user_metadata?.devise as
      | Devise
      | undefined;

    const { data: nouveauRestaurant, error } = await supabase
      .from('restaurants')
      .insert({
        nom: nomRestaurantSaisi.trim(),
        owner_id: authSession.user.id,
        type_etablissement: typeDepuisMetadata || 'restaurant',
        devise: deviseDepuisMetadata || 'EUR',
      })
      .select('id, type_etablissement, devise')
      .single();

    if (error) {
      setErreurRestaurant(error.message);
      return;
    }

    setNomRestaurantManquant(false);
    setRestaurantId(nouveauRestaurant.id);
    setTypeEtablissement(
      (nouveauRestaurant.type_etablissement as TypeEtablissement) || 'restaurant'
    );
    setDevise((nouveauRestaurant.devise as Devise) || 'EUR');
  };

  const handleDeconnexionCompte = async () => {
    await supabase.auth.signOut();
    setRestaurantId(null);
  };

  if (chargement) return <SplashScreen />;
  if (!authSession) return <LoginScreen onConnecte={() => {}} />;

  if (nomRestaurantManquant) {
    return (
      <div className="app-verification-restaurant">
        <form onSubmit={handleCreerRestaurantManquant}>
          <h2>Un dernier détail</h2>
          <p>Quel est le nom de ton restaurant ?</p>
          <input
            type="text"
            placeholder="Nom du restaurant"
            value={nomRestaurantSaisi}
            onChange={(e) => setNomRestaurantSaisi(e.target.value)}
          />
          {erreurRestaurant && <p className="app-verification-erreur">{erreurRestaurant}</p>}
          <button type="submit">Continuer</button>
        </form>
      </div>
    );
  }

  if (!restaurantId) {
    if (erreurRestaurant) {
      return (
        <div className="app-verification-restaurant">
          <p className="app-verification-erreur">Erreur : {erreurRestaurant}</p>
        </div>
      );
    }
    return <SplashScreen />;
  }

  return (
    <AppDataProvider
      restaurantId={restaurantId}
      devise={devise}
      typeEtablissement={typeEtablissement}
    >
      <AppAuthentifie
        restaurantId={restaurantId}
        typeEtablissement={typeEtablissement}
        devise={devise}
        onDeconnexionCompte={handleDeconnexionCompte}
      />
    </AppDataProvider>
  );
}