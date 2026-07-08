---
description: Synchroniser l'univers (PNJs et Threads) à partir du Journal.
---

# Workflow : Synchronisation de l'Univers

Ce workflow permet d'extraire automatiquement toutes les informations d'une nouvelle entrée du Journal de bord (écrite à la main ou dans le fichier de sauvegarde) pour mettre à jour la base Firebase (fiche de personnage, inventaire, états, PNJs et Threads).

1. **Déterminer le Personnage Actif** :
   - Identifier le fichier de sauvegarde actif dans `saves/` (ex: `saves/eddy.txt` ou `saves/max.txt`).
   - Lire le fichier `.agent/firebase_schema.json` pour trouver la clé de sauvegarde correspondante dans `save_mappings` (ex: "Eddy" -> "mainSave", "Max" -> "save_1776090589446").

2. **Activer le Skill de Synchronisation** :
   - Charger le skill `World Synchronizer` (`.agent/skills/world_synchronizer/SKILL.md`).

3. **Analyser les Dernières Entrées** :
   - Lire le fichier `saves/[char_name].txt` et repérer les dernières lignes/entrées ajoutées qui n'ont pas encore été synchronisées dans Firebase.
   - Extraire toutes les modifications factuelles :
     - **Économie** : Gains ou pertes d'argent (calculer le montant final).
     - **Inventaire** : Objets ajoutés, perdus ou consommés.
     - **États physiques & mentaux** : Blessures, maladies, nouveaux traumatismes, convalescences.
     - **PNJs** : Nouveaux personnages rencontrés, évolution des relations, faits marquants.
     - **Threads** : Création de sous-quêtes, avancement des intrigues, résolution d'objectifs.

4. **Préparer la Charge Utile (update.json)** :
   - Créer un fichier temporaire `update.json` respectant strictement le schéma défini dans `firebase_schema.json`.

5. **Exécuter la Synchronisation** :
   - Lancer la commande :
     `node tools\firebase_updater.js <SAVE_ID_MAPPED> update.json`

6. **Rapport de Synchronisation** :
   - Confirmer la réussite de la mise à jour à l'utilisateur sous la forme d'un résumé structuré (Modifications Personnage, PNJs, Threads).
