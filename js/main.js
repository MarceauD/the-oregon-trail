function renderAll() {
    if (typeof renderCharacterSheet === 'function') renderCharacterSheet();
    if (typeof renderNpcs === 'function') renderNpcs();
    if (typeof renderThreads === 'function') renderThreads();
    if (typeof renderJournal === 'function') renderJournal();
}

window.exportSectionToClipboard = function (type) {
    let output = '';
    const separator = '\n------------------------------------\n\n';
    if (type === 'character') {
        const char = gameState.character;
        output = '=== FICHE DE PERSONNAGE ===\n\n';

        // IDENTITÉ
        const id = char.identityFields || {};
        output += `--- IDENTITÉ ---\n`;
        output += `Nom : ${id.name || 'N/A'}\n`;
        output += `Âge : ${id.age || 'N/A'}\n`;
        output += `Origine : ${id.origin || 'N/A'}\n`;
        output += `Profession : ${id.profession || 'N/A'}\n\n`;

        // HISTOIRE
        output += `--- HISTOIRE ---\n`;
        output += `${char.history || 'Pas d\'histoire enregistrée.'}\n\n`;

        output += `--- ÉCONOMIE ---\n`;
        output += `Monnaie : $${(char.money || 0).toFixed(2)}\n\n`;
        output += '--- STATISTIQUES ---\n';
        char.stats.forEach(s => { output += `${s.name}: ${s.value}\n`; });
        output += '\n--- COMPÉTENCES ---\n';
        char.skills.forEach(s => { output += `${s.name}: ${s.value}\n`; });
        output += '\n--- POINTS FORTS ---\n';
        char.strengths.forEach(s => { output += `- ${s.text}\n`; });
        output += '\n--- POINTS FAIBLES ---\n';
        char.weaknesses.forEach(w => { output += `- ${w.text}\n`; });
        output += '\n--- INVENTAIRE ---\n';
        for (const category in char.inventory) {
            if (char.inventory[category].length > 0) {
                output += `\n> ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
                char.inventory[category].forEach(item => { output += `- ${item.name || item.text}\n`; });
            }
        }
        output += '\n--- SAVOIRS SPÉCIFIQUES ---\n';
        char.specificKnowledge.forEach(m => { output += `- ${m.name} (${m.description})\n`; });

        output += '\n--- ÉTAT PHYSIQUE ---\n';
        char.physicalState.forEach(s => { output += `- ${s.name} (Soins: ${s.care}, Effets: ${s.effects})\n`; });

        output += '\n--- SANTÉ MENTALE ---\n';
        char.mentalState.forEach(s => { output += `- ${s.name} (Soins: ${s.care}, Effets: ${s.effects})\n`; });
    } else if (type === 'npcs') {
        output = '=== PERSONNAGES NON-JOUABLES ===\n\n';
        gameState.npcs.forEach(npc => {
            let statusText = (npc.status || '').replace(/-/g, ' ');
            statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
            output += `Nom: ${npc.name}\nStatut: ${statusText}\n\nDescription:\n${npc.description}\n\n`;
            if (npc.faitsMarquants && npc.faitsMarquants.trim() !== '') { output += `Faits marquants:\n${npc.faitsMarquants}\n`; }
            output += separator;
        });
    } else if (type === 'threads') {
        output = '=== THREADS ===\n\n';
        gameState.threads.forEach(thread => {
            let statusText = (thread.status || '').replace(/-/g, ' ');
            statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
            output += `Titre: ${thread.title}\nLieu: ${thread.location}\nStatut: ${statusText}\n\nDescription:\n${thread.description}\n\n`;
            if (thread.events && thread.events.length > 0) { output += `Événements:\n${thread.events.map(e => `- ${e}`).join('\n')}\n`; }
            output += separator;
        });
    } else if (type === 'journal') {
        output = '=== JOURNAL DE BORD ===\n\n';
        const sortedJournal = [...gameState.journal].sort((a, b) => new Date(a.date) - new Date(b.date));
        const tempDiv = document.createElement('div');
        sortedJournal.forEach(item => {
            const date = new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            tempDiv.innerHTML = item.entry;
            output += `Date: ${date}\n${tempDiv.textContent || ""}\n${separator}`;
        });
    }
    navigator.clipboard.writeText(output).then(() => { showToast('Contenu copié dans le presse-papiers !', 'success'); })
        .catch(err => { console.error('Erreur lors de la copie : ', err); showToast('Une erreur est survenue lors de la copie.', 'error'); });
};

window.exportSingleItem = function (type, id) {
    let output = '';
    let item;
    if (type === 'npc') {
        item = gameState.npcs.find(n => n.id === id);
        if (!item) return;
        let statusText = (item.status || '').replace(/-/g, ' ');
        statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
        output += `Nom: ${item.name}\nStatut: ${statusText}\n\nDescription:\n${item.description}\n\n`;
        if (item.faitsMarquants && item.faitsMarquants.trim() !== '') output += `Faits marquants:\n${item.faitsMarquants}\n`;
    } else if (type === 'thread') {
        item = gameState.threads.find(t => t.id === id);
        if (!item) return;
        let statusText = (item.status || '').replace(/-/g, ' ');
        statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
        output += `Titre: ${item.title}\nLieu: ${item.location}\nStatut: ${statusText}\n\nDescription:\n${item.description}\n\n`;
        if (item.events && item.events.length > 0) output += `Événements:\n${item.events.map(e => `- ${e}`).join('\n')}\n`;
    }
    navigator.clipboard.writeText(output.trim()).then(() => { showToast('Informations copiées dans le presse-papiers !', 'success'); })
        .catch(err => { console.error('Erreur :', err); showToast('Erreur de copie.', 'error'); });
};

let currentJournalEditId = null;
let autoSaveJournalInterval = null;

window.openModal = function (type, id = null) {
    const modalForm = document.getElementById('modal-form');
    const modalTitle = document.getElementById('modal-title');
    const npcFields = document.getElementById('npc-fields');
    const threadFields = document.getElementById('thread-fields');
    const journalFields = document.getElementById('journal-fields');
    const editIdInput = document.getElementById('edit-id');
    const editTypeInput = document.getElementById('edit-type');
    const modalOverlay = document.getElementById('modal-overlay');

    modalForm.reset();
    editTypeInput.value = type;
    currentJournalEditId = id;

    npcFields.style.display = 'none';
    threadFields.style.display = 'none';
    journalFields.style.display = 'none';

    let editor = null;
    if (typeof tinymce !== 'undefined') editor = tinymce.get('journal-entry-text');

    if (type === 'npc') {
        npcFields.style.display = 'grid';
        if (editor) editor.mode.set('readonly');
        if (id) {
            modalTitle.textContent = 'Modifier le PNJ';
            const npc = gameState.npcs.find(n => n.id === id);
            document.getElementById('npc-name').value = npc.name;
            document.getElementById('npc-status').value = npc.status || '';
            document.getElementById('npc-description').value = npc.description || '';
            document.getElementById('npc-faits').value = npc.faitsMarquants || '';

            // Si le npc a une image, on l'affiche ou sinon rien
            const imgField = document.getElementById('npc-img');
            if (imgField) imgField.value = npc.img || '';

            editIdInput.value = id;
        } else {
            modalTitle.textContent = 'Ajouter un PNJ';
            editIdInput.value = '';
            const imgField = document.getElementById('npc-img');
            if (imgField) imgField.value = '';
        }
    } else if (type === 'thread') {
        threadFields.style.display = 'grid';
        if (editor) editor.mode.set('readonly');
        if (id) {
            modalTitle.textContent = 'Modifier le Thread';
            const thread = gameState.threads.find(t => t.id === id);
            document.getElementById('thread-title').value = thread.title || '';
            document.getElementById('thread-location').value = thread.location || '';
            document.getElementById('thread-status').value = thread.status || '';
            document.getElementById('thread-description').value = thread.description || '';

            const imgField = document.getElementById('thread-img');
            if (imgField) imgField.value = thread.img || '';

            editIdInput.value = id;
        } else {
            modalTitle.textContent = 'Ajouter un Thread';
            editIdInput.value = '';
            const imgField = document.getElementById('thread-img');
            if (imgField) imgField.value = '';
        }
    } else if (type === 'campaign') {
        const campaignFields = document.getElementById('campaign-fields');
        if (campaignFields) campaignFields.style.display = 'grid';
        modalTitle.textContent = 'Nouvelle Aventure';
        if (editor) editor.mode.set('readonly');
        document.getElementById('campaign-name').value = '';
        editIdInput.value = '';
    } else if (type === 'journal') {
        if (isMobile()) modalOverlay.classList.add('journal-mobile-mode');
        else modalOverlay.classList.remove('journal-mobile-mode');

        if (autoSaveJournalInterval) clearInterval(autoSaveJournalInterval);
        autoSaveJournalInterval = setInterval(async () => {
            if (typeof tinymce !== 'undefined') {
                const editor = tinymce.get('journal-entry-text');
                const newContent = editor.getContent();
                await saveJournalEntry(newContent);

                // Feedback visuel
                const indicator = document.getElementById('autosave-indicator');
                if (indicator) {
                    indicator.textContent = 'Sauvegardé...';
                    indicator.classList.add('visible');
                    setTimeout(() => {
                        indicator.classList.remove('visible');
                    }, 2000);
                }
            }
        }, 300000); // 5 minutes instead of 30 seconds

        journalFields.style.display = 'grid';
        const item = id ? gameState.journal.find(j => j.id === id) : null;
        const initialContent = item ? item.entry : '';
        document.getElementById('journal-entry-text').value = initialContent;

        if (id) {
            modalTitle.textContent = 'Modifier l\'entrée';
            document.getElementById('journal-date').value = item.date;
            editIdInput.value = id;
        } else {
            modalTitle.textContent = 'Nouvelle entrée';
            let newEntryDate = new Date();
            if (gameState.journal && gameState.journal.length > 0) {
                const allDates = gameState.journal.map(entry => {
                    const [year, month, day] = entry.date.split('-').map(Number);
                    return new Date(year, month - 1, day);
                });
                const latestDate = new Date(Math.max.apply(null, allDates));
                latestDate.setDate(latestDate.getDate() + 1);
                newEntryDate = latestDate;
            }
            document.getElementById('journal-date').value = newEntryDate.toISOString().split('T')[0];
            editIdInput.value = '';
        }

        if (editor) {
            editor.mode.set('design');
            editor.setContent(initialContent);

            // Placer le curseur à la fin après le chargement du contenu
            editor.focus();
            editor.selection.select(editor.getBody(), true);
            editor.selection.collapse(false);
            editor.selection.scrollIntoView();
        }
    }
    modalOverlay.classList.add('active');
};

window.closeModal = function () {
    if (autoSaveJournalInterval) {
        clearInterval(autoSaveJournalInterval);
        autoSaveJournalInterval = null;
    }
    if (typeof tinymce !== 'undefined') {
        const editor = tinymce.get('journal-entry-text');
        if (editor) editor.setContent('');
    }
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) modalOverlay.classList.remove('active');
    document.body.classList.remove('mobile-editor-active');
};

window.deleteItem = async function (type, id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
        if (type === 'npc') { gameState.npcs = gameState.npcs.filter(npc => npc.id !== id); }
        else if (type === 'thread') { gameState.threads = gameState.threads.filter(thread => thread.id !== id); }
        else if (type === 'journal') { gameState.journal = gameState.journal.filter(j => j.id !== id); }
        await saveGameData();
        renderAll();
    }
};


document.addEventListener('DOMContentLoaded', () => {

    // Attach Event Listeners for global UI
    const addNpcBtn = document.getElementById('add-npc-button');
    if (addNpcBtn) addNpcBtn.addEventListener('click', () => openModal('npc'));
    const addThreadBtn = document.getElementById('add-thread-button');
    if (addThreadBtn) addThreadBtn.addEventListener('click', () => openModal('thread'));
    const addJournalBtn = document.getElementById('add-journal-button');
    if (addJournalBtn) addJournalBtn.addEventListener('click', () => openModal('journal'));

    const closeModalBtn = document.getElementById('modal-close-button');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    const exportChar = document.getElementById('export-character-button');
    if (exportChar) exportChar.addEventListener('click', () => exportSectionToClipboard('character'));
    const exportNpcs = document.getElementById('export-npcs-button');
    if (exportNpcs) exportNpcs.addEventListener('click', () => exportSectionToClipboard('npcs'));
    const exportThreads = document.getElementById('export-threads-button');
    if (exportThreads) exportThreads.addEventListener('click', () => exportSectionToClipboard('threads'));
    const exportJourn = document.getElementById('export-journal-button');
    if (exportJourn) exportJourn.addEventListener('click', () => exportSectionToClipboard('journal'));

    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    const modalForm = document.getElementById('modal-form');
    if (modalForm) {
        modalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editIdInput = document.getElementById('edit-id');
            const editTypeInput = document.getElementById('edit-type');
            const id = editIdInput.value ? parseInt(editIdInput.value) : null;
            const type = editTypeInput.value;

            if (type === 'npc') {
                const npcData = {
                    name: document.getElementById('npc-name').value,
                    status: document.getElementById('npc-status').value,
                    description: document.getElementById('npc-description').value,
                    faitsMarquants: document.getElementById('npc-faits').value,
                    img: (document.getElementById('npc-img') ? document.getElementById('npc-img').value : "")
                };

                if (id) {
                    const index = gameState.npcs.findIndex(n => n.id === id);
                    gameState.npcs[index] = { ...gameState.npcs[index], ...npcData };
                } else {
                    npcData.id = Date.now();
                    if (!npcData.faitsMarquants) npcData.faitsMarquants = "";
                    gameState.npcs.unshift(npcData);
                }
            } else if (type === 'thread') {
                const threadData = {
                    title: document.getElementById('thread-title').value,
                    location: document.getElementById('thread-location').value,
                    status: document.getElementById('thread-status').value,
                    description: document.getElementById('thread-description').value,
                    img: (document.getElementById('thread-img') ? document.getElementById('thread-img').value : "")
                };
                if (id) {
                    const index = gameState.threads.findIndex(t => t.id === id);
                    gameState.threads[index] = { ...gameState.threads[index], ...threadData };
                } else {
                    threadData.id = Date.now();
                    threadData.events = [];
                    gameState.threads.unshift(threadData);
                }
            } else if (type === 'journal') {
                if (typeof tinymce !== 'undefined') {
                    const newContent = tinymce.get('journal-entry-text').getContent();
                    await saveJournalEntry(newContent);
                }
            } else if (type === 'campaign') {
                const name = document.getElementById('campaign-name').value;
                if (name && name.trim()) {
                    createNewCampaign(name.trim());
                    showToast('Nouvelle campagne créée !', 'success');
                    return; // createNewCampaign loads a new session
                } else {
                    showToast('Veuillez entrer un nom pour votre campagne.', 'warning');
                    return;
                }
            }

            if (type !== 'journal') await saveGameData(); // journal already saved
            renderAll();
            closeModal();
        });
    }
    const mobileEditorSaveBtn = document.getElementById('mobile-editor-save-btn');
    if (mobileEditorSaveBtn) {
        mobileEditorSaveBtn.addEventListener('click', async () => {
            if (typeof tinymce !== 'undefined') {
                const newContent = tinymce.get('journal-entry-text').getContent();
                await saveJournalEntry(newContent);
            }
            closeModal();
        });
    }

    window.initCampaignBubbles = function () {
        const container = document.getElementById('campaign-bubbles');
        if (!container) return;

        container.innerHTML = '';
        campaignsList.forEach(c => {
            const bubble = document.createElement('div');
            bubble.className = 'campaign-bubble';
            if (c.id === currentSaveId) bubble.classList.add('active');

            // Background image (portrait or default)
            const portraitUrl = c.portrait || 'images/placeholder_npc.png';
            bubble.style.backgroundImage = `url('${portraitUrl}')`;
            bubble.setAttribute('data-name', c.name);

            bubble.onclick = () => {
                if (c.id !== currentSaveId) switchCampaign(c.id);
            };

            container.appendChild(bubble);
        });
    };

    window.handleCharacterPortraitUpload = async function (input) {
        if (!input.files || !input.files[0]) return;
        const base64 = await handleImageUpload(input, 'character-portrait-display'); // Generic tool
        if (base64) {
            gameState.character.portrait = base64;
            document.getElementById('character-portrait-display').style.backgroundImage = `url('${base64}')`;
            await saveGameData();
            initCampaignBubbles(); // Refresh bubbles too
        }
    };

    window.toggleNewCampaignPopover = function () {
        const popover = document.getElementById('new-campaign-popover');
        if (popover) {
            popover.classList.toggle('active');
            if (popover.classList.contains('active')) {
                document.getElementById('inline-campaign-name').focus();
            }
        }
    };

    window.executeInlineCreate = function () {
        const input = document.getElementById('inline-campaign-name');
        if (!input) return;
        const name = input.value.trim();
        if (name) {
            window.createNewCampaign(name);
            input.value = '';
            document.getElementById('new-campaign-popover').classList.remove('active');
        } else {
            showToast('Veuillez entrer un nom pour votre campagne.', 'warning');
        }
    };

    async function initializeApp() {
        let data = await loadGameData();
        if (!data) {
            console.log("Aucune sauvegarde trouvée. Initialisation avec les données par défaut.");
            gameState = defaultState;
            await saveGameData();
            data = gameState;
        }

        gameState = data;

        for (const key in defaultState) {
            if (!gameState[key]) gameState[key] = defaultState[key];
        }

        if (!gameState.character.identityFields) gameState.character.identityFields = defaultState.character.identityFields;
        if (!gameState.character.history) gameState.character.history = defaultState.character.history;

        // Migration banjoMelodies -> specificKnowledge
        if (gameState.character.banjoMelodies) {
            if (!gameState.character.specificKnowledge) {
                gameState.character.specificKnowledge = gameState.character.banjoMelodies;
            }
            delete gameState.character.banjoMelodies;
            await saveGameData();
        }

        initCampaignBubbles();

        // Update character portrait from state
        const portraitDisplay = document.getElementById('character-portrait-display');
        if (portraitDisplay) {
            portraitDisplay.style.backgroundImage = `url('${gameState.character.portrait || 'images/placeholder_npc.png'}')`;
        }

        const moneyInput = document.getElementById('character-money');
        if (moneyInput && gameState.character && gameState.character.money !== undefined) {
            moneyInput.value = parseFloat(gameState.character.money).toFixed(2);
        }
        renderAll();
        // Fallback or explicit call to character section load
        const charBtn = document.querySelector(`.nav-button[onclick="showSection('character')"]`);
        if (charBtn) showSection('character');
    }

    // AUTH STARTUP
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Connecté avec l'id :", user.uid);
            initializeApp();
        } else {
            console.log("Utilisateur non authentifié.");
        }
    });

    auth.signInAnonymously().catch((error) => {
        console.error("Erreur d'authentification anonyme", error);
        showToast("Impossible de démarrer la session d'authentification.", 'error');
    });
});
