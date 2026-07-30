import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  ArticleMenu,
  Cloture,
  Commande,
  Employe,
  LigneTicket,
  ModePaiement,
  SortieCaisse,
} from '../types';
import { supabase } from '../lib/supabaseClient';

type Devise = 'EUR' | 'XOF';

interface EtatService {
  ouvert: boolean;
  date: string;
}

interface Parametres {
  nomResto: string;
  adresseResto: string;
  telephoneResto: string;
  codeAdmin: string;
  logoUrl?: string;
  identifiantCompte: string;
  motDePasseCompte: string;
}

const PARAMETRES_PAR_DEFAUT: Parametres = {
  nomResto: 'Chez Mama Kotara',
  adresseResto: "Avenue de l'Indépendance, Bangui",
  telephoneResto: '+236 70 00 00 00',
  codeAdmin: '1234',
  identifiantCompte: 'admin',
  motDePasseCompte: 'admin',
};

function dateDuJour() {
  return new Date().toISOString().slice(0, 10);
}

function lire<T>(cle: string, valeurParDefaut: T): T {
  try {
    const stocke = window.localStorage.getItem(cle);
    return stocke ? (JSON.parse(stocke) as T) : valeurParDefaut;
  } catch {
    return valeurParDefaut;
  }
}

// Convertit une ligne de la table Supabase "menu" en ArticleMenu utilisé par l'app
function ligneMenuVersArticle(ligne: any): ArticleMenu {
  return {
    id: ligne.id,
    nom: ligne.nom,
    prix: Number(ligne.prix),
    categorie: ligne.categorie,
    icone: '',
    photo: ligne.photo_url || undefined,
    actif: ligne.actif,
  };
}

interface AppDataValue {
  devise: Devise;

  menu: ArticleMenu[];
  menuCharge: boolean;
  ajouterArticleMenu: (
    nom: string,
    prix: number,
    categorie: ArticleMenu['categorie'],
    photo?: string
  ) => Promise<void>;
  modifierArticleMenu: (id: string, changements: Partial<ArticleMenu>) => Promise<void>;
  supprimerArticleMenu: (id: string) => Promise<void>;

  ticket: LigneTicket[];
  ajouterArticleTicket: (article: ArticleMenu) => void;
  retirerArticleTicket: (articleId: string) => void;
  viderTicket: () => void;

  commandes: Commande[];
  prochainNumero: number;
  encaisser: (lignes: LigneTicket[], total: number, mode: ModePaiement) => number;
  marquerPayee: (id: string, mode: 'espece' | 'mobile_money') => void;

  serviceOuvertAujourdHui: boolean;
  demarrerService: () => void;
  cloturerServiceAvecComptage: (params: {
    montantEspecesReel: number;
    totalEspecesTheorique: number;
    totalMobileMoney: number;
    totalGeneral: number;
  }) => void;

  clotures: Cloture[];

  parametres: Parametres;
  modifierParametres: (changements: Partial<Parametres>) => void;
  verifierCodeAdmin: (code: string) => boolean;

  sortiesCaisse: SortieCaisse[];
  ajouterSortieCaisse: (motif: string, montant: number) => void;

  employes: Employe[];
  ajouterEmploye: (nom: string, code: string, role: Employe['role']) => void;
  modifierEmploye: (id: string, changements: Partial<Employe>) => void;
  supprimerEmploye: (id: string) => void;
  trouverEmployeParCode: (code: string) => Employe | null;
}

const AppDataContext = createContext<AppDataValue | undefined>(undefined);

