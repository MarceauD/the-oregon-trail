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
   - **Comportements et règles spéciales de synchronisation :**
     - **Ajout incrémental au Journal** : Si l'objet contient une structure `journal_entry` avec une date déjà présente sur Firebase, le texte sera concaténé à la fin de l'entrée existante (séparé par un double saut de ligne `<br><br>`) sans écraser le contenu précédent. **Important : Le texte narratif fourni dans le champ `entry` doit obligatoirement être formaté en HTML propre (avec des balises `<p>`, des `<br>` pour les sauts de ligne, et tout autre élément de mise en page requis) pour assurer un rendu correct dans l'application.**
     - **Suppression d'éléments via `_delete` (Uniquement pour le Personnage)** : Pour supprimer un élément d'une liste dynamique de la fiche de personnage (ex: inventaire, états physiques/mentaux, compétences, traits), spécifiez cet objet avec son critère de correspondance unique (`id`, `name`, ou `text`) et ajoutez le drapeau `"_delete": true`.
       *Exemple : Supprimer un objet d'inventaire*
       ```json
       {
         "character": {
           "inventory": {
             "general": [
               { "text": "Vieil alambic en cuivre", "_delete": true }
             ]
           }
         }
       }
       ```
     - **Règle absolue pour les PNJs et les Threads** : **Ils ne doivent jamais être supprimés de la base de données.** Si un PNJ meurt ou disparaît, ou si un Thread est raté ou abandonné, mettez simplement à jour son champ `status` (ex: `"mort"`, `"disparu"`, `"rate"`, `"abandonne"`).

5. **Exécuter la Synchronisation** :
   - Lancer la commande :
     `node tools\firebase_updater.js <SAVE_ID_MAPPED> update.json`

6. **Mettre à jour le fichier de résumé cumulatif** :
   - Ouvrir le fichier de résumé `saves/[char_name]/summary.txt` (ex: `saves/eddy/summary.txt`).
   - Extraire les faits essentiels de la nouvelle journée sous forme de liste à puces factuelle (Déplacements & Actions, Rencontres & Interactions, Santé & Ressources).
   - Ajouter cette nouvelle entrée à la fin du fichier.

7. **Rapport de Synchronisation** :
   - Confirmer la réussite de la mise à jour à l'utilisateur sous la forme d'un résumé structuré (Modifications Personnage, PNJs, Threads) et lui signaler que le fichier de résumé `summary.txt` a été complété.
