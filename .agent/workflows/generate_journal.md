---
description: Generates a new roleplay scene for Obadiah Vesper integrating Game Master rules and maintaining local state.
---

# Workflow: Generation Journal Obadiah Vesper

This workflow dictates the exact steps for generating a chunk of the narrative (around 800 - 1500 words at a time).

1. **Read the Context**: 
   - Parse `e:\Tri Selectif\Programmation\the-oregon-trail\saves\obadiah.txt` using the `view_file` tool to understand the current situation, inventory, recent journal entries, active threads, and stats.

2. **Plan the Scene (Internal thought)**
   - Determine what the very next immediate moment is for Obadiah Vesper.
   - Break it down: What is Obadiah trying to do? Who is he meeting? How does the frail constitution and the environment play a role?

3. **Mechanics Resolution**
   - Identify if an action requires a roll (e.g. Navigation Céleste, Réparation mécanique, Perception, Agilité).
   - Run `run_command` with `node tools\dice_roller.js <stat>` if Obadiah acts.
   - Run `run_command` with `node tools\mythic_oracle.js "<odds>"` if the environment or NPCs act.

4. **Writing Phase**
   - Draft the scene directly in your output response. Be incredibly sensory, focus on sound, physical difficulty, and the slow passage of time.
   - Format clearly with the date.

5. **State Update Phase & Firebase Sync (CRITICAL)**
   - Did the scene change anything? Did he spend money? Gain an item? Obtain an injury? Meet a new NPC?
   - Formulate exactly how the game state has evolved. Create a file `/tmp/update.json` using the exact JSON schema defined in your SKILL.md (containing journal_entry, npcs, threads).
   - Once the scene is finalized, execute `node tools\firebase_updater.js save_obie_vesper \tmp\update.json` to push the update to the Firebase database.
   - Do NOT edit `saves/obadiah.txt` manually.

6. **Notify User**
   - Present a short summary to the user. Ask if they want you to continue to the next scene of the day, using the `notify_user` tool with `BlockedOnUser=true`.
