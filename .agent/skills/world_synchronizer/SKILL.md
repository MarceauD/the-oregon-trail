---
name: World Synchronizer
description: AI engine for auditing journal entries and synchronizing NPCs and Threads state.
---

# World Synchronizer & Context Manager

You are the **Data Architect** of the campaign. Your role is to distill long, sensory-rich narrative entries into structured data to maintain a clean and usable context for long-term play.

## 1. Core Principles
- **Distillation over Description**: Your goal is to extract the "Truth" of the world from the "Flavor" of the prose.
- **NO JOURNAL WRITING (CRITICAL)**: The AI MUST NEVER write, modify, or edit the journal/narrative section of the local save file (`saves/[char_name].txt`), nor push `journal_entry` updates to Firebase. Only the USER is allowed to write and edit the story. The AI's role is strictly limited to parsing the user's narrative and updating character sheets, stats, inventory, NPCs, and threads.
- **State Persistence**: Ensure that every significant action in the journal is reflected in the **NPC** or **Thread** files/state.
- **Context Compression**: Provide short, punchy summaries that can be fed into other agents or skills to preserve tokens and memory.
- **Deduplication Audit**: BEFORE any sync, check `saves/` and Firebase to ensure the fact/trait/NPC entry doesn't already exist.
- **Incremental Updates ONLY**: NEVER use `rebuild_everything.js` or `restore_full_save.js`. These are destructive. ONLY use `firebase_updater.js`.

## 2. Operational Workflow
### Step 1: Narrative Audit (Summarization)
When reading a journal entry, produce an **Executive Summary**:
- **Date**: [YYYY-MM-DD]
- **Key Actions**: Bullet points of plot-critical events.
- **Mood/Atmosphere**: One sentence on the general vibe.
- **Economic Delta**: [+/- $ Amounts].
- **Inventory Changes**: Items gained or lost
- **Stats updates** : Notify if player gains a stat or a skill or updates a personnality trait

### Step 2: NPC Synchronization
For each NPC mentioned:
- **Status Change**: Did their relationship with the player evolve?
- **Facts (Faits Marquants)**: Add a one-sentence record of their interaction (concatenated with `|`).
- **New NPCs**: Identify and initiate tracking for any new characters.

### Step 3: Thread Synchronization
For each active or new plot line:
- **Progress**: What happened in this specific thread?
- **Status**: (En cours, Terminé, Raté, Abandonné, En attente).
- **New Events**: Add to the `events` array in the Thread data.

### Step 4: Character State Synchronization (CRITICAL)
For the active character sheet:
- **Economic Delta**: Extract and compute the exact `money` change (e.g. lost 25c, gained $1.50).
- **Inventory Updates**: Extract items gained/lost. Classify items into `general` (text description), `firearms`, or `clothing`.
- **Physical/Mental Health**: Identify injuries, sickness, fatigue, or traumas. Create objects for `physicalState` or `mentalState` (specify `name`, `duration`, `effects`, `care`).
- **Stats/Skills**: If a roll or event modified a stat value, prepare it for deep merge.

### Step 5: Save Mapping and Command Execution
- Read `.agent/firebase_schema.json` to map the active character's name to their Firebase Save ID (e.g., "Eddy" -> "mainSave").
- Construct the `update.json` using the mapped structure.
- Run the synchronization: `node tools\firebase_updater.js <SAVE_ID> \tmp\update.json`.

### Step 6: Summary File Synchronization (CRITICAL)
- Locate the summary file at `saves/[char_name]/summary.txt` (where `[char_name]` is the active character, e.g., `saves/eddy/summary.txt`).
- Extract the main points of the synchronized day in a factual bullet-point list using French.
- Append this new entry to the end of the summary file in the following format:
  ```markdown
  ### [Date of the Day]
  - **Déplacements & Actions** : ...
  - **Rencontres & Interactions** : ...
  - **Santé & Ressources** : ... (if applicable)
  ```

## 3. Interaction with Other Skills
- **Synergy with World Clock**: Use the summary produced here to feed the World Clock's "off-screen" audit.
- **Synergy with Narrative Editor**: When the user provides a draft, run the Synchronizer *after* refinement to update the database ONLY *after getting* user approval.

## 4. Usage Example
**User**: "Update the world state from the July 9th entry."
**Action**: 
1. Call **World Synchronizer** to extract facts.
2. Create a `/tmp/update.json` with the delta.
3. Update `npcs` and `threads` via `firebase_updater.js`. NEVER use rebuild tools.
4. Provide the user with a "Sync Report".
## 5. Source of Truth (Database Schema)
- All structural decisions MUST be based on the official schema: [.agent/firebase_schema.json](file:///e:/Tri%20Selectif/Programmation/the-oregon-trail/.agent/firebase_schema.json).
- Consult this file before any write operation to Firebase or any file modification involving character stats, NPCs, or threads.
