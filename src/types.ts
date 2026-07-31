export type Categorie = string;

export type ModePaiement = 'espece' | 'mobile_money' | 'en_attente';

export interface ArticleMenu {
  id: string;
  nom: string;
  prix: number;
  categorie: Categorie;
  icone: string;
  photo?: string;
  actif: boolean;
  commentaire?: string;
  codeBarre?: string;
  stock: number;
  seuilAlerte: number;
}

export interface LigneTicket {
  articleId: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
}

export interface Commande {
  id: string;
  numero: number;
  lignes: LigneTicket[];
  modePaiement: ModePaiement;
  dateCreation: string;
  dateEncaissement?: string;
  total: number;
}

export interface Cloture {
  id: string;
  date: string; // yyyy-mm-dd
  totalEspecesTheorique: number;
  montantEspecesReel: number;
  ecart: number;
  totalMobileMoney: number;
  totalGeneral: number;
  dateCloture: string; // ISO
}

export interface SortieCaisse {
  id: string;
  motif: string;
  montant: number;
  date: string; // yyyy-mm-dd
  dateCreation: string; // ISO
}

export type RoleEmploye = 'employe' | 'gerant';

export interface Employe {
  id: string;
  nom: string;
  code: string; // PIN à 4 chiffres, personnel
  role: RoleEmploye;
  actif: boolean;
}