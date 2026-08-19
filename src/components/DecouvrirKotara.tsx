import appScreenshot from '../assets/appscreen.jpg';

interface DecouvrirKotaraProps {
  onRetour: () => void;
  onMentionsLegales: () => void;
  onCGU: () => void;
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#FAF7F1',
    color: '#16221D',
    fontFamily: "'Inter', -apple-system, sans-serif",
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 32px',
    borderBottom: '1px solid rgba(22,34,29,0.1)',
  } as React.CSSProperties,
  logo: {
    fontWeight: 700,
    fontSize: 32,
    margin: 0,
  } as React.CSSProperties,
  logoK: { color: '#F2801E' },
  hero: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '72px 24px 48px',
    textAlign: 'center',
  } as React.CSSProperties,
  eyebrow: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#2F6F5E',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 16,
  },
  h1: {
    fontSize: 40,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: '0 0 18px',
    lineHeight: 1.1,
  } as React.CSSProperties,
  lead: {
    fontSize: 17,
    color: '#5B6B62',
    lineHeight: 1.6,
    margin: '0 auto 32px',
    maxWidth: 480,
  } as React.CSSProperties,
  section: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '48px 24px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: 32,
    textAlign: 'center' as const,
  },
  grille: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 1,
    background: 'rgba(22,34,29,0.1)',
    border: '1px solid rgba(22,34,29,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  } as React.CSSProperties,
  carteFeature: {
    background: '#FAF7F1',
    padding: '28px 24px',
  } as React.CSSProperties,
  featureTitre: { fontWeight: 600, fontSize: 15.5, margin: '0 0 8px' },
  featureTexte: { fontSize: 13.5, color: '#5B6B62', lineHeight: 1.5, margin: 0 },
  ticket: {
    width: 280,
    background: 'white',
    borderRadius: 4,
    boxShadow: '0 24px 48px -16px rgba(22,34,29,0.25)',
    padding: '22px 20px 18px',
    fontFamily: 'monospace',
    margin: '0 auto',
    transform: 'rotate(-1deg)',
  } as React.CSSProperties,
  ticketLigne: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12.5,
    padding: '3px 0',
    color: '#5B6B62',
  } as React.CSSProperties,
  ticketTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 15,
    fontWeight: 700,
    paddingTop: 8,
  } as React.CSSProperties,
  ticketRule: { borderTop: '1px dashed rgba(22,34,29,0.15)', margin: '8px 0' },
  pricing: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 20,
  } as React.CSSProperties,
  plan: {
    border: '1px solid rgba(22,34,29,0.12)',
    borderRadius: 14,
    padding: '28px 26px',
    background: 'white',
  } as React.CSSProperties,
  planNom: { fontWeight: 700, fontSize: 17, margin: '0 0 4px' },
  planPrix: { fontSize: 28, fontWeight: 700, margin: '10px 0 4px' },
  planPrixAlt: { fontFamily: 'monospace', fontSize: 12.5, color: '#5B6B62', margin: '0 0 18px' },
  planListe: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 8 },
  planItem: { fontSize: 13.5, display: 'flex', gap: 8 },
  ctaFinal: {
    textAlign: 'center' as const,
    padding: '64px 24px 80px',
  },
  bouton: {
    background: '#F2801E',
    color: 'white',
    border: 'none',
    borderRadius: 9,
    padding: '13px 26px',
    fontSize: 14.5,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  footer: {
    borderTop: '1px solid rgba(22,34,29,0.1)',
    padding: '24px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  footerTexte: {
    fontSize: 12,
    color: '#999',
    margin: '0 0 10px',
  } as React.CSSProperties,
  footerLiens: {
    display: 'flex',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  } as React.CSSProperties,
  footerLien: {
    background: 'none',
    border: 'none',
    fontSize: 12.5,
    color: '#5B6B62',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'none',
  } as React.CSSProperties,
  screenSection: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '40px 24px 64px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 48,
    alignItems: 'center',
  } as React.CSSProperties,
  screenTexte: { paddingRight: 8 } as React.CSSProperties,
  screenTitre: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: '0 0 14px',
    lineHeight: 1.2,
  } as React.CSSProperties,
  screenLead: {
    fontSize: 15,
    color: '#5B6B62',
    lineHeight: 1.6,
    margin: '0 0 22px',
  } as React.CSSProperties,
  screenListe: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  } as React.CSSProperties,
  screenItem: { fontSize: 14, display: 'flex', gap: 10, color: '#16221D' } as React.CSSProperties,
  screenCadre: {
    background: 'white',
    borderRadius: 14,
    border: '1px solid rgba(22,34,29,0.1)',
    boxShadow: '0 30px 60px -24px rgba(22,34,29,0.25)',
    overflow: 'hidden',
  } as React.CSSProperties,
  screenBarre: {
    display: 'flex',
    gap: 6,
    padding: '10px 12px',
    borderBottom: '1px solid rgba(22,34,29,0.08)',
  } as React.CSSProperties,
  screenPoint: (couleur: string): React.CSSProperties => ({
    width: 9,
    height: 9,
    borderRadius: '50%',
    background: couleur,
  }),
  screenImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'contain' as const,
  } as React.CSSProperties,
};

