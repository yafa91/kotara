import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MENU_PAR_DEFAUT } from '../data/defaultMenu';
import type { ArticleMenu, Cloture, Commande, LigneTicket, ModePaiement, SortieCaisse } from '../types';

interface EtatService {
  ouvert: boolean;
  date: string;
}

interface Parametres {
  nomResto: string;
  adresseResto: string;
  codeAdmin: string;
}

const PARAMETRES_PAR_DEFAUT: Parametres = {
  nomResto: 'Chez Mama Kotara',
  adresseResto: "Avenue de l'Indépendance, Bangui",
  codeAdmin: '1234',
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

interface AppDataValue {
  menu: ArticleMenu[];
  ajouterArticleMenu: (nom: string, prix: number, categorie: ArticleMenu['categorie'], photo?: string) => void;
  modifierArticleMenu: (id: string, changements: Partial<ArticleMenu>) => void;
  supprimerArticleMenu: (id: string) => void;
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
}

const AppDataContext = createContext<AppDataValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<ArticleMenu[]>(() => lire('kotara_menu', MENU_PAR_DEFAUT));
  const [ticket, setTicket] = useState<LigneTicket[]>(() => lire('kotara_ticket', []));
  const [commandes, setCommandes] = useState<Commande[]>(() => lire('kotara_historique', []));
  const [prochainNumero, setProchainNumero] = useState<number>(() =>
    lire('kotara_prochain_numero', 1)
  );
  const [service, setService] = useState<EtatService>(() =>
    lire('kotara_service', { ouvert: false, date: '' })
  );
  const [clotures, setClotures] = useState<Cloture[]>(() => lire('kotara_clotures', []));
  const [sortiesCaisse, setSortiesCaisse] = useState<SortieCaisse[]>(() =>
    lire('kotara_sorties_caisse', [])
  );

  // Fusionne les valeurs stockées avec les valeurs par défaut,
  // pour ne jamais perdre un champ ajouté après coup (comme codeAdmin).
  const [parametres, setParametres] = useState<Parametres>(() => {
    const stocke = lire<Partial<Parametres>>('kotara_parametres', {});
    return { ...PARAMETRES_PAR_DEFAUT, ...stocke };
  });

  useEffect(() => {
    window.localStorage.setItem('kotara_menu', JSON.stringify(menu));
  }, [menu]);
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
    window.localStorage.setItem('kotara_parametres', JSON.stringify(parametres));
  }, [parametres]);
  useEffect(() => {
    window.localStorage.setItem('kotara_sorties_caisse', JSON.stringify(sortiesCaisse));
  }, [sortiesCaisse]);

  const ajouterArticleMenu: AppDataValue['ajouterArticleMenu'] = (nom, prix, categorie, photo) => {
    setMenu((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nom, prix, categorie, icone: '', photo, actif: true },
    ]);
  };

  const modifierArticleMenu: AppDataValue['modifierArticleMenu'] = (id, changements) => {
    setMenu((prev) => prev.map((a) => (a.id === id ? { ...a, ...changements } : a)));
  };

  const supprimerArticleMenu: AppDataValue['supprimerArticleMenu'] = (id) => {
    setMenu((prev) => prev.filter((a) => a.id !== id));
  };

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
        c.id === id
          ? { ...c, modePaiement, dateEncaissement: new Date().toISOString() }
          : c
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
    menu,
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
  };

  return <AppDataContext.Provider value={valeur}>{children}</AppDataContext.Provider>;
}

function useAppData() {
  const contexte = useContext(AppDataContext);
  if (!contexte) throw new Error('useAppData doit être utilisé dans <AppDataProvider>');
  return contexte;
}

export function useMenu() {
  const { menu, ajouterArticleMenu, modifierArticleMenu, supprimerArticleMenu } = useAppData();
  return {
    articles: menu,
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

export function useParametres() {
  const { parametres, modifierParametres, verifierCodeAdmin } = useAppData();
  return { parametres, modifierParametres, verifierCodeAdmin };
}

export function useSortiesCaisse() {
  const { sortiesCaisse, ajouterSortieCaisse } = useAppData();
  return { sortiesCaisse, ajouterSortieCaisse };
}
