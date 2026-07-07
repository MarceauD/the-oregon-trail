---
description: Synchroniser l'univers (PNJs et Threads) à partir du Journal.
---

# Workflow : Synchronisation de l'Univers

Ce workflow permet d'extraire automatiquement les informations du Journal de bord pour mettre à jour les PNJs et les Threads dans Firebase.

// turbo
1. L'agent doit activer le skill `World Synchronizer` (view_file sur `e:\Tri Selectif\Programmation\the-oregon-trail\.agent\skills\world_synchronizer\SKILL.md`).
2. L'agent lit le fichier `saves/[char_name].txt` (ex: `obadiah.txt`).
3. L'agent identifie les PNJs et Threads mentionnés dans le Journal qui ne sont pas à jour dans les listes respectives.
4. L'agent prépare un fichier `update.json` avec les "Faits Marquants" et "Events" extraits.
5. L'agent exécute la mise à jour :
   `node tools\firebase_updater.js save_obie_vesper update.json`
6. L'agent confirme la mise à jour à l'utilisateur.
