import type { ArticleMenu } from '../types';

export const MENU_PAR_DEFAUT: ArticleMenu[] = [
  { id: 'm1', nom: 'Poulet DG', prix: 5500, categorie: 'Plats', icone: 'soup', actif: true },
  { id: 'm2', nom: 'Poisson braisé', prix: 6000, categorie: 'Plats', icone: 'fish', actif: true },
  { id: 'm3', nom: 'Brochettes', prix: 3000, categorie: 'Plats', icone: 'meat', actif: true },
  { id: 'm4', nom: 'Bière locale', prix: 1000, categorie: 'Boissons', icone: 'bottle', actif: true },
  { id: 'm5', nom: 'Jus de gingembre', prix: 1500, categorie: 'Boissons', icone: 'glass', actif: true },
  { id: 'm6', nom: 'Salade de fruits', prix: 2000, categorie: 'Desserts', icone: 'ice-cream', actif: true },
];
