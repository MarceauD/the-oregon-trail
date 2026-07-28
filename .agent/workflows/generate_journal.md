---
description: Generates a new roleplay scene for Obadiah Vesper integrating Game Master rules and maintaining local state.
---

# Workflow: Génération de Scène de Journal

Ce workflow décrit les étapes précises pour co-écrire et générer une nouvelle scène narrative (environ 800 à 1500 mots) pour n'importe quel personnage actif.

1. **Lire le Contexte du Personnage Actif** :
   - Identifier le personnage en cours de jeu (ex: Eddy, Max, etc.).
   - Ouvrir et analyser son fichier de sauvegarde correspondant dans `saves/` (ex: `saves/eddy.txt` ou `saves/max.txt`) pour comprendre sa situation immédiate, son inventaire, ses caractéristiques et ses blessures/traumatismes en cours.
   - Consulter le fichier `.agent/firebase_schema.json` pour déterminer la clé Firebase associée (ex: "Eddy" -> "mainSave", "Max" -> "save_1776090589446").

2. **Planifier la Scène (Pensée interne)** :
   - Déterminer l'instant précis suivant pour le personnage.
   - Poser les bases dramatiques : Quels sont les besoins immédiats du personnage ? Quel est l'obstacle (physique, économique, social ou métabolique) ? Comment sa personnalité et ses forces/faiblesses influencent la scène ?

3. **Résolution des Mécaniques & Consultation des Oracles (`tools/solo_oracle.js`)** :
   - Déterminer si l'action entreprise requiert un jet sous une compétence ou une caractéristique : `node tools/dice_roller.js <valeur_stat>`.
   - Si une question de probabilité se pose ou qu'un événement survient : `node tools/solo_oracle.js fate <odds> [chaos]` (ex: `likely 5`). En cas d'événement aléatoire, le script tire **automatiquement** l'événement Mythic et l'atmosphère !
   - Pour introduire un PNJ 19e, une péripétie de voyage ou un conflit moral, exécuter :
     - `node tools/solo_oracle.js npc` (PNJ 19e complet)
     - `node tools/solo_oracle.js hazard` (Météo, danger de la piste, avarie chariot)
     - `node tools/solo_oracle.js dilemma` (Dilemme moral, complication sociale)
     - `node tools/solo_oracle.js event` (Événement Mythic complet)
   - Intégrer les résultats des jets fidèlement dans le texte narratif.

4. **Phase d'Écriture** :
   - Rédiger la scène en adoptant strictement le style et la voix du personnage (Max : phrases courtes SVO, descriptions physiques et sensorielles directes ; Eddy : style poétique, synesthésies, musicalité).
   - Respecter la lenteur narrative (l'agonie locale) et la dureté de l'année 1868.

5. **Mise à jour du Statut et Synchronisation Firebase** :
   - Calculer les deltas de la scène (argent dépensé, nouvel objet dans l'inventaire, blessures, faits marquants de PNJ, évolution d'intrigues).
   - Préparer un fichier JSON temporaire `tmp/update.json` respectant le schéma de `firebase_schema.json`.
   - Exécuter la commande pour synchroniser Firebase :
     `node tools/firebase_updater.js <SAVE_ID_MAPPED> tmp/update.json`
   - Si la scène a été écrite ou validée par l'utilisateur, l'ajouter au fichier de sauvegarde local (`saves/[char_name].txt`).

6. **Notification de l'Utilisateur** :
   - Présenter un court résumé à l'utilisateur et lui proposer des pistes ou choix narratifs pour la suite de sa journée de voyage.
