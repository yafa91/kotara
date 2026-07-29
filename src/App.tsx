import { useEffect, useState } from 'react';
import type { Session as AuthSession } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Parametres from './views/Parametres';
import Support from './views/Support';
import Comptabilite from './views/Comptabilite';
import type { VueActive } from './components/Sidebar';
import PriseCommande from './views/PriseCommande';
import MenuProduits from './views/MenuProduits';
import Caisse from './views/Caisse';
import Historique from './views/Historique';
import Rapports from './views/Rapports';
import Employes from './views/Employes';
import ServiceFerme from './components/ServiceFerme';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import SelectionEmploye, { type Session } from './components/SelectionEmploye';
import { AppDataProvider, useService } from './store/AppDataContext';
import { supabase } from './lib/supabaseClient';
import './App.css';

const VUES_EMPLOYE: VueActive[] = ['commande', 'caisse', 'historique', 'support'];

type TypeEtablissement = 'restaurant' | 'magasin';

function AppAuthentifie({
  restaurantId,
  typeEtablissement,
  onDeconnexionCompte,
}: {
  restaurantId: string;
  typeEtablissement: TypeEtablissement;
  onDeconnexionCompte: () => void;
}) {
  const [vueActive, setVueActive] = useState<VueActive>('commande');
  const { serviceOuvertAujourdHui } = useService();
  const [session, setSession] = useState<Session | null>(null);
  const [planActuel, setPlanActuel] = useState<'standard' | 'premium'>('standard');

  const handleDeconnexionSession = () => {
    setSession(null);
    setVueActive('commande');
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
        return <Historique />;
      case 'menu':
        return <MenuProduits />;
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

  if (!session)
    return (
      <SelectionEmploye onConnecte={setSession} onDeconnexionCompte={onDeconnexionCompte} />
    );

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
        .select('id, type_etablissement')
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
        return;
      }

      const nomDepuisMetadata = authSession.user.user_metadata?.nom_restaurant as
        | string
        | undefined;
      const typeDepuisMetadata = authSession.user.user_metadata?.type_etablissement as
        | TypeEtablissement
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
        })
        .select('id, type_etablissement')
        .single();

      if (erreurInsertion) {
        setErreurRestaurant(erreurInsertion.message);
        return;
      }

      setRestaurantId(nouveauRestaurant.id);
      setTypeEtablissement(
        (nouveauRestaurant.type_etablissement as TypeEtablissement) || 'restaurant'
      );
    })();
  }, [authSession]);

  const handleCreerRestaurantManquant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authSession || !nomRestaurantSaisi.trim()) return;

    const typeDepuisMetadata = authSession.user.user_metadata?.type_etablissement as
      | TypeEtablissement
      | undefined;

    const { data: nouveauRestaurant, error } = await supabase
      .from('restaurants')
      .insert({
        nom: nomRestaurantSaisi.trim(),
        owner_id: authSession.user.id,
        type_etablissement: typeDepuisMetadata || 'restaurant',
      })
      .select('id, type_etablissement')
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
    <AppDataProvider restaurantId={restaurantId}>
      <AppAuthentifie
        restaurantId={restaurantId}
        typeEtablissement={typeEtablissement}
        onDeconnexionCompte={handleDeconnexionCompte}
      />
    </AppDataProvider>
  );
}