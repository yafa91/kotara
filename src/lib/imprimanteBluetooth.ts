// Impression thermique via Web Bluetooth (Chrome Android / Chrome desktop uniquement,
// non supporté par Safari). Protocole ESC/POS, imprimante 58mm.

// UUIDs standards utilisés par la grande majorité des imprimantes thermiques Bluetooth
// bon marché (chipsets génériques type JK/PT-2xx). On les propose tous en "optionalServices"
// et on détecte automatiquement laquelle est réellement présente sur l'appareil connecté.
const SERVICES_CONNUS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];

let caracteristiqueEcriture: BluetoothRemoteGATTCharacteristic | null = null;
let appareilConnecte: BluetoothDevice | null = null;

export function bluetoothDisponible(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function imprimanteConnectee(): boolean {
  return caracteristiqueEcriture !== null;
}

export async function connecterImprimante(): Promise<void> {
  if (!bluetoothDisponible()) {
    throw new Error(
      "Le Bluetooth n'est pas disponible dans ce navigateur. Utilise Chrome sur Android."
    );
  }

  const device = await (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: SERVICES_CONNUS,
  });

  const server = await device.gatt.connect();

  let caracteristiqueTrouvee: BluetoothRemoteGATTCharacteristic | null = null;

  for (const serviceUuid of SERVICES_CONNUS) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      const caracteristiques = await service.getCharacteristics();
      const cible = caracteristiques.find(
        (c: BluetoothRemoteGATTCharacteristic) =>
          c.properties.write || c.properties.writeWithoutResponse
      );
      if (cible) {
        caracteristiqueTrouvee = cible;
        break;
      }
    } catch {
      // ce service n'existe pas sur cet appareil, on essaie le suivant
    }
  }

  if (!caracteristiqueTrouvee) {
    throw new Error(
      "Connecté à l'appareil, mais impossible de trouver le canal d'impression. Ce modèle n'est peut-être pas compatible."
    );
  }

  appareilConnecte = device;
  caracteristiqueEcriture = caracteristiqueTrouvee;

  device.addEventListener('gattserverdisconnected', () => {
    caracteristiqueEcriture = null;
    appareilConnecte = null;
  });
}

export function deconnecterImprimante(): void {
  appareilConnecte?.gatt?.disconnect();
  caracteristiqueEcriture = null;
  appareilConnecte = null;
}

async function envoyerOctets(octets: Uint8Array): Promise<void> {
  if (!caracteristiqueEcriture) {
    throw new Error('Imprimante non connectée.');
  }
  // Les imprimantes Bluetooth bon marché acceptent mal les gros paquets :
  // on découpe l'envoi en petits blocs avec une pause entre chaque.
  const TAILLE_BLOC = 20;
  for (let i = 0; i < octets.length; i += TAILLE_BLOC) {
    const bloc = octets.slice(i, i + TAILLE_BLOC);
    await caracteristiqueEcriture.writeValue(bloc);
    await new Promise((r) => setTimeout(r, 20));
  }
}

// Retire les accents, remplace le symbole € (mal supporté en UTF-8 par la
// plupart de ces imprimantes), et remplace les espaces "spéciales" que
// toLocaleString('fr-FR') insère (espace insécable, espace fine insécable...)
// par de vraies espaces ASCII — sinon ces caractères multi-octets sont mal
// interprétés par l'imprimante et cassent l'alignement des lignes.
function pourImprimante(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/€/g, 'EUR')
    .replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' ');
}

const LARGEUR_PAPIER = 32; // caractères par ligne sur du papier 58mm, police standard

function ligneAvecMontant(gauche: string, droite: string): string {
  const g = pourImprimante(gauche);
  const d = pourImprimante(droite);
  const espace = Math.max(1, LARGEUR_PAPIER - g.length - d.length);
  return g + ' '.repeat(espace) + d + '\n';
}

// Le centrage est délégué à l'imprimante (commande ESC a 1) : on ne doit PAS
// ajouter de padding manuel ici, sinon les deux centrages s'additionnent et
// le texte apparaît décalé au lieu d'être centré.
function ligneCentree(texte: string): string {
  return pourImprimante(texte) + '\n';
}

interface LigneImpression {
  nom: string;
  quantite: number;
  montant: string; // déjà formaté (ex: "1 500 FCFA" ou "15,00 €")
}

export interface TicketAImprimer {
  nomResto: string;
  adresseResto: string;
  telephoneResto: string;
  numero: number;
  lignes: LigneImpression[];
  total: string;
  modePaiement: string;
}

function construireCommandesTicket(ticket: TicketAImprimer): Uint8Array {
  const morceaux: number[] = [];
  const push = (...octets: number[]) => morceaux.push(...octets);
  const texte = (s: string) => push(...Array.from(new TextEncoder().encode(s)));

  push(0x1b, 0x40); // ESC @ : initialise l'imprimante

  push(0x1b, 0x61, 0x01); // centré
  push(0x1b, 0x45, 0x01); // gras on
  texte(ligneCentree(ticket.nomResto));
  push(0x1b, 0x45, 0x00); // gras off
  texte(ligneCentree(ticket.adresseResto));
  texte(ligneCentree(ticket.telephoneResto));
  texte('\n');

  push(0x1b, 0x61, 0x00); // aligné à gauche
  texte('-'.repeat(LARGEUR_PAPIER) + '\n');
  texte(`Ticket n${ticket.numero}\n`);
  texte('-'.repeat(LARGEUR_PAPIER) + '\n');

  for (const ligne of ticket.lignes) {
    texte(ligneAvecMontant(`${ligne.quantite}x ${ligne.nom}`, ligne.montant));
  }

  texte('-'.repeat(LARGEUR_PAPIER) + '\n');
  push(0x1b, 0x45, 0x01); // gras on
  texte(ligneAvecMontant('TOTAL', ticket.total));
  push(0x1b, 0x45, 0x00); // gras off

  texte('\n');
  push(0x1b, 0x61, 0x01); // centré
  texte(ligneCentree(`Reglement : ${pourImprimante(ticket.modePaiement)}`));

  texte('\n\n\n\n'); // marge pour pouvoir déchirer le papier à la main

  return new Uint8Array(morceaux);
}

export async function imprimerTicketBluetooth(ticket: TicketAImprimer): Promise<void> {
  if (!imprimanteConnectee()) {
    await connecterImprimante();
  }
  const commandes = construireCommandesTicket(ticket);
  await envoyerOctets(commandes);
}