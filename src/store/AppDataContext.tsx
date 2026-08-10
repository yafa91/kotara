import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  ArticleMenu,
  Categorie,
  Cloture,
  Commande,
  Employe,
  LigneTicket,
  ModePaiement,
  SortieCaisse,
} from '../types';
import { supabase } from '../lib/supabaseClient';

type Devise = 'EUR' | 'XOF';
type TypeEtablissement = 'restaurant' | 'magasin';

interface Parametres {
  nomResto: string;
  adresseResto: string;
  telephoneResto: string;
  codeAdmin: string;
  logoUrl?: string;
  identifiantCompte: string;
  motDePasseCompte: string;
  categories: Categorie[];
}

const CATEGORIES_PAR_DEFAUT_RESTAURANT: Categorie[] = [
  'Plats',
  'Boissons',
  'Desserts',
  'Frites',
  'Sandwichs',
  'Salades',
  'Sauces',
  'Menus',
  'Pates',
  'Autres',
];

const CATEGORIES_PAR_DEFAUT_MAGASIN: Categorie[] = [];

function dateDuJour() {
  return new Date().toISOString().slice(0, 10);
}

// ---- Conversions ligne Supabase -> type app ----

function ligneMenuVersArticle(ligne: any): ArticleMenu {
  return {
    id: ligne.id,
    nom: ligne.nom,
    prix: Number(ligne.prix),
    categorie: ligne.categorie,
    icone: '',
    photo: ligne.photo_url || undefined,
    actif: ligne.actif,
    codeBarre: ligne.code_barre || undefined,
    stock: ligne.stock ?? 0,
    seuilAlerte: ligne.seuil_alerte ?? 5,
  };
}

function ligneCommandeVersCommande(ligne: any): Commande {
  return {
    id: ligne.id,
    numero: ligne.numero,
    lignes: ligne.lignes as LigneTicket[],
    modePaiement: ligne.mode_paiement,
    dateCreation: ligne.date_creation,
    dateEncaissement: ligne.date_encaissement || undefined,
    total: Number(ligne.total),
  };
}

function ligneClotureVersCloture(ligne: any): Cloture {
  return {
    id: ligne.id,
    date: ligne.date,
    totalEspecesTheorique: Number(ligne.total_especes_theorique),
    montantEspecesReel: Number(ligne.montant_especes_reel),
    ecart: Number(ligne.ecart),
    totalMobileMoney: Number(ligne.total_mobile_money),
    totalGeneral: Number(ligne.total_general),
    dateCloture: ligne.date_cloture,
  };
}

function ligneEmployeVersEmploye(ligne: any): Employe {
  return {
    id: ligne.id,
    nom: ligne.nom,
    code: ligne.code,
    role: ligne.role,
    actif: ligne.actif,
  };
}

function ligneSortieVersSortie(ligne: any): SortieCaisse {
  return {
    id: ligne.id,
    motif: ligne.motif,
    montant: Number(ligne.montant),
    date: ligne.date,
    dateCreation: ligne.date_creation,
  };
}

interface AppDataValue {
  devise: Devise;

  menu: ArticleMenu[];
  menuCharge: boolean;
  ajouterArticleMenu: (
    nom: string,
    prix: number,
    categorie: Categorie,
    photo?: string,
    codeBarre?: string
  ) => Promise<void>;
  modifierArticleMenu: (id: string, changements: Partial<ArticleMenu>) => Promise<void>;
  supprimerArticleMenu: (id: string) => Promise<void>;

  ticket: LigneTicket[];
  ajouterArticleTicket: (article: ArticleMenu) => void;
  retirerArticleTicket: (articleId: string) => void;
  viderTicket: () => void;

  commandes: Commande[];
  prochainNumero: number;
  encaisser: (
    lignes: LigneTicket[],
    total: number,
    mode: ModePaiement,
    employeId?: string | null
  ) => Promise<number>;
  marquerPayee: (
    id: string,
    mode: 'espece' | 'mobile_money',
    employeId?: string | null
  ) => Promise<void>;

  serviceOuvertAujourdHui: boolean;
  demarrerService: () => Promise<void>;
  cloturerServiceAvecComptage: (params: {
    montantEspecesReel: number;
    totalEspecesTheorique: number;
    totalMobileMoney: number;
    totalGeneral: number;
    employeId?: string | null;
  }) => Promise<void>;

  clotures: Cloture[];

  parametres: Parametres;
  modifierParametres: (changements: Partial<Parametres>) => Promise<void>;
  verifierCodeAdmin: (code: string) => boolean;

  categories: Categorie[];
  ajouterCategorie: (nom: string) => Promise<void>;
  supprimerCategorie: (nom: string) => Promise<void>;

  sortiesCaisse: SortieCaisse[];
  ajouterSortieCaisse: (motif: string, montant: number) => Promise<void>;

  employes: Employe[];
  ajouterEmploye: (nom: string, code: string, role: Employe['role']) => Promise<void>;
  modifierEmploye: (id: string, changements: Partial<Employe>) => Promise<void>;
  supprimerEmploye: (id: string) => Promise<void>;
  trouverEmployeParCode: (code: string) => Employe | null;

  recupererTransactionsBrutesDuMois: (cleMois: string) => Promise<any[]>;
}

const AppDataContext = createContext<AppDataValue | undefined>(undefined);

export function AppDataProvider({
  children,
  restaurantId,
  devise = 'EUR',
  typeEtablissement = 'restaurant',
}: {
  children: ReactNode;
  restaurantId: string;
  devise?: Devise;
  typeEtablissement?: TypeEtablissement;
}) {
  // ---- MENU ----
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
    photo,
    codeBarre
  ) => {
    const { data, error } = await supabase
      .from('menu')
      .insert({
        restaurant_id: restaurantId,
        nom,
        prix,
        categorie,
        photo_url: photo || null,
        code_barre: codeBarre || null,
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
    if (changements.codeBarre !== undefined) payload.code_barre = changements.codeBarre || null;
    if (changements.stock !== undefined) payload.stock = changements.stock;
    if (changements.seuilAlerte !== undefined) payload.seuil_alerte = changements.seuilAlerte;

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

  // ---- TICKET EN COURS : reste en local (panier transitoire de cette session) ----
  const [ticket, setTicket] = useState<LigneTicket[]>(() => {
    try {
      const stocke = window.localStorage.getItem('kotara_ticket');
      return stocke ? (JSON.parse(stocke) as LigneTicket[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem('kotara_ticket', JSON.stringify(ticket));
  }, [ticket]);

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

  // ---- PARAMÈTRES + CATÉGORIES (colonnes sur "restaurants") ----
  const [parametres, setParametres] = useState<Parametres>({
    nomResto: '',
    adresseResto: '',
    telephoneResto: '',
    codeAdmin: '1234',
    identifiantCompte: 'admin',
    motDePasseCompte: 'admin',
    categories:
      typeEtablissement === 'magasin'
        ? CATEGORIES_PAR_DEFAUT_MAGASIN
        : CATEGORIES_PAR_DEFAUT_RESTAURANT,
  });
  const [prochainNumero, setProchainNumero] = useState<number>(1);
  const [serviceOuvertAujourdHui, setServiceOuvertAujourdHui] = useState(false);

  // ---- COMMANDES / CLOTURES / EMPLOYES / SORTIES (tables Supabase) ----
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [clotures, setClotures] = useState<Cloture[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [sortiesCaisse, setSortiesCaisse] = useState<SortieCaisse[]>([]);

  useEffect(() => {
    let annule = false;

    (async () => {
      const [
        { data: restau, error: erreurRestau },
        { data: cmds, error: erreurCmds },
        { data: clos, error: erreurClos },
        { data: emps, error: erreurEmps },
        { data: sorts, error: erreurSorts },
      ] = await Promise.all([
        supabase
          .from('restaurants')
          .select(
            'nom, adresse, telephone, code_admin, identifiant_compte, mot_de_passe_compte, categories, prochain_numero, service_ouvert, service_date'
          )
          .eq('id', restaurantId)
          .single(),
        supabase
          .from('commandes')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('date_creation', { ascending: false }),
        supabase
          .from('clotures')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('date_cloture', { ascending: false }),
        supabase.from('employes').select('*').eq('restaurant_id', restaurantId),
        supabase
          .from('sorties_caisse')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('date_creation', { ascending: false }),
      ]);

      if (annule) return;

      if (erreurRestau) {
        console.error('Erreur chargement paramètres :', erreurRestau.message);
      } else if (restau) {
        const categoriesParDefaut =
          typeEtablissement === 'magasin'
            ? CATEGORIES_PAR_DEFAUT_MAGASIN
            : CATEGORIES_PAR_DEFAUT_RESTAURANT;

        setParametres({
          nomResto: restau.nom || '',
          adresseResto: restau.adresse || '',
          telephoneResto: restau.telephone || '',
          codeAdmin: restau.code_admin || '1234',
          identifiantCompte: restau.identifiant_compte || 'admin',
          motDePasseCompte: restau.mot_de_passe_compte || 'admin',
          categories:
            restau.categories && restau.categories.length > 0
              ? restau.categories
              : categoriesParDefaut,
        });
        setProchainNumero(restau.prochain_numero || 1);
        setServiceOuvertAujourdHui(
          Boolean(restau.service_ouvert) && restau.service_date === dateDuJour()
        );
      }

      if (erreurCmds) {
        console.error('Erreur chargement commandes :', erreurCmds.message);
      } else {
        // Inaltérabilité : chaque changement d'état d'un ticket (ex: passage
        // "en attente" -> "payé") crée un NOUVEL enregistrement en base plutôt
        // que de modifier l'original (voir marquerPayee). L'original reste
        // donc intact pour toujours (traçabilité complète), mais on ne veut
        // afficher dans l'app que la version la plus récente de chaque ticket.
        // On masque donc ici les enregistrements qui ont été "remplacés" par
        // un enregistrement plus récent (identifiés via commande_parent_id).
        const brut = cmds || [];
        const idsRemplaces = new Set(
          brut.map((c: any) => c.commande_parent_id).filter(Boolean)
        );
        const effectives = brut.filter((c: any) => !idsRemplaces.has(c.id));
        setCommandes(effectives.map(ligneCommandeVersCommande));
      }

      if (erreurClos) {
        console.error('Erreur chargement clôtures :', erreurClos.message);
      } else {
        setClotures((clos || []).map(ligneClotureVersCloture));
      }

      if (erreurEmps) {
        console.error('Erreur chargement employés :', erreurEmps.message);
      } else {
        setEmployes((emps || []).map(ligneEmployeVersEmploye));
      }

      if (erreurSorts) {
        console.error('Erreur chargement sorties de caisse :', erreurSorts.message);
      } else {
        setSortiesCaisse((sorts || []).map(ligneSortieVersSortie));
      }
    })();

    return () => {
      annule = true;
    };
  }, [restaurantId, typeEtablissement]);

  const modifierParametres: AppDataValue['modifierParametres'] = async (changements) => {
    const payload: Record<string, unknown> = {};
    if (changements.nomResto !== undefined) payload.nom = changements.nomResto;
    if (changements.adresseResto !== undefined) payload.adresse = changements.adresseResto;
    if (changements.telephoneResto !== undefined) payload.telephone = changements.telephoneResto;
    if (changements.codeAdmin !== undefined) payload.code_admin = changements.codeAdmin;
    if (changements.identifiantCompte !== undefined)
      payload.identifiant_compte = changements.identifiantCompte;
    if (changements.motDePasseCompte !== undefined)
      payload.mot_de_passe_compte = changements.motDePasseCompte;
    if (changements.categories !== undefined) payload.categories = changements.categories;

    const { error } = await supabase.from('restaurants').update(payload).eq('id', restaurantId);

    if (error) {
      console.error('Erreur mise à jour paramètres :', error.message);
      return;
    }

    setParametres((prev) => ({ ...prev, ...changements }));
  };

  const verifierCodeAdmin = (code: string) => code === parametres.codeAdmin;

  const ajouterCategorie: AppDataValue['ajouterCategorie'] = async (nom) => {
    const nomPropre = nom.trim();
    if (!nomPropre) return;
    if (parametres.categories.some((c) => c.toLowerCase() === nomPropre.toLowerCase())) return;
    await modifierParametres({ categories: [...parametres.categories, nomPropre] });
  };

  const supprimerCategorie: AppDataValue['supprimerCategorie'] = async (nom) => {
    await modifierParametres({
      categories: parametres.categories.filter((c) => c !== nom),
    });
  };

  // ---- COMMANDES ----
  const decrementerStockPourVente = async (lignes: LigneTicket[]) => {
    for (const ligne of lignes) {
      const article = menu.find((a) => a.id === ligne.articleId);
      if (!article) continue;
      const nouveauStock = Math.max(0, article.stock - ligne.quantite);
      const { error } = await supabase
        .from('menu')
        .update({ stock: nouveauStock })
        .eq('id', ligne.articleId);
      if (error) {
        console.error('Erreur mise à jour du stock :', error.message);
      }
    }
    setMenu((prev) =>
      prev.map((a) => {
        const ligne = lignes.find((l) => l.articleId === a.id);
        if (!ligne) return a;
        return { ...a, stock: Math.max(0, a.stock - ligne.quantite) };
      })
    );
  };

  const encaisser: AppDataValue['encaisser'] = async (lignes, total, modePaiement, employeId) => {
    const numero = prochainNumero;
    const maintenant = new Date().toISOString();

    const { error: erreurInsertion } = await supabase.from('commandes').insert({
      restaurant_id: restaurantId,
      numero,
      lignes,
      mode_paiement: modePaiement,
      date_creation: maintenant,
      date_encaissement: modePaiement === 'en_attente' ? null : maintenant,
      total,
      employe_id: employeId || null,
    });

    if (erreurInsertion) {
      console.error('Erreur enregistrement commande :', erreurInsertion.message);
      return numero;
    }

    const { error: erreurCompteur } = await supabase
      .from('restaurants')
      .update({ prochain_numero: numero + 1 })
      .eq('id', restaurantId);

    if (erreurCompteur) {
      console.error('Erreur mise à jour du compteur de ticket :', erreurCompteur.message);
    }

    await decrementerStockPourVente(lignes);

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

  // Inaltérabilité : on ne modifie JAMAIS un enregistrement de commande déjà
  // créé. Pour faire passer un ticket "en attente" à "payé", on INSÈRE un
  // nouvel enregistrement (lié à l'original via commande_parent_id) plutôt
  // que d'écraser la ligne existante avec un UPDATE. L'original reste donc
  // consultable pour toujours dans la base, intact, pour l'export/l'audit.
  const marquerPayee: AppDataValue['marquerPayee'] = async (id, modePaiement, employeId) => {
    const commandeOriginale = commandes.find((c) => c.id === id);
    if (!commandeOriginale) return;

    const maintenant = new Date().toISOString();

    const { data, error } = await supabase
      .from('commandes')
      .insert({
        restaurant_id: restaurantId,
        numero: commandeOriginale.numero,
        lignes: commandeOriginale.lignes,
        mode_paiement: modePaiement,
        date_creation: commandeOriginale.dateCreation,
        date_encaissement: maintenant,
        total: commandeOriginale.total,
        commande_parent_id: id,
        employe_id: employeId || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Erreur enregistrement paiement :', error.message);
      return;
    }

    // On remplace uniquement l'AFFICHAGE dans l'état local (l'enregistrement
    // "en_attente" d'origine, lui, reste intact et inchangé en base).
    setCommandes((prev) =>
      prev.map((c) => (c.id === id ? ligneCommandeVersCommande(data) : c))
    );
  };

  // ---- SERVICE (ouverture/fermeture de journée) ----
  const demarrerService: AppDataValue['demarrerService'] = async () => {
    const aujourdhui = dateDuJour();
    const { error } = await supabase
      .from('restaurants')
      .update({ service_ouvert: true, service_date: aujourdhui })
      .eq('id', restaurantId);

    if (error) {
      console.error('Erreur démarrage service :', error.message);
      return;
    }
    setServiceOuvertAujourdHui(true);
  };

  const cloturerServiceAvecComptage: AppDataValue['cloturerServiceAvecComptage'] = async ({
    montantEspecesReel,
    totalEspecesTheorique,
    totalMobileMoney,
    totalGeneral,
    employeId,
  }) => {
    const nouvelleCloture = {
      restaurant_id: restaurantId,
      date: dateDuJour(),
      total_especes_theorique: totalEspecesTheorique,
      montant_especes_reel: montantEspecesReel,
      ecart: montantEspecesReel - totalEspecesTheorique,
      total_mobile_money: totalMobileMoney,
      total_general: totalGeneral,
      date_cloture: new Date().toISOString(),
      employe_id: employeId || null,
    };

    const { data, error } = await supabase
      .from('clotures')
      .insert(nouvelleCloture)
      .select('*')
      .single();

    if (error) {
      console.error('Erreur clôture service :', error.message);
      return;
    }

    const { error: erreurService } = await supabase
      .from('restaurants')
      .update({ service_ouvert: false })
      .eq('id', restaurantId);

    if (erreurService) {
      console.error('Erreur mise à jour statut service :', erreurService.message);
    }

    setClotures((prev) => [ligneClotureVersCloture(data), ...prev]);
    setServiceOuvertAujourdHui(false);
  };

  // ---- EMPLOYÉS ----
  const ajouterEmploye: AppDataValue['ajouterEmploye'] = async (nom, code, role) => {
    const { data, error } = await supabase
      .from('employes')
      .insert({ restaurant_id: restaurantId, nom, code, role, actif: true })
      .select('*')
      .single();

    if (error) {
      console.error('Erreur ajout employé :', error.message);
      return;
    }

    setEmployes((prev) => [...prev, ligneEmployeVersEmploye(data)]);
  };

  const modifierEmploye: AppDataValue['modifierEmploye'] = async (id, changements) => {
    const { error } = await supabase.from('employes').update(changements).eq('id', id);

    if (error) {
      console.error('Erreur modification employé :', error.message);
      return;
    }

    setEmployes((prev) => prev.map((e) => (e.id === id ? { ...e, ...changements } : e)));
  };

  const supprimerEmploye: AppDataValue['supprimerEmploye'] = async (id) => {
    const { error } = await supabase.from('employes').delete().eq('id', id);

    if (error) {
      console.error('Erreur suppression employé :', error.message);
      return;
    }

    setEmployes((prev) => prev.filter((e) => e.id !== id));
  };

  const trouverEmployeParCode = (code: string) =>
    employes.find((e) => e.code === code && e.actif) || null;

  // ---- SORTIES DE CAISSE ----
  const ajouterSortieCaisse: AppDataValue['ajouterSortieCaisse'] = async (motif, montant) => {
    const nouvelleSortie = {
      restaurant_id: restaurantId,
      motif,
      montant,
      date: dateDuJour(),
      date_creation: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sorties_caisse')
      .insert(nouvelleSortie)
      .select('*')
      .single();

    if (error) {
      console.error('Erreur ajout sortie de caisse :', error.message);
      return;
    }

    setSortiesCaisse((prev) => [ligneSortieVersSortie(data), ...prev]);
  };

  // ---- EXPORT COMPTABLE (archivage) ----
  // Va chercher TOUTES les lignes brutes en base pour un mois donné, y
  // compris les enregistrements "remplacés" (ex: anciens statuts "en_attente"
  // conservés grâce à l'inaltérabilité) — nécessaire pour un export complet
  // exploitable en cas de contrôle fiscal.
  const recupererTransactionsBrutesDuMois: AppDataValue['recupererTransactionsBrutesDuMois'] =
    async (cleMois) => {
      const [annee, mois] = cleMois.split('-').map(Number);
      const debut = new Date(Date.UTC(annee, mois - 1, 1)).toISOString();
      const fin = new Date(Date.UTC(annee, mois, 1)).toISOString();

      const { data, error } = await supabase
        .from('commandes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('date_creation', debut)
        .lt('date_creation', fin)
        .order('date_creation', { ascending: true });

      if (error) {
        console.error('Erreur export brut transactions :', error.message);
        return [];
      }
      return data || [];
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
    categories: parametres.categories,
    ajouterCategorie,
    supprimerCategorie,
    sortiesCaisse,
    ajouterSortieCaisse,
    employes,
    ajouterEmploye,
    modifierEmploye,
    supprimerEmploye,
    trouverEmployeParCode,
    recupererTransactionsBrutesDuMois,
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

export function useCategories() {
  const { categories, ajouterCategorie, supprimerCategorie } = useAppData();
  return { categories, ajouterCategorie, supprimerCategorie };
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

export function useExportComptable() {
  const { recupererTransactionsBrutesDuMois } = useAppData();
  return { recupererTransactionsBrutesDuMois };
}