export function AppDataProvider({
  children,
  restaurantId,
  devise = 'EUR',
}: {
  children: ReactNode;
  restaurantId: string;
  devise?: Devise;
}) {
  // ---- MENU (Supabase) ----
  const [menu, setMenu] = useState<ArticleMenu[]>([]);
  const [menuCharge, setMenuCharge] = useState(false);

  useEffect(() => {
    let annule = false;

    (async () => {
      setMenuCharge(false);
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });

      if (annule) return;

      if (error) {
        console.error('Erreur chargement menu :', error.message);
        setMenu([]);
      } else {
        setMenu((data || []).map(ligneMenuVersArticle));
      }
      setMenuCharge(true);
    })();

    return () => {
      annule = true;
    };
  }, [restaurantId]);

  const ajouterArticleMenu: AppDataValue['ajouterArticleMenu'] = async (
    nom,
    prix,
    categorie,
    photo
  ) => {
    const { data, error } = await supabase
      .from('menu')
      .insert({
        restaurant_id: restaurantId,
        nom,
        prix,
        categorie,
        photo_url: photo || null,
        actif: true,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erreur ajout article menu :', error.message);
      return;
    }

    setMenu((prev) => [...prev, ligneMenuVersArticle(data)]);
  };

  const modifierArticleMenu: AppDataValue['modifierArticleMenu'] = async (id, changements) => {
    const payload: Record<string, unknown> = {};
    if (changements.nom !== undefined) payload.nom = changements.nom;
    if (changements.prix !== undefined) payload.prix = changements.prix;
    if (changements.categorie !== undefined) payload.categorie = changements.categorie;
    if (changements.photo !== undefined) payload.photo_url = changements.photo || null;
    if (changements.actif !== undefined) payload.actif = changements.actif;

    const { error } = await supabase.from('menu').update(payload).eq('id', id);

    if (error) {
      console.error('Erreur modification article menu :', error.message);
      return;
    }

    setMenu((prev) => prev.map((a) => (a.id === id ? { ...a, ...changements } : a)));
  };

  const supprimerArticleMenu: AppDataValue['supprimerArticleMenu'] = async (id) => {
    const { error } = await supabase.from('menu').delete().eq('id', id);

    if (error) {
      console.error('Erreur suppression article menu :', error.message);
      return;
    }

    setMenu((prev) => prev.filter((a) => a.id !== id));
  };

  // ---- TOUT LE RESTE : encore en localStorage (migration progressive) ----
  const [ticket, setTicket] = useState<LigneTicket[]>(() => lire('kotara_ticket', []));
  const [commandes, setCommandes] = useState<Commande[]>(() => lire('kotara_historique', []));
  const [prochainNumero, setProchainNumero] = useState<number>(() =>
    lire('kotara_prochain_numero', 1)
  );
  const [service, setService] = useState<EtatService>(() =>
    lire('kotara_service', { ouvert: false, date: '' })
  );
  const [clotures, setClotures] = useState<Cloture[]>(() => lire('kotara_clotures', []));
  const [employes, setEmployes] = useState<Employe[]>(() => lire('kotara_employes', []));
  const [sortiesCaisse, setSortiesCaisse] = useState<SortieCaisse[]>(() =>
    lire('kotara_sorties_caisse', [])
  );
  const [parametres, setParametres] = useState<Parametres>(() => {
    const stocke = lire<Partial<Parametres>>('kotara_parametres', {});
    return { ...PARAMETRES_PAR_DEFAUT, ...stocke };
  });

  useEffect(() => {
    window.localStorage.setItem('kotara_ticket', JSON.stringify(ticket));
  }, [ticket]);
  useEffect(() => {
    window.localStorage.setItem('kotara_historique', JSON.stringify(commandes));
  }, [commandes]);
  useEffect(() => {
    window.localStorage.setItem('kotara_prochain_numero', JSON.stringify(prochainNumero));
  }, [prochainNumero]);
  useEffect(() => {
    window.localStorage.setItem('kotara_service', JSON.stringify(service));
  }, [service]);
  useEffect(() => {
    window.localStorage.setItem('kotara_clotures', JSON.stringify(clotures));
  }, [clotures]);
  useEffect(() => {
    window.localStorage.setItem('kotara_employes', JSON.stringify(employes));
  }, [employes]);
  useEffect(() => {
    window.localStorage.setItem('kotara_parametres', JSON.stringify(parametres));
  }, [parametres]);
  useEffect(() => {
    window.localStorage.setItem('kotara_sorties_caisse', JSON.stringify(sortiesCaisse));
  }, [sortiesCaisse]);

  const ajouterArticleTicket: AppDataValue['ajouterArticleTicket'] = (article) => {
    setTicket((prev) => {
      const existant = prev.find((l) => l.articleId === article.id);
      if (existant) {
        return prev.map((l) =>
          l.articleId === article.id ? { ...l, quantite: l.quantite + 1 } : l
        );
      }
      return [
        ...prev,
        { articleId: article.id, nom: article.nom, prixUnitaire: article.prix, quantite: 1 },
      ];
    });
  };

  const retirerArticleTicket: AppDataValue['retirerArticleTicket'] = (articleId) => {
    setTicket((prev) =>
      prev
        .map((l) => (l.articleId === articleId ? { ...l, quantite: l.quantite - 1 } : l))
        .filter((l) => l.quantite > 0)
    );
  };

  const viderTicket = () => setTicket([]);

  const encaisser: AppDataValue['encaisser'] = (lignes, total, modePaiement) => {
    const numero = prochainNumero;
    const maintenant = new Date().toISOString();
    setCommandes((prev) => [
      {
        id: crypto.randomUUID(),
        numero,
        lignes,
        modePaiement,
        dateCreation: maintenant,
        dateEncaissement: modePaiement === 'en_attente' ? undefined : maintenant,
        total,
      },
      ...prev,
    ]);
    setProchainNumero(numero + 1);
    return numero;
  };

  const marquerPayee: AppDataValue['marquerPayee'] = (id, modePaiement) => {
    setCommandes((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, modePaiement, dateEncaissement: new Date().toISOString() } : c
      )
    );
  };

  const serviceOuvertAujourdHui = service.ouvert && service.date === dateDuJour();
  const demarrerService = () => setService({ ouvert: true, date: dateDuJour() });

  const cloturerServiceAvecComptage: AppDataValue['cloturerServiceAvecComptage'] = ({
    montantEspecesReel,
    totalEspecesTheorique,
    totalMobileMoney,
    totalGeneral,
  }) => {
    const nouvelleCloture: Cloture = {
      id: crypto.randomUUID(),
      date: dateDuJour(),
      totalEspecesTheorique,
      montantEspecesReel,
      ecart: montantEspecesReel - totalEspecesTheorique,
      totalMobileMoney,
      totalGeneral,
      dateCloture: new Date().toISOString(),
    };
    setClotures((prev) => [nouvelleCloture, ...prev]);
    setService((prev) => ({ ...prev, ouvert: false }));
  };

  const ajouterEmploye: AppDataValue['ajouterEmploye'] = (nom, code, role) => {
    setEmployes((prev) => [...prev, { id: crypto.randomUUID(), nom, code, role, actif: true }]);
  };

  const modifierEmploye: AppDataValue['modifierEmploye'] = (id, changements) => {
    setEmployes((prev) => prev.map((e) => (e.id === id ? { ...e, ...changements } : e)));
  };

  const supprimerEmploye: AppDataValue['supprimerEmploye'] = (id) => {
    setEmployes((prev) => prev.filter((e) => e.id !== id));
  };

  const trouverEmployeParCode = (code: string) =>
    employes.find((e) => e.code === code && e.actif) || null;

  const modifierParametres: AppDataValue['modifierParametres'] = (changements) => {
    setParametres((prev) => ({ ...prev, ...changements }));
  };

  const verifierCodeAdmin = (code: string) => code === parametres.codeAdmin;

  const ajouterSortieCaisse: AppDataValue['ajouterSortieCaisse'] = (motif, montant) => {
    const nouvelleSortie: SortieCaisse = {
      id: crypto.randomUUID(),
      motif,
      montant,
      date: dateDuJour(),
      dateCreation: new Date().toISOString(),
    };
    setSortiesCaisse((prev) => [nouvelleSortie, ...prev]);
  };

  const valeur: AppDataValue = {
    devise,
    menu,
    menuCharge,
    ajouterArticleMenu,
    modifierArticleMenu,
    supprimerArticleMenu,
    ticket,
    ajouterArticleTicket,
    retirerArticleTicket,
    viderTicket,
    commandes,
    prochainNumero,
    encaisser,
    marquerPayee,
    serviceOuvertAujourdHui,
    demarrerService,
    cloturerServiceAvecComptage,
    clotures,
    parametres,
    modifierParametres,
    verifierCodeAdmin,
    sortiesCaisse,
    ajouterSortieCaisse,
    employes,
    ajouterEmploye,
    modifierEmploye,
    supprimerEmploye,
    trouverEmployeParCode,
  };

  return <AppDataContext.Provider value={valeur}>{children}</AppDataContext.Provider>;
}