export default function DecouvrirKotara({ onRetour, onMentionsLegales, onCGU }: DecouvrirKotaraProps) {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.logo}>
          <span style={styles.logoK}>K</span>otara
        </p>
      </div>

      <div style={styles.hero}>
        <p style={styles.eyebrow}>Pour restaurants et boutiques</p>
        <h1 style={styles.h1}>Ta caisse tient sur une tablette.</h1>
        <p style={styles.lead}>
          Prise de commande, caisse, menu, stock et comptabilité dans un seul logiciel, en euro
          ou en franc CFA, sans matériel à acheter.
        </p>

        <div style={styles.ticket}>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>CHEZ MAMA KOTARA</div>
            <div style={{ fontSize: 10.5, color: '#5B6B62', marginTop: 2 }}>
              Ticket n°214 · 12:41
            </div>
          </div>
          <div style={styles.ticketRule}></div>
          <div style={styles.ticketLigne}>
            <span>2x Frites</span>
            <span>4 €</span>
          </div>
          <div style={styles.ticketLigne}>
            <span>1x Burger classique</span>
            <span>9,50 €</span>
          </div>
          <div style={styles.ticketLigne}>
            <span>2x Bissap</span>
            <span>5 €</span>
          </div>
          <div style={styles.ticketRule}></div>
          <div style={styles.ticketTotal}>
            <span>Total</span>
            <span>18,50 €</span>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Tout est déjà relié</p>
        <div style={styles.grille}>
          <div style={styles.carteFeature}>
            <p style={styles.featureTitre}>Prise de commande</p>
            <p style={styles.featureTexte}>
              Menu par catégories, ticket en un clic, impression directe.
            </p>
          </div>
          <div style={styles.carteFeature}>
            <p style={styles.featureTitre}>Caisse</p>
            <p style={styles.featureTexte}>
              Ouverture et clôture de service, comptage espèces, sorties de caisse.
            </p>
          </div>
          <div style={styles.carteFeature}>
            <p style={styles.featureTitre}>Menu &amp; code-barres</p>
            <p style={styles.featureTexte}>
              Scanne un produit une fois, il rejoint le menu avec son prix.
            </p>
          </div>
          <div style={styles.carteFeature}>
            <p style={styles.featureTitre}>Comptabilité</p>
            <p style={styles.featureTexte}>
              Revenus, charges, bénéfice net, export prêt pour ton comptable.
            </p>
          </div>
          <div style={styles.carteFeature}>
            <p style={styles.featureTitre}>Multi-employés</p>
            <p style={styles.featureTexte}>
              Un compte gérant, plusieurs employés, des droits différents pour chacun.
            </p>
          </div>
          <div style={styles.carteFeature}>
            <p style={styles.featureTitre}>Inventaire</p>
            <p style={styles.featureTexte}>
              Le stock descend tout seul à chaque vente, avec alerte de stock bas.
            </p>
          </div>
        </div>
      </div>

      <div style={styles.screenSection}>
        <div style={styles.screenCadre}>
          <div style={styles.screenBarre}>
            <span style={styles.screenPoint('#E8544A')}></span>
            <span style={styles.screenPoint('#F2B23C')}></span>
            <span style={styles.screenPoint('#3BAA6B')}></span>
          </div>
          <img
            src={appScreenshot}
            alt="Aperçu de l'interface Kotara"
            style={styles.screenImage}
          />
        </div>

        <div style={styles.screenTexte}>
          <p style={styles.eyebrow}>L'interface</p>
          <h2 style={styles.screenTitre}>Pensée pour aller vite pendant le rush.</h2>
          <p style={styles.screenLead}>
            Gros boutons, catégories claires, panier toujours visible — conçue pour être
            utilisée d'une main, entre deux commandes.
          </p>
          <ul style={styles.screenListe}>
            <li style={styles.screenItem}>✓ Menu organisé par catégories personnalisables</li>
            <li style={styles.screenItem}>✓ Panier flottant avec total en temps réel</li>
            <li style={styles.screenItem}>✓ Ticket imprimé en un seul geste</li>
          </ul>
        </div>
      </div>

      <div style={styles.section}>
        <p style={styles.sectionTitle}>Deux plans, le même outil complet</p>
        <div style={styles.pricing}>
          <div style={styles.plan}>
            <p style={styles.planNom}>Standard</p>
            <p style={{ fontSize: 13.5, color: '#5B6B62', margin: 0 }}>
              Pour démarrer sans complexité
            </p>
            <p style={styles.planPrix}>20 €/mois</p>
            <p style={styles.planPrixAlt}>ou 15 000 FCFA / mois</p>
            <ul style={styles.planListe}>
              <li style={styles.planItem}>✓ Prise de commande &amp; caisse</li>
              <li style={styles.planItem}>✓ Menu et scan code-barres</li>
              <li style={styles.planItem}>✓ Inventaire avec alertes</li>
              <li style={styles.planItem}>✓ 1 point de vente</li>
            </ul>
          </div>
          <div style={{ ...styles.plan, border: '1px solid #16221D', background: '#F1ECE1' }}>
            <p style={styles.planNom}>Premium</p>
            <p style={{ fontSize: 13.5, color: '#5B6B62', margin: 0 }}>
              Pour piloter plusieurs équipes
            </p>
            <p style={styles.planPrix}>49 €/mois</p>
            <p style={styles.planPrixAlt}>ou 26 000 FCFA / mois</p>
            <ul style={styles.planListe}>
              <li style={styles.planItem}>✓ Tout le plan Standard</li>
              <li style={styles.planItem}>✓ Rapports avancés</li>
              <li style={styles.planItem}>✓ Gestion multi-employés</li>
              <li style={styles.planItem}>✓ Points de vente illimités</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={styles.ctaFinal}>
        <button type="button" style={styles.bouton} onClick={onRetour}>
          Créer mon compte gratuitement
        </button>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerLiens}>
          <button type="button" style={styles.footerLien} onClick={onMentionsLegales}>
            Mentions légales
          </button>
          <button type="button" style={styles.footerLien} onClick={onCGU}>
            CGU/CGV
          </button>
        </div>
        <p style={styles.footerTexte}>
          Kotara © 2026, Logiciel édité par WARABI SAS. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}