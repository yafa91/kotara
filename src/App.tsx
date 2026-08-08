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
import AbonnementDetail from './views/AbonnementDetail';
import type { Session } from './components/SelectionEmploye';
import { AppDataProvider, useService } from './store/AppDataContext';
import { supabase } from './lib/supabaseClient';
import SupportChatBot from './components/SupportChatBot';
import './App.css';

const VUES_EMPLOYE: VueActive[] = ['commande', 'caisse', 'historique', 'support'];

type TypeEtablissement = 'restaurant' | 'magasin';
type Devise = 'EUR' | 'XOF';
type PlanActuel = 'standard' | 'premium' | null;

function useEstTelephone() {
  const [estTelephone, setEstTelephone] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const verifier = () => setEstTelephone(window.innerWidth < 768);
    window.addEventListener('resize', verifier);
    return () => window.removeEventListener('resize', verifier);
  }, []);

  return estTelephone;
}

function EcranTelephoneBloque() {
  return (
    <div className="app-verification-restaurant">
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <h2>Kotara n'est pas disponible sur téléphone</h2>
        <p>
          Ce logiciel de caisse est conçu pour une utilisation sur tablette ou ordinateur.
          Merci d'ouvrir Kotara depuis un appareil avec un écran plus grand.
        </p>
      </div>
    </div>
  );
}

function AppAuthentifie({
  restaurantId,
  typeEtablissement,
  devise,
  planActuel,
  planExpireLe,
  paiementEnEchec,
  onChangerPlan,
  onDeconnexionCompte,
}: {
  restaurantId: string;
  typeEtablissement: TypeEtablissement;
  devise: Devise;
  planActuel: PlanActuel;
  planExpireLe: string | null;
  paiementEnEchec: boolean;
  onChangerPlan: (plan: 'standard' | 'premium') => void;
  onDeconnexionCompte: () => void;
}) {
  const [vueActive, setVueActive] = useState<VueActive>('commande');
  const { serviceOuvertAujourdHui } = useService();
  const [session] = useState<Session>({ nom: 'Gérant', role: 'gerant' });

  const handleDeconnexionSession = () => {
    onDeconnexionCompte();
    setVueActive('commande');
  };

  // Aucun plan actif : on bloque tout, sauf l'écran d'abonnement lui-même
  if (!planActuel) {
    return (
      <div className="app-layout">
        <main className="app-contenu">
          <AbonnementDetail
            planActuel="aucun"
            dateEcheance={planExpireLe || ''}
            expire={true}
            onRetour={() => {}}
            onChangerPlan={onChangerPlan}
          />
        </main>
      </div>
    );
  }

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
        return <MenuProduits typeEtablissement={typeEtablissement} />;
      case 'inventaire':
        return <Inventaire />;
      case 'employes':
        return <Employes />;
      case 'rapports':
        return <Rapports />;
      case 'comptabilite':
        return <Comptabilite planActuel={planActuel} />;
      case 'parametres':
        return <Parametres planActuel={planActuel} onChangerPlan={onChangerPlan} />;
      case 'support':
        return <Support planActuel={planActuel} />;
      default:
        return null;
    }
  };

  return (
    <>
      {paiementEnEchec && (
        <div
          style={{
            background: '#FFF3CD',
            color: '#664D03',
            padding: '10px 20px',
            textAlign: 'center',
            fontSize: '14px',
            width: '100%',
          }}
        >
          ⚠️ Ton dernier paiement a échoué. Vérifie ton moyen de paiement pour éviter une interruption de service.
        </div>
      )}
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
      <SupportChatBot />
    </>
  );
}

export default function App() {
  const estTelephone = useEstTelephone();
  const [chargement, setChargement] = useState(true);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [typeEtablissement, setTypeEtablissement] = useState<TypeEtablissement>('restaurant');
  const [devise, setDevise] = useState<Devise>('EUR');
  const [planActuel, setPlanActuelState] = useState<PlanActuel>(null);
  const [planExpireLe, setPlanExpireLe] = useState<string | null>(null);
  const [paiementEnEchec, setPaiementEnEchec] = useState(false);
  const [nomRestaurantManquant, setNomRestaurantManquant] = useState(false);
  const [nomRestaurantSaisi, setNomRestaurantSaisi] = useState('');
  const [erreurRestaurant, setErreurRestaurant] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthSession(data.session);
      setChargement(false);
    });

    const { data: ecouteur } = supabase.auth.onAuthStateChange((_event, nouvelleSession) => {
      setAuthSession((sessionActuelle) => {
        if (sessionActuelle?.user.id !== nouvelleSession?.user.id) {
          setRestaurantId(null);
          setNomRestaurantManquant(false);
        }
        return nouvelleSession;
      });
    });

    return () => ecouteur.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authSession) return;

    (async () => {
      const { data: restaurantsExistants, error } = await supabase
        .from('restaurants')
        .select('id, type_etablissement, devise, plan_actuel, plan_expire_le, paiement_en_echec')
        .eq('owner_id', authSession.user.id)
        .limit(1);

      if (error) {
        setErreurRestaurant(error.message);
        return;
      }

      if (restaurantsExistants && restaurantsExistants.length > 0) {
        const restaurant = restaurantsExistants[0];
        setRestaurantId(restaurant.id);
        setTypeEtablissement((restaurant.type_etablissement as TypeEtablissement) || 'restaurant');
        setDevise((restaurant.devise as Devise) || 'EUR');
        setPlanActuelState((restaurant.plan_actuel as PlanActuel) ?? null);
        setPlanExpireLe(restaurant.plan_expire_le || null);
        setPaiementEnEchec(Boolean(restaurant.paiement_en_echec));
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
        .select('id, type_etablissement, devise, plan_actuel, plan_expire_le, paiement_en_echec')
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
      setPlanActuelState((nouveauRestaurant.plan_actuel as PlanActuel) ?? null);
      setPlanExpireLe(nouveauRestaurant.plan_expire_le || null);
      setPaiementEnEchec(Boolean(nouveauRestaurant.paiement_en_echec));
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
      .select('id, type_etablissement, devise, plan_actuel, plan_expire_le, paiement_en_echec')
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
    setPlanActuelState((nouveauRestaurant.plan_actuel as PlanActuel) ?? null);
    setPlanExpireLe(nouveauRestaurant.plan_expire_le || null);
    setPaiementEnEchec(Boolean(nouveauRestaurant.paiement_en_echec));
  };

  const handleDeconnexionCompte = async () => {
    await supabase.auth.signOut();
    setRestaurantId(null);
  };

  // Rafraîchit le plan depuis la base (utile après un retour de paiement Stripe)
  const rafraichirPlan = async () => {
    if (!restaurantId) return;
    const { data } = await supabase
      .from('restaurants')
      .select('plan_actuel, plan_expire_le, paiement_en_echec')
      .eq('id', restaurantId)
      .single();

    if (data) {
      setPlanActuelState((data.plan_actuel as PlanActuel) ?? null);
      setPlanExpireLe(data.plan_expire_le || null);
      setPaiementEnEchec(Boolean(data.paiement_en_echec));
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      rafraichirPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  if (estTelephone) return <EcranTelephoneBloque />;
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
        planActuel={planActuel}
        planExpireLe={planExpireLe}
        paiementEnEchec={paiementEnEchec}
        onChangerPlan={() => rafraichirPlan()}
        onDeconnexionCompte={handleDeconnexionCompte}
      />
    </AppDataProvider>
  );
}