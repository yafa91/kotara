#!/usr/bin/env python3
import re
from pathlib import Path

FICHIERS = [
    "src/views/Caisse.tsx",
    "src/views/Historique.tsx",
    "src/views/PriseCommande.tsx",
    "src/views/Rapports.tsx",
    "src/views/MenuProduits.tsx",
    "src/views/ScannerProduit.tsx",
]

PATTERN_FORMAT_PRIX = re.compile(
    r"[ \t]*const formatPrix = \(n: number\) => `\$\{.*?\} FCFA`;\n"
)

IMPORT_DEVISE = "import { useDevise } from '../store/AppDataContext';\n"
IMPORT_FORMAT = "import { formatMontant } from '../lib/formatMontant';\n"

NOUVELLE_DEF = (
    "  const devise = useDevise();\n"
    "  const formatPrix = (n: number) => formatMontant(n, devise);\n"
)

def traiter_fichier(chemin):
    if not chemin.exists():
        print(f"⚠️  Introuvable : {chemin}")
        return
    texte = chemin.read_text(encoding="utf-8")
    origine = texte
    if "useDevise" not in texte:
        lignes = texte.split("\n")
        derniere = 0
        for i, ligne in enumerate(lignes):
            if ligne.startswith("import "):
                derniere = i
        lignes.insert(derniere + 1, IMPORT_DEVISE.rstrip("\n"))
        lignes.insert(derniere + 2, IMPORT_FORMAT.rstrip("\n"))
        texte = "\n".join(lignes)
    if PATTERN_FORMAT_PRIX.search(texte):
        texte = PATTERN_FORMAT_PRIX.sub(NOUVELLE_DEF, texte, count=1)
    else:
        print(f"⚠️  formatPrix non trouvé : {chemin}")
    if texte != origine:
        chemin.write_text(texte, encoding="utf-8")
        print(f"✅ Modifié : {chemin}")
    else:
        print(f"ℹ️  Aucun changement : {chemin}")

for f in FICHIERS:
    traiter_fichier(Path(f))
