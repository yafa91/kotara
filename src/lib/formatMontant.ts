export type Devise = 'EUR' | 'XOF';

/**
 * Formate un montant selon la devise de l'établissement.
 *
 * - EUR : ex. "15,50 €"
 * - XOF (Franc CFA) : pas de décimales, ex. "1 500 FCFA"
 *
 * @param montant Le montant à formater (toujours en unité "normale", jamais en centimes)
 * @param devise  'EUR' ou 'XOF'
 */
export function formatMontant(montant: number, devise: Devise): string {
  if (devise === 'XOF') {
    // Le Franc CFA ne s'utilise pas avec des décimales
    const arrondi = Math.round(montant);
    return `${arrondi.toLocaleString('fr-FR')} FCFA`;
  }

  // EUR par défaut — pas de décimales inutiles (200 € plutôt que 200,00 €),
  // mais on garde les centimes s'il y en a (12,50 € reste 12,50 €).
  return montant.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}