function useAppData() {
  const contexte = useContext(AppDataContext);
  if (!contexte) throw new Error('useAppData doit être utilisé dans <AppDataProvider>');
  return contexte;
}

export function useDevise() {
  const { devise } = useAppData();
  return devise;
}

export function useMenu() {
  const { menu, menuCharge, ajouterArticleMenu, modifierArticleMenu, supprimerArticleMenu } =
    useAppData();
  return {
    articles: menu,
    chargement: !menuCharge,
    ajouterArticle: ajouterArticleMenu,
    modifierArticle: modifierArticleMenu,
    supprimerArticle: supprimerArticleMenu,
  };
}

export function useTicket() {
  const { ticket, ajouterArticleTicket, retirerArticleTicket, viderTicket } = useAppData();
  const total = ticket.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);
  return {
    lignes: ticket,
    ajouterArticle: ajouterArticleTicket,
    retirerArticle: retirerArticleTicket,
    viderTicket,
    total,
  };
}

export function useHistorique() {
  const { commandes, prochainNumero, encaisser, marquerPayee } = useAppData();
  const commandesEnAttente = commandes.filter((c) => c.modePaiement === 'en_attente');
  return { commandes, prochainNumero, encaisser, marquerPayee, commandesEnAttente };
}

export function useService() {
  const { serviceOuvertAujourdHui, demarrerService, cloturerServiceAvecComptage, clotures } =
    useAppData();
  return { serviceOuvertAujourdHui, demarrerService, cloturerServiceAvecComptage, clotures };
}

export function useEmployes() {
  const { employes, ajouterEmploye, modifierEmploye, supprimerEmploye, trouverEmployeParCode } =
    useAppData();
  return { employes, ajouterEmploye, modifierEmploye, supprimerEmploye, trouverEmployeParCode };
}

export function useParametres() {
  const { parametres, modifierParametres, verifierCodeAdmin } = useAppData();
  return { parametres, modifierParametres, verifierCodeAdmin };
}

export function useSortiesCaisse() {
  const { sortiesCaisse, ajouterSortieCaisse } = useAppData();
  return { sortiesCaisse, ajouterSortieCaisse };
}