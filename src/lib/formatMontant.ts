export type Devise = 'EUR' | 'XOF';

export function formatMontant(montant: number, devise: Devise): string {
  if (devise === 'XOF') {
    const arrondi = Math.round(montant);
    return `${arrondi.toLocaleString('fr-FR')} FCFA`;
  }

  return montant.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
}
