document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('journal-entry-text')) {
        tinymce.init({
            selector: '#journal-entry-text',
            license_key: 'gpl',
            plugins: 'lists link image table code help wordcount fullscreen quickbars',
            toolbar: 'bold italic underline | blocks | jet oracle gallery | link image | alignleft aligncenter alignright | fullscreen',
            quickbars_selection_toolbar: 'bold italic | jet oracle gallery',
            quickbars_insert_toolbar: false,
            language: 'fr_FR',
            menubar: false,
            skin: 'oxide-dark',
            // content_css: 'dark',
            content_style: `
                body { 
                    background-color: #191922; 
                    color: #E2E8F0;
                    font-family: 'Lora', serif;
                    font-size: 1.1em; 
                    line-height: 1.7; 
                }
                img { 
                    max-width: 90%; 
                    height: auto; 
                    display: block; 
                    margin: 25px auto; 
                    border: 1px solid #3f3f4e; 
                    padding: 6px;
                    background: #1e1e2a;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                    border-radius: 4px;
                }
                p { margin-bottom: 1em; }
                h1, h2, h3 { color: #E2E8F0; font-family: 'Merriweather', serif; }
                a { color: #F59E0B; }
                .jet-result { font-weight: bold; color: #F59E0B; }
                .oracle-result { font-weight: bold; }
            `,
            setup: (editor) => {
                editor.on('init', () => {
                    editor.focus();
                    editor.selection.select(editor.getBody(), true);
                    editor.selection.collapse(false);
                    editor.selection.scrollIntoView();
                });
                registerCustomTinyMCEButtons(editor);
            }
        });
    }

    const journalSearch = document.getElementById('journal-search');
    if (journalSearch) {
        journalSearch.addEventListener('input', () => {
            renderJournal();
        });
    }
});

function registerCustomTinyMCEButtons(editor) {
    editor.ui.registry.addButton('jet', {
        text: '🎲 Jet',
        onAction: () => {
            const char = gameState.character;
            if (!char) {
                showToast("Aucun personnage chargé.", 'error');
                return;
            }
            const stats = (char.stats || []).map(s => ({ text: `Stat: ${s.name} (${s.value})`, value: `${s.name}|${s.value}` }));
            const skills = (char.skills || []).map(s => ({ text: `Skill: ${s.name} (${s.value})`, value: `${s.name}|${s.value}` }));
            const openDialog = (currentValueList, currentType) => {
                editor.windowManager.open({
                    title: 'Lancer un dé (1D100)',
                    body: {
                        type: 'panel',
                        items: [
                            { type: 'selectbox', name: 'typeSelection', label: 'Catégorie', items: [{ text: 'Statistiques', value: 'stats' }, { text: 'Compétences', value: 'skills' }] },
                            { type: 'selectbox', name: 'targetSelection', label: 'Cible', items: currentValueList }
                        ]
                    },
                    initialData: { typeSelection: currentType },
                    buttons: [{ type: 'cancel', text: 'Annuler' }, { type: 'submit', text: 'Lancer !', primary: true }],
                    onChange: (api, details) => {
                        if (details.name === 'typeSelection') {
                            const newType = api.getData().typeSelection;
                            api.close();
                            openDialog(newType === 'stats' ? stats : skills, newType);
                        }
                    },
                    onSubmit: (api) => {
                        const data = api.getData();
                        const [name, value] = data.targetSelection.split('|');
                        const targetValue = parseInt(value);
                        const roll = Math.floor(Math.random() * 100) + 1;
                        let resultText = (roll <= 5) ? "Réussite Critique !" : (roll >= 95) ? "Échec Critique !" : (roll <= targetValue) ? "Réussite." : "Échec.";
                        const output = `<p><span class="jet-result">Jet de ${name} : ${roll}/${targetValue}. ${resultText}</span></p><p>&nbsp;</p>`;
                        editor.insertContent(output);
                        api.close();
                    }
                });
            };
            openDialog(stats, 'stats');
        }
    });

    editor.ui.registry.addButton('gallery', {
        icon: 'image',
        tooltip: 'Insérer une image de la bibliothèque',
        onAction: () => {
            if (typeof openImagePicker === 'function') {
                openImagePicker((path) => {
                    editor.insertContent(`<img src="${path}" alt="Image RPG">`);
                });
            }
        }
    });

    editor.ui.registry.addButton('oracle', {
        text: '🔮 Oracle',
        tooltip: 'Poser une question au destin (Mythic Oracle)',
        onAction: () => {
            const oddsList = [
                { text: 'Impossible (10%)', value: '10|Impossible' },
                { text: 'Peu probable (15%)', value: '15|No way' },
                { text: 'Très improbable (25%)', value: '25|Very unlikely' },
                { text: 'Improbable (35%)', value: '35|Unlikely' },
                { text: '50/50 (50%)', value: '50|50/50' },
                { text: 'Plutôt probable (65%)', value: '65|Somewhat likely' },
                { text: 'Probable (75%)', value: '75|Likely' },
                { text: 'Très probable (85%)', value: '85|Very likely' },
                { text: 'Quasi certain (90%)', value: '90|Near sure thing' },
                { text: 'Sûr (95%)', value: '95|A sure thing' },
                { text: 'Certain (99%)', value: '99|Has to be' }
            ];
            editor.windowManager.open({
                title: 'Consulter l\'Oracle',
                body: { type: 'panel', items: [{ type: 'selectbox', name: 'odds', label: 'Probabilité de "Oui"', items: oddsList }] },
                initialData: { odds: '50|50/50' },
                buttons: [{ type: 'cancel', text: 'Annuler' }, { type: 'submit', text: 'Interroger', primary: true }],
                onSubmit: (api) => {
                    const data = api.getData();
                    const [chance, label] = data.odds.split('|');
                    const yesChance = parseInt(chance);
                    const roll = Math.floor(Math.random() * 100) + 1;
                    let result = "";
                    let color = "#F59E0B";
                    const exceptionalYesLimit = Math.max(1, Math.floor(yesChance / 5));
                    const exceptionalNoLimit = 100 - Math.max(0, Math.floor((100 - yesChance) / 5)) + 1;
                    if (roll <= exceptionalYesLimit) { result = "OUI EXCEPTIONNEL !"; color = "#10B981"; }
                    else if (roll <= yesChance) { result = "OUI."; }
                    else if (roll >= exceptionalNoLimit) { result = "NON EXCEPTIONNEL !"; color = "#EF4444"; }
                    else { result = "NON."; color = "#94A3B8"; }
                    const output = `<p><span class="oracle-result" style="color: ${color}; font-weight: bold;">[Oracle] ${label} (${roll}%) : ${result}</span></p><p>&nbsp;</p>`;
                    editor.insertContent(output);
                    api.close();
                }
            });
        }
    });
}

function renderJournal() {
    const journalContent = document.getElementById('journal-content');
    if (!journalContent) return;
    const query = document.getElementById('journal-search')?.value.toLowerCase() || "";
    const activeEditors = {};
    if (typeof tinymce !== 'undefined' && typeof tinymce.get === 'function') {
        const editors = tinymce.get();
        for (let i = editors.length - 1; i >= 0; i--) {
            const ed = editors[i];
            if (ed.id && ed.id.startsWith('journal-body-')) {
                activeEditors[ed.id] = ed.getContent();
                ed.remove();
            }
        }
    }
    journalContent.innerHTML = '';
    const sortedJournal = [...gameState.journal].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedJournal.forEach(item => {
        const dateObj = new Date(item.date);
        const rawDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const capitalizedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
        const dateText = rawDate.toLowerCase();
        const contentText = item.entry.toLowerCase();
        if (query && !dateText.includes(query) && !contentText.includes(query)) return;
        const bodyId = `journal-body-${item.id}`;
        const footerId = `journal-footer-${item.id}`;
        const entryDiv = document.createElement('div');
        entryDiv.className = 'journal-entry';
        entryDiv.innerHTML = `
            <div class="journal-header">
                <p class="journal-date">${capitalizedDate}</p>
                <div class="button-group">
                    ${!isReadOnly ? `
                    <button class="card-button" onclick="openImmersiveEdit('${item.id}')" title="Écriture immersive">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M511.6 79c.5-11.9-5.6-23.3-15.2-30.1C470.5 30.7 432.3 24 384 24c-129.1 0-244.3 77.2-289.4 193.3L1.9 471.7c-4.2 10.7-1.4 22.8 6.9 30.6 8.3 7.8 20.8 9.5 30.8 4.2L249.2 405C370.2 368 464 256.7 499.7 119.4c7.9-30.6 11.2-57.8 11.9-40.4zm-143 83c-15.6-15.6-15.6-40.9 0-56.6l12.3-12.3c15.6-15.6 40.9-15.6 56.6 0l-12.3 12.3c-15.6 15.6-40.9 15.6-56.6 0zM170.7 341.3c-23.6 23.6-56.4 37.3-90.8 38.6L44.4 467.6l87.7-35.5c1.3-34.4 15-67.2 38.6-90.8L350.3 161.7l-56.6-56.6L170.7 341.3z"/></svg>
                    </button>
                    <button class="card-button delete-button" onclick="deleteItem('journal', '${item.id}')" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                    </button>
                    ` : ''}
                </div>
            </div>
            <div id="${bodyId}" class="journal-content-display" 
                 onclick="if(!isReadOnly) toggleInlineEdit('${item.id}', null, event)" 
                 title="${!isReadOnly ? 'Cliquer pour modifier' : ''}" 
                 style="${!isReadOnly ? 'cursor: pointer;' : ''}">
                ${item.entry} 
            </div>
            <div id="${footerId}" class="inline-editor-footer" style="display:none;">
                <span id="word-count-${item.id}" class="inline-word-count" style="font-size: 0.85em; color: var(--text-muted); align-self: center;">0 mot</span>
                <span id="autosave-status-${item.id}" class="inline-autosave-status" style="margin-left: auto; font-size: 0.82em; color: var(--accent-color); opacity: 0; transition: opacity 0.3s ease; align-self: center; font-style: italic;">Sauvegardé...</span>
            </div>
        `;
        journalContent.appendChild(entryDiv);
        if (activeEditors[bodyId]) {
            setTimeout(() => { if (!tinymce.get(bodyId)) toggleInlineEdit(item.id, activeEditors[bodyId]); }, 0);
        }
    });
}

let inlineAutoSaveInterval = null;

async function toggleInlineEdit(id, restoreContent = null, event = null) {
    if (isReadOnly) return;
    const bodyId = `journal-body-${id}`;
    const footerId = `journal-footer-${id}`;
    const entryBody = document.getElementById(bodyId);
    const entryFooter = document.getElementById(footerId);
    if (!entryBody) return;
    if (restoreContent) entryBody.innerHTML = restoreContent;
    if (tinymce.get(bodyId)) { tinymce.get(bodyId).focus(); return; }
    tinymce.init({
        selector: `div[id="${bodyId}"]`,
        inline: true,
        license_key: 'gpl',
        plugins: 'lists link image table code quickbars',
        toolbar: 'bold italic underline | blocks | jet oracle gallery | link image | alignleft aligncenter alignright',
        quickbars_selection_toolbar: 'bold italic | jet oracle gallery',
        quickbars_insert_toolbar: false,
        menubar: false,
        skin: 'oxide-dark',
        // content_css: 'dark',
        setup: (editor) => {
            registerCustomTinyMCEButtons(editor);

            // Calcule et affiche le nombre de mots en temps réel
            const updateWordCount = () => {
                const text = editor.getContent({ format: 'text' }).trim();
                const words = text ? text.split(/\s+/).length : 0;
                const countSpan = document.getElementById(`word-count-${id}`);
                if (countSpan) {
                    countSpan.textContent = `${words} mot${words > 1 ? 's' : ''}`;
                }
            };

            editor.on('init', () => {
                editor.focus();
                
                const isDirectClick = !!event;

                if (!isDirectClick) {
                    // Si on a cliqué sur le bouton Modifier global (pas sur le texte),
                    // on place le curseur à la toute fin du texte pour continuer d'écrire
                    editor.selection.select(editor.getBody(), true);
                    editor.selection.collapse(false);
                }

                if (entryFooter) entryFooter.style.display = 'flex';
                updateWordCount();

                if (!isDirectClick) {
                    // Défilement automatique fluide uniquement si on n'a pas cliqué directement sur le texte
                    setTimeout(() => {
                        entryBody.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }, 100);
                }

                if (inlineAutoSaveInterval) clearInterval(inlineAutoSaveInterval);
                inlineAutoSaveInterval = setInterval(async () => {
                    const content = editor.getContent();
                    const index = gameState.journal.findIndex(j => String(j.id) === String(id));
                    if (index > -1 && content !== gameState.journal[index].entry) {
                        gameState.journal[index].entry = content;
                        await savePartialData('journal', gameState.journal);

                        // Signal de sauvegarde discret
                        const statusSpan = document.getElementById(`autosave-status-${id}`);
                        if (statusSpan) {
                            statusSpan.style.opacity = '1';
                            setTimeout(() => { statusSpan.style.opacity = '0'; }, 2000);
                        }
                    }
                }, 300000); // Sauvegarde automatique toutes les 5 minutes pour préserver les quotas Firebase
            });

            // Raccourcis clavier (Ctrl+S / Échap)
            editor.addShortcut('meta+s', 'Save entry', () => {
                saveInlineEdit(id);
            });
            editor.addShortcut('esc', 'Cancel edit', () => {
                const content = editor.getContent();
                const index = gameState.journal.findIndex(j => String(j.id) === String(id));
                if (index > -1 && content !== gameState.journal[index].entry) {
                    if (confirm("Annuler les modifications en cours ? Toutes vos modifications non enregistrées seront perdues.")) {
                        cancelInlineEdit(id);
                    }
                } else {
                    cancelInlineEdit(id);
                }
            });

            // Écouteur de modifications de texte pour le compteur de mots
            editor.on('input NodeChange KeyUp', updateWordCount);

            editor.on('remove', () => { if (inlineAutoSaveInterval) { clearInterval(inlineAutoSaveInterval); inlineAutoSaveInterval = null; } });
            editor.on('blur', () => { setTimeout(() => { const activeEditor = tinymce.get(bodyId); if (activeEditor && !activeEditor.hasFocus()) saveInlineEdit(id); }, 200); });
        }
    });
}
window.toggleInlineEdit = toggleInlineEdit;

window.addInlineJournalEntry = async function () {
    if (isReadOnly) return;
    const newId = Date.now();
    let newDate = new Date().toISOString().split('T')[0];
    if (gameState.journal.length > 0) {
        const sorted = [...gameState.journal].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = new Date(sorted[0].date);
        latest.setDate(latest.getDate() + 1);
        newDate = latest.toISOString().split('T')[0];
    }
    const newEntry = { id: newId, date: newDate, entry: "<p>Écrire la suite de l'aventure...</p>" };
    gameState.journal.unshift(newEntry);
    await savePartialData('journal', gameState.journal);
    renderJournal();
    setTimeout(() => openImmersiveEdit(newId), 150);
};

const isSavingInline = new Set();
window.saveInlineEdit = async function (id) {
    if (isSavingInline.has(id)) return;
    const bodyId = `journal-body-${id}`;
    const editor = tinymce.get(bodyId);
    if (editor) {
        isSavingInline.add(id);
        try {
            const newContent = editor.getContent();
            const index = gameState.journal.findIndex(j => String(j.id) === String(id));
            if (index > -1) {
                gameState.journal[index].entry = newContent;
                await savePartialData('journal', gameState.journal);
            }
            editor.remove();
            renderJournal();
        } finally { isSavingInline.delete(id); }
    }
};
window.cancelInlineEdit = function (id) {
    const bodyId = `journal-body-${id}`;
    const editor = tinymce.get(bodyId);
    if (editor) { editor.destroy(); renderJournal(); }
};

let immersiveEditId = null;
let immersiveAutoSaveInterval = null;
let immersiveLastContent = "";
const isSavingImmersive = { value: false };

async function openImmersiveEdit(id) {
    if (isReadOnly) return;
    
    const entryIndex = gameState.journal.findIndex(j => String(j.id) === String(id));
    if (entryIndex === -1) return;
    const entry = gameState.journal[entryIndex];
    immersiveEditId = id;
    immersiveLastContent = entry.entry;

    const overlay = document.getElementById('immersive-writing-overlay');
    const dateSpan = document.getElementById('immersive-writing-date');
    const editorDiv = document.getElementById('immersive-writing-editor');
    const wordCountSpan = document.getElementById('immersive-writing-word-count');
    const saveStatusSpan = document.getElementById('immersive-writing-save-status');

    if (!overlay || !editorDiv) return;

    // Formater la date en français
    const dateObj = new Date(entry.date);
    const rawDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const capitalizedDate = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
    if (dateSpan) dateSpan.textContent = capitalizedDate;

    // Charger le contenu existant
    editorDiv.innerHTML = entry.entry;

    // Afficher l'overlay et désactiver le défilement du body principal
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Helper pour compter les mots
    const getWordsCount = (text) => {
        const words = text.trim().split(/\s+/);
        return words[0] === "" ? 0 : words.length;
    };

    const updateWordCount = (editor) => {
        const text = editor.getContent({ format: 'text' });
        const count = getWordsCount(text);
        if (wordCountSpan) {
            wordCountSpan.textContent = `${count} mot${count > 1 ? 's' : ''}`;
        }
    };

    // Initialiser TinyMCE sur la div éditable
    tinymce.init({
        selector: '#immersive-writing-editor',
        inline: true,
        license_key: 'gpl',
        plugins: 'lists link image table code quickbars wordcount',
        toolbar: false, // Désactive la barre principale pour forcer l'affichage de la barre de sélection
        quickbars_selection_toolbar: 'bold italic | jet oracle gallery',
        quickbars_insert_toolbar: false,
        menubar: false,
        skin: 'oxide-dark',
        setup: (editor) => {
            registerCustomTinyMCEButtons(editor);

            editor.on('init', () => {
                editor.focus();
                
                // Placer le curseur à la fin
                editor.selection.select(editor.getBody(), true);
                editor.selection.collapse(false);
                
                // Faire défiler le conteneur jusqu'en bas pour afficher la fin du texte
                const scrollContainer = document.querySelector('.immersive-writing-editor-container');
                if (scrollContainer) {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                }
                
                updateWordCount(editor);
                if (saveStatusSpan) {
                    saveStatusSpan.textContent = "Tous les changements enregistrés";
                }

                // Recentrer verticalement le curseur après l'affichage initial
                setTimeout(() => {
                    alignCursorTypewriter(true);
                }, 50);
            });

            // Mettre à jour le compteur de mots à chaque frappe
            editor.on('input NodeChange KeyUp', () => {
                updateWordCount(editor);
            });

            // Logique de défilement Typewriter (Machine à écrire)
            const alignCursorTypewriter = (forceInstant = false) => {
                const scrollContainer = document.querySelector('.immersive-writing-editor-container');
                if (!scrollContainer) return;

                try {
                    const range = editor.selection.getRng();
                    if (!range) return;

                    let rect = null;
                    const rects = range.getClientRects();
                    if (rects && rects.length > 0) {
                        rect = rects[0];
                    } else {
                        const marker = editor.dom.create('span', { id: 'typewriter-marker' }, '&#x200b;');
                        range.insertNode(marker);
                        rect = marker.getBoundingClientRect();
                        editor.dom.remove(marker);
                    }

                    if (rect && rect.top > 0) {
                        const viewportHeight = window.innerHeight;
                        const targetY = viewportHeight / 2;
                        const diff = rect.top - targetY;

                        // Zone de confort : entre 25% et 75% de la hauteur de l'écran
                        const isOutsideComfortZone = rect.top < (viewportHeight * 0.25) || rect.top > (viewportHeight * 0.75);

                        if (forceInstant) {
                            // Défilement instantané pendant la frappe active pour éviter les latences
                            if (Math.abs(diff) > 5) {
                                scrollContainer.scrollTop += diff;
                            }
                        } else if (isOutsideComfortZone) {
                            // Défilement fluide lors des déplacements de curseur / clics en dehors de la zone confortable
                            scrollContainer.scrollBy({
                                top: diff,
                                behavior: 'smooth'
                            });
                        }
                    }
                } catch (e) {
                    console.error("Typewriter scrolling error:", e);
                }
            };

            // Recentrer sur écriture active
            editor.on('input', () => {
                alignCursorTypewriter(true);
            });

            // Recentrer au clavier
            editor.on('keyup', (e) => {
                if (e.key === 'Enter') {
                    setTimeout(() => alignCursorTypewriter(true), 10);
                } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
                    alignCursorTypewriter(false);
                }
            });

            // Recentrer au clic
            editor.on('click', () => {
                alignCursorTypewriter(false);
            });

            // Diagnostic de sélection et d'affichage de la quickbar
            editor.on('selectionchange', () => {
                const selectionText = editor.selection.getContent({ format: 'text' }).trim();
                console.log("[Diagnostic Immersif] selectionchange. Texte sélectionné : '" + selectionText + "'");
                
                // Inspecter les conteneurs flottants de TinyMCE
                const floaters = document.querySelectorAll('.tox-tinymce-inline');
                console.log("[Diagnostic Immersif] Nombre de conteneurs flottants TinyMCE (.tox-tinymce-inline) dans le DOM :", floaters.length);
                floaters.forEach((el, index) => {
                    const styles = window.getComputedStyle(el);
                    console.log(`  - Conteneur #${index}: display="${styles.display}", visibility="${styles.visibility}", opacity="${styles.opacity}", z-index="${styles.zIndex}", classList="${[...el.classList].join(' ')}", innerHTML_has_quickbar=${el.querySelector('.tox-quickbar') !== null}`);
                });
            });

            // Raccourcis clavier TinyMCE
            editor.addShortcut('meta+s', 'Save entry', () => {
                saveImmersiveEdit(true);
            });

            editor.on('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeImmersiveEdit();
                }
            });
        }
    });

    // Lancer la sauvegarde automatique toutes les 3 minutes (180 000 ms)
    if (immersiveAutoSaveInterval) clearInterval(immersiveAutoSaveInterval);
    immersiveAutoSaveInterval = setInterval(async () => {
        await saveImmersiveEdit(false);
    }, 180000);
}
window.openImmersiveEdit = openImmersiveEdit;

async function saveImmersiveEdit(isManual = false) {
    if (isSavingImmersive.value || !immersiveEditId) return;
    const editor = tinymce.get('immersive-writing-editor');
    if (!editor) return;

    const content = editor.getContent();
    
    // Éviter l'écriture inutile si aucun changement n'a été fait
    if (content === immersiveLastContent) {
        if (isManual) {
            const saveStatusSpan = document.getElementById('immersive-writing-save-status');
            if (saveStatusSpan) {
                saveStatusSpan.textContent = "Tous les changements enregistrés (aucun changement)";
                setTimeout(() => {
                    if (immersiveEditId && saveStatusSpan.textContent.includes("aucun changement")) {
                        saveStatusSpan.textContent = "Tous les changements enregistrés";
                    }
                }, 3000);
            }
        }
        return;
    }

    isSavingImmersive.value = true;
    const saveStatusSpan = document.getElementById('immersive-writing-save-status');
    if (saveStatusSpan) {
        saveStatusSpan.textContent = isManual ? "Enregistrement..." : "Enregistrement automatique...";
    }

    try {
        const index = gameState.journal.findIndex(j => String(j.id) === String(immersiveEditId));
        if (index > -1) {
            gameState.journal[index].entry = content;
            await savePartialData('journal', gameState.journal);
            immersiveLastContent = content;
            if (saveStatusSpan) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                saveStatusSpan.textContent = `Enregistré à ${timeStr}`;
            }
        }
    } catch (err) {
        console.error("Erreur de sauvegarde immersive :", err);
        if (saveStatusSpan) {
            saveStatusSpan.textContent = "Erreur de sauvegarde !";
        }
    } finally {
        isSavingImmersive.value = false;
    }
}
window.saveImmersiveEdit = saveImmersiveEdit;

async function closeImmersiveEdit() {
    if (!immersiveEditId) return;

    // Arrêter le minuteur d'autosave
    if (immersiveAutoSaveInterval) {
        clearInterval(immersiveAutoSaveInterval);
        immersiveAutoSaveInterval = null;
    }

    // Sauvegarde finale systématique
    await saveImmersiveEdit(true);

    // Détruire l'instance TinyMCE
    const editor = tinymce.get('immersive-writing-editor');
    if (editor) {
        editor.remove();
    }

    // Cacher l'overlay et réactiver le scroll
    const overlay = document.getElementById('immersive-writing-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    document.body.style.overflow = '';

    // Nettoyer les états
    immersiveEditId = null;
    immersiveLastContent = "";

    // Rafraîchir l'affichage du journal principal
    renderJournal();
}
window.closeImmersiveEdit = closeImmersiveEdit;

async function saveJournalEntry(newContent) {
    const id = currentJournalEditId;
    const journalData = { date: (id ? gameState.journal.find(j => String(j.id) === String(id)).date : document.getElementById('journal-date').value), entry: newContent };
    if (id) {
        const index = gameState.journal.findIndex(j => String(j.id) === String(id));
        gameState.journal[index] = { ...gameState.journal[index], ...journalData };
    } else { journalData.id = Date.now(); gameState.journal.push(journalData); }
    await savePartialData('journal', gameState.journal);
    renderJournal();
}

// Mode lecture
document.addEventListener('DOMContentLoaded', () => {
    const readingModeOverlay = document.getElementById('reading-mode-overlay');
    const openReadingModeBtn = document.getElementById('reading-mode-button');
    const closeReadingModeBtn = document.getElementById('reading-mode-close-button');
    const bookContainer = document.getElementById('book-container');
    const pageCounterDisplay = document.getElementById('page-counter-display');
    const pageJumper = document.getElementById('page-jumper');
    const pageJumpInput = document.getElementById('page-jump-input');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');

    let currentJournalIndex = 0;
    let sortedJournal = [];
    let isPageAnimating = false;

    if (!readingModeOverlay) return;

    function displayJournalPage(index, direction = '') {
        if (isPageAnimating && direction) return;
        if (direction) isPageAnimating = true;

        currentJournalIndex = index;
        const totalPages = sortedJournal.length;
        if (totalPages === 0) return;

        const item = sortedJournal[index];
        const rawDate = new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

        const newBookContent = document.createElement('div');
        newBookContent.className = 'book-content';

        const article = document.createElement('article');
        article.className = 'journal-entry';
        article.innerHTML = `
            <div class="journal-header"><p class="journal-date">${date}</p></div>
            <div class="journal-content-display">${item.entry}</div>
        `;
        newBookContent.appendChild(article);

        pageCounterDisplay.textContent = `Page ${index + 1} / ${totalPages}`;
        prevPageBtn.disabled = (index === 0);
        nextPageBtn.disabled = (index === totalPages - 1);

        const progressBar = document.getElementById('reading-progress-bar');
        if (progressBar) {
            const progress = ((index + 1) / totalPages) * 100;
            progressBar.style.width = `${progress}%`;
        }

        const currentContent = bookContainer.querySelector('.book-content');
        if (direction && currentContent) {
            const exitAnimation = direction === 'next' ? 'page-exit-left' : 'page-exit-right';
            const enterAnimation = direction === 'next' ? 'page-enter-right' : 'page-enter-left';

            newBookContent.classList.add('animating', enterAnimation);
            currentContent.classList.add('animating', exitAnimation);
            bookContainer.appendChild(newBookContent);

            const onAnimationEnd = (e) => {
                if (e.target === newBookContent) {
                    if (currentContent.parentNode === bookContainer) {
                        currentContent.remove();
                    }
                    newBookContent.classList.remove('animating', enterAnimation);
                    newBookContent.removeEventListener('animationend', onAnimationEnd);
                    isPageAnimating = false;
                }
            };
            newBookContent.addEventListener('animationend', onAnimationEnd);

            setTimeout(() => {
                if (isPageAnimating) {
                    if (currentContent.parentNode === bookContainer) currentContent.remove();
                    newBookContent.classList.remove('animating', enterAnimation);
                    isPageAnimating = false;
                }
            }, 600);
        } else {
            bookContainer.innerHTML = '';
            bookContainer.appendChild(newBookContent);
            isPageAnimating = false;
        }

        if (currentSaveId) localStorage.setItem(`oregon_journal_bookmark_${currentSaveId}`, index);
        if (window.umami && typeof umami.track === 'function' && item) {
            umami.track('Lecture Entrée', { date: item.date, index: index + 1 });
        }
    }

    window.openReadingMode = function () {
        sortedJournal = [...gameState.journal].sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortedJournal.length > 0) {
            let startIndex = 0;
            const bookmark = localStorage.getItem(`oregon_journal_bookmark_${currentSaveId}`);
            if (bookmark !== null) {
                startIndex = parseInt(bookmark, 10);
                if (startIndex >= sortedJournal.length) startIndex = 0;
            }
            displayJournalPage(startIndex);
            readingModeOverlay.classList.add('active');
        } else { showToast("Le journal est vide.", 'info'); }
    };

    function closeReadingMode() { readingModeOverlay.classList.remove('active'); }
    if (openReadingModeBtn) openReadingModeBtn.addEventListener('click', openReadingMode);
    if (closeReadingModeBtn) closeReadingModeBtn.addEventListener('click', closeReadingMode);
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => { if (currentJournalIndex < sortedJournal.length - 1) displayJournalPage(currentJournalIndex + 1, 'next'); });
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentJournalIndex > 0) displayJournalPage(currentJournalIndex - 1, 'prev'); });
    if (pageJumper) pageJumper.addEventListener('click', () => { pageCounterDisplay.style.display = 'none'; pageJumpInput.style.display = 'inline-block'; pageJumpInput.value = currentJournalIndex + 1; pageJumpInput.focus(); pageJumpInput.select(); });
    function handlePageJump() {
        pageCounterDisplay.style.display = 'inline-block'; pageJumpInput.style.display = 'none';
        let targetPage = parseInt(pageJumpInput.value, 10);
        if (isNaN(targetPage) || targetPage < 1 || targetPage > sortedJournal.length) return;
        const newIndex = targetPage - 1;
        if (newIndex !== currentJournalIndex) displayJournalPage(newIndex, newIndex > currentJournalIndex ? 'next' : 'prev');
    }
    if (pageJumpInput) { pageJumpInput.addEventListener('blur', handlePageJump); pageJumpInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') handlePageJump(); }); }

    const quickViewModal = document.getElementById('quick-view-modal');
    const quickViewTitle = document.getElementById('quick-view-title');
    const quickViewContent = document.getElementById('quick-view-content');
    const quickViewCloseBtn = document.getElementById('quick-view-close-button');
    window.openQuickView = function (type) {
        quickViewContent.innerHTML = '';
        if (type === 'character') {
            quickViewTitle.textContent = 'Fiche de Personnage';
            const characterSheetContent = document.getElementById('character').cloneNode(true);
            characterSheetContent.classList.add('active');
            quickViewContent.appendChild(characterSheetContent);
        } else if (type === 'tables') {
            quickViewTitle.textContent = 'Tables Aléatoires';
            const tablesContent = document.getElementById('tables').cloneNode(true);
            tablesContent.classList.add('active');
            quickViewContent.appendChild(tablesContent);
        }
        quickViewModal.classList.add('active');
    }
    function closeQuickView() { quickViewModal.classList.remove('active'); quickViewContent.innerHTML = ''; }
    if (quickViewCloseBtn) quickViewCloseBtn.addEventListener('click', closeQuickView);
    if (quickViewModal) makeDraggable(quickViewModal, document.getElementById('quick-view-header'));
});
