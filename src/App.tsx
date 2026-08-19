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
import SelectionEmploye from './components/SelectionEmploye';
import { AppDataProvider, useService } from './store/AppDataContext';
import { supabase } from './lib/supabaseClient';
import SupportChatBot from './components/SupportChatBot';
import './App.css';

const VUES_EMPLOYE: VueActive[] = ['commande', 'caisse', 'historique', 'support'];
const DUREE_ESSAI_JOURS = 4;

type TypeEtablissement = 'restaurant' | 'magasin';
type Devise = 'EUR' | 'XOF';
type PlanActuel = 'essai' | 'standard' | 'premium' | null;

function dateEssaiExpiree(essaiExpireLe: string | null) {
  if (!essaiExpireLe) return false;
  return new Date(essaiExpireLe) < new Date();
}

function joursRestantsEssai(essaiExpireLe: string | null) {
  if (!essaiExpireLe) return 0;
  const diffMs = new Date(essaiExpireLe).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function detecterTelephone(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPhone : détecté directement.
  // Android : "Mobile" dans le user agent = téléphone ; son absence = tablette.
  // iPad (iPadOS 13+) s'identifie comme "Macintosh" et n'est donc jamais
  // détecté ici, comme les ordinateurs — c'est voulu.
  const estIphone = /iPhone|iPod/i.test(ua);
  const estAndroidTelephone = /Android/i.test(ua) && /Mobile/i.test(ua);
  return estIphone || estAndroidTelephone;
}

function useEstTelephone() {
  const [estTelephone, setEstTelephone] = useState(() => detecterTelephone());

  useEffect(() => {
    setEstTelephone(detecterTelephone());
  }, []);

  return estTelephone;
}

function EcranTelephoneBloque({ onOk }: { onOk: () => void }) {
  return (
    <div className="app-verification-restaurant">
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <h2>Kotara n'est pas disponible sur téléphone</h2>
        <p>
          Ce logiciel de caisse est conçu pour une utilisation sur tablette ou ordinateur.
          Merci d'ouvrir Kotara depuis un appareil avec un écran plus grand.
        </p>
        <button
          type="button"
          onClick={onOk}
          style={{
            marginTop: 16,
            background: '#F2801E',
            color: 'white',
            border: 'none',
            borderRadius: 9,
            padding: '11px 28px',
            fontSize: 14.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

function useEstPortrait() {
  const calculer = () =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;

  const [estPortrait, setEstPortrait] = useState(calculer);

  useEffect(() => {
    const verifier = () => setEstPortrait(calculer());
    window.addEventListener('resize', verifier);
    window.addEventListener('orientationchange', verifier);
    return () => {
      window.removeEventListener('resize', verifier);
      window.removeEventListener('orientationchange', verifier);
    };
  }, []);

  return estPortrait;
}

function EcranPortraitBloque() {
  return (
    <div className="app-verification-restaurant">
      <div style={{ textAlign: 'center', padding: '40px 24px' }}>
        <h2>Tourne ton appareil</h2>
        <p>
          Kotara s'utilise en mode paysage. Fais pivoter ta tablette pour continuer.
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
  essaiExpireLe,
  paiementEnEchec,
  estTelephone,
  estPortrait,
  onChangerPlan,
  onDeconnexionCompte,
}: {
  restaurantId: string;
  typeEtablissement: TypeEtablissement;
  devise: Devise;
  planActuel: PlanActuel;
  planExpireLe: string | null;
  essaiExpireLe: string | null;
  paiementEnEchec: boolean;
  estTelephone: boolean;
  estPortrait: boolean;
  onChangerPlan: (plan: 'standard' | 'premium') => void;
  onDeconnexionCompte: () => void;
}) {
  const [vueActive, setVueActive] = useState<VueActive>('commande');
  const { serviceOuvertAujourdHui } = useService();
  const [session, setSession] = useState<Session | null>(null);

  const handleDeconnexionSession = () => {
    setSession(null);
    setVueActive('commande');
  };

  const enEssai = planActuel === 'essai';
  const essaiExpire = enEssai && dateEssaiExpiree(essaiExpireLe);
  const accesBloque = !planActuel || essaiExpire;

  // Aucun plan actif, ou essai gratuit terminé : on bloque tout, sauf
  // l'écran d'abonnement lui-même
  if (accesBloque) {
    return (
      <div className="app-layout">
        <main className="app-contenu">
          <AbonnementDetail
            planActuel="aucun"
            dateEcheance={(essaiExpire ? essaiExpireLe : planExpireLe) || ''}
            expire={true}
            onRetour={onDeconnexionCompte}
            onChangerPlan={onChangerPlan}
          />
        </main>
      </div>
    );
  }

  // Aucun employé/gérant n'a encore choisi son profil pour cette session : on
  // affiche l'écran de sélection avant de laisser accéder au logiciel. C'est
  // ce qui permet de savoir QUI a fait chaque vente (traçabilité NF525).
  //
  // Le blocage téléphone/portrait n'intervient qu'ICI, une fois le plan
  // choisi et payé : l'inscription et le paiement restent accessibles sur
  // téléphone (plus simple pour le gérant), seule l'utilisation réelle de
  // la caisse exige une tablette en mode paysage.
  if (estTelephone) return <EcranTelephoneBloque onOk={onDeconnexionCompte} />;
  if (estPortrait) return <EcranPortraitBloque />;

  if (!session) {
    return (
      <SelectionEmploye
        onConnecte={setSession}
        onDeconnexionCompte={onDeconnexionCompte}
      />
    );
  }

  const renderVue = () => {
    switch (vueActive) {
      case 'commande':
        if (!serviceOuvertAujourdHui) {
          return <ServiceFerme onAllerCaisse={() => setVueActive('caisse')} />;
        }
        return typeEtablissement === 'magasin' ? (
          <ScannerProduit employeId={session.id} />
        ) : (
          <PriseCommande employeId={session.id} />
        );
      case 'caisse':
        return <Caisse employeId={session.id} />;
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
      {enEssai && !paiementEnEchec && (
        <div
          style={{
            background: '#FFF4E6',
            color: '#B35C00',
            padding: '10px 20px',
            textAlign: 'center',
            fontSize: '14px',
            width: '100%',
          }}
        >
           Tu es en mode essai gratuit encore {joursRestantsEssai(essaiExpireLe)} jour
          {joursRestantsEssai(essaiExpireLe) > 1 ? 's' : ''}. Choisis un plan à tout moment dans
          le menu Paramètres pour continuer sans interruption.
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
      {vueActive !== 'commande' && <SupportChatBot />}
    </>
  );
}

export default function App() {
  const estTelephone = useEstTelephone();
  const estPortrait = useEstPortrait();
  const [chargement, setChargement] = useState(true);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [typeEtablissement, setTypeEtablissement] = useState<TypeEtablissement>('restaurant');
  const [devise, setDevise] = useState<Devise>('EUR');
  const [planActuel, setPlanActuelState] = useState<PlanActuel>(null);
  const [planExpireLe, setPlanExpireLe] = useState<string | null>(null);
  const [essaiExpireLe, setEssaiExpireLe] = useState<string | null>(null);
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
        .select(
          'id, type_etablissement, devise, plan_actuel, plan_expire_le, essai_expire_le, paiement_en_echec'
        )
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
        setEssaiExpireLe(restaurant.essai_expire_le || null);
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

      const dateFinEssai = new Date();
      dateFinEssai.setDate(dateFinEssai.getDate() + DUREE_ESSAI_JOURS);

      const { data: nouveauRestaurant, error: erreurInsertion } = await supabase
        .from('restaurants')
        .insert({
          nom: nomDepuisMetadata,
          owner_id: authSession.user.id,
          type_etablissement: typeDepuisMetadata || 'restaurant',
          devise: deviseDepuisMetadata || 'EUR',
          plan_actuel: 'essai',
          essai_expire_le: dateFinEssai.toISOString().slice(0, 10),
        })
        .select(
          'id, type_etablissement, devise, plan_actuel, plan_expire_le, essai_expire_le, paiement_en_echec'
        )
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
      setEssaiExpireLe(nouveauRestaurant.essai_expire_le || null);
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

    const dateFinEssai = new Date();
    dateFinEssai.setDate(dateFinEssai.getDate() + DUREE_ESSAI_JOURS);

    const { data: nouveauRestaurant, error } = await supabase
      .from('restaurants')
      .insert({
        nom: nomRestaurantSaisi.trim(),
        owner_id: authSession.user.id,
        type_etablissement: typeDepuisMetadata || 'restaurant',
        devise: deviseDepuisMetadata || 'EUR',
        plan_actuel: 'essai',
        essai_expire_le: dateFinEssai.toISOString().slice(0, 10),
      })
      .select(
        'id, type_etablissement, devise, plan_actuel, plan_expire_le, essai_expire_le, paiement_en_echec'
      )
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
    setEssaiExpireLe(nouveauRestaurant.essai_expire_le || null);
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
      .select('plan_actuel, plan_expire_le, essai_expire_le, paiement_en_echec')
      .eq('id', restaurantId)
      .single();

    if (data) {
      setPlanActuelState((data.plan_actuel as PlanActuel) ?? null);
      setPlanExpireLe(data.plan_expire_le || null);
      setEssaiExpireLe(data.essai_expire_le || null);
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

  if (chargement) return <SplashScreen />;

  // Le blocage téléphone ne s'applique plus qu'à partir d'ici : la page de
  // connexion (avec "Découvrir" comme écran par défaut) reste accessible sur
  // téléphone. C'est LoginScreen lui-même qui affiche le message "continue
  // sur tablette" au moment où l'utilisateur arrive à l'étape connexion.
  if (!authSession)
    return (
      <LoginScreen
        onConnecte={() => {}}
      />
    );

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
        essaiExpireLe={essaiExpireLe}
        paiementEnEchec={paiementEnEchec}
        estTelephone={estTelephone}
        estPortrait={estPortrait}
        onChangerPlan={() => rafraichirPlan()}
        onDeconnexionCompte={handleDeconnexionCompte}
      />
    </AppDataProvider>
  );
}