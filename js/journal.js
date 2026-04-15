document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('journal-entry-text')) {
        tinymce.init({
            selector: '#journal-entry-text',
            license_key: 'gpl',
            plugins: 'lists link image table code help wordcount fullscreen forecolor',
            toolbar: 'bold italic underline forecolor | blocks | jet oracle gallery | link image | alignleft aligncenter alignright | fullscreen',
            language: 'fr_FR',
            menubar: false,
            skin: 'oxide-dark',
            content_css: 'dark',
            content_style: `
                body { 
                    background-color: #191922; 
                    color: #E2E8F0;
                    font-family: 'Lora', serif;
                    font-size: 1.1em; 
                    line-height: 1.7; 
                }
                img { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 8px; }
                p { margin-bottom: 1em; }
                h1, h2, h3 { color: #E2E8F0; font-family: 'Merriweather', serif; }
                a { color: #F59E0B; }
                .jet-result { font-weight: bold; color: #F59E0B; }
                .oracle-result { font-weight: bold; }
            `,
            setup: (editor) => {
                // Placer le curseur à la fin après l'initialisation
                editor.on('init', () => {
                    editor.focus();
                    editor.selection.select(editor.getBody(), true);
                    editor.selection.collapse(false);
                    editor.selection.scrollIntoView();
                });

                // Bouton Jet (Stat / Compétence)
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
                                        {
                                            type: 'selectbox',
                                            name: 'typeSelection',
                                            label: 'Catégorie',
                                            items: [
                                                { text: 'Statistiques', value: 'stats' },
                                                { text: 'Compétences', value: 'skills' }
                                            ]
                                        },
                                        {
                                            type: 'selectbox',
                                            name: 'targetSelection',
                                            label: 'Cible',
                                            items: currentValueList
                                        }
                                    ]
                                },
                                initialData: {
                                    typeSelection: currentType
                                },
                                buttons: [
                                    { type: 'cancel', text: 'Annuler' },
                                    { type: 'submit', text: 'Lancer !', primary: true }
                                ],
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

                                    let resultText = "";
                                    if (roll <= 5) resultText = "Réussite Critique !";
                                    else if (roll >= 95) resultText = "Échec Critique !";
                                    else if (roll <= targetValue) resultText = "Réussite.";
                                    else resultText = "Échec.";

                                    const output = `<p><span class="jet-result">Jet de ${name} : ${roll}/${targetValue}. ${resultText}</span></p><p>&nbsp;</p>`;
                                    editor.insertContent(output);
                                    api.close();
                                }
                            });
                        };

                        openDialog(stats, 'stats');
                    }
                });

                // Bouton Galerie
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

                // Bouton Oracle (Mythic GME)
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
                            body: {
                                type: 'panel',
                                items: [{
                                    type: 'selectbox',
                                    name: 'odds',
                                    label: 'Probabilité de "Oui"',
                                    items: oddsList
                                }]
                            },
                            initialData: { odds: '50|50/50' },
                            buttons: [
                                { type: 'cancel', text: 'Annuler' },
                                { type: 'submit', text: 'Interroger', primary: true }
                            ],
                            onSubmit: (api) => {
                                const data = api.getData();
                                const [chance, label] = data.odds.split('|');
                                const yesChance = parseInt(chance);
                                const roll = Math.floor(Math.random() * 100) + 1;

                                let result = "";
                                let color = "#F59E0B";

                                const exceptionalYesLimit = Math.max(1, Math.floor(yesChance / 5));
                                const exceptionalNoLimit = 100 - Math.max(0, Math.floor((100 - yesChance) / 5)) + 1;

                                if (roll <= exceptionalYesLimit) {
                                    result = "OUI EXCEPTIONNEL !";
                                    color = "#10B981"; // Vert
                                } else if (roll <= yesChance) {
                                    result = "OUI.";
                                } else if (roll >= exceptionalNoLimit) {
                                    result = "NON EXCEPTIONNEL !";
                                    color = "#EF4444"; // Rouge
                                } else {
                                    result = "NON.";
                                    color = "#94A3B8"; // Gris
                                }

                                const output = `<p><span class="oracle-result" style="color: ${color}; font-weight: bold;">[Oracle] ${label} (${roll}%) : ${result}</span></p><p>&nbsp;</p>`;
                                editor.insertContent(output);
                                api.close();
                            }
                        });
                    }
                });
            }
        });
    }
});

function renderJournal() {
    const journalContent = document.getElementById('journal-content');
    if (!journalContent) return;
    journalContent.innerHTML = '';
    const sortedJournal = [...gameState.journal].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedJournal.forEach(item => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'journal-entry';
        entryDiv.innerHTML = `
            <div class="journal-header">
                <p class="journal-date">${new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <div class="button-group">
                    <button class="card-button" onclick="openModal('journal', ${item.id})" title="${isReadOnly ? 'Voir' : 'Modifier'}">
                        ${isReadOnly ?
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 158.8 17.9 198.8 0 256s17.9 97.2 47.4 143.4C96.5 443.2 161.2 480 288 480s191.5-36.8 238.6-80.6C558.1 353.2 576 313.2 576 256s-17.9-97.2-47.4-143.4C434.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0z"/></svg>' :
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>'}
                    </button>
                    ${!isReadOnly ? `
                    <button class="card-button delete-button" onclick="deleteItem('journal', ${item.id})" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                    </button>` : ''}
                </div>
            </div>
            <div class="journal-content-display">
                ${item.entry} 
            </div>
        `;
        journalContent.appendChild(entryDiv);
    });
}

async function saveJournalEntry(newContent) {
    const id = currentJournalEditId; // vient de main.js
    const journalData = {
        date: (id ? gameState.journal.find(j => j.id === id).date : document.getElementById('journal-date').value),
        entry: newContent
    };

    if (id) {
        const index = gameState.journal.findIndex(j => j.id === id);
        gameState.journal[index] = { ...gameState.journal[index], ...journalData };
    } else {
        journalData.id = Date.now();
        gameState.journal.push(journalData);
        currentJournalEditId = journalData.id; // Fix: Update the global ID for subsequent auto-saves
    }
    await saveGameData();
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

    if (!readingModeOverlay) return;

    function displayJournalPage(index, direction = '') {
        currentJournalIndex = index;
        const totalPages = sortedJournal.length;
        const item = sortedJournal[index];
        const date = new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const newBookContent = document.createElement('div');
        newBookContent.className = 'book-content';

        const article = document.createElement('article');
        article.className = 'journal-entry';
        article.innerHTML = `
            <div class="journal-header"><p class="journal-date">${date}</p></div>
            <div class="journal-content-display">${item.entry}</div>
        `;
        newBookContent.appendChild(article);

        const currentContent = bookContainer.querySelector('.book-content');
        if (direction && currentContent) {
            const exitAnimation = direction === 'next' ? 'page-exit-left' : 'page-exit-right';
            const enterAnimation = direction === 'next' ? 'page-enter-right' : 'page-enter-left';
            currentContent.classList.add(exitAnimation);
            newBookContent.classList.add(enterAnimation);
            setTimeout(() => currentContent.remove(), 300);
        } else {
            bookContainer.innerHTML = '';
        }
        bookContainer.appendChild(newBookContent);

        pageCounterDisplay.textContent = `Page ${index + 1} / ${totalPages}`;
        prevPageBtn.disabled = (index === 0);
        nextPageBtn.disabled = (index === totalPages - 1);
    }

    function openReadingMode() {
        sortedJournal = [...gameState.journal].sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortedJournal.length > 0) {
            displayJournalPage(0);
            readingModeOverlay.classList.add('active');
        } else {
            showToast("Le journal est vide.", 'info');
        }
    }

    function closeReadingMode() { readingModeOverlay.classList.remove('active'); }

    if (openReadingModeBtn) openReadingModeBtn.addEventListener('click', openReadingMode);
    if (closeReadingModeBtn) closeReadingModeBtn.addEventListener('click', closeReadingMode);

    if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
        if (currentJournalIndex < sortedJournal.length - 1) displayJournalPage(currentJournalIndex + 1, 'next');
    });
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
        if (currentJournalIndex > 0) displayJournalPage(currentJournalIndex - 1, 'prev');
    });

    if (pageJumper) pageJumper.addEventListener('click', () => {
        pageCounterDisplay.style.display = 'none';
        pageJumpInput.style.display = 'inline-block';
        pageJumpInput.value = currentJournalIndex + 1;
        pageJumpInput.focus();
        pageJumpInput.select();
    });

    function handlePageJump() {
        pageCounterDisplay.style.display = 'inline-block';
        pageJumpInput.style.display = 'none';
        let targetPage = parseInt(pageJumpInput.value, 10);
        if (isNaN(targetPage) || targetPage < 1 || targetPage > sortedJournal.length) return;
        const newIndex = targetPage - 1;
        if (newIndex !== currentJournalIndex) {
            displayJournalPage(newIndex, newIndex > currentJournalIndex ? 'next' : 'prev');
        }
    }
    if (pageJumpInput) {
        pageJumpInput.addEventListener('blur', handlePageJump);
        pageJumpInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') handlePageJump(); });
    }

    // Quick View Modal
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

    function closeQuickView() {
        quickViewModal.classList.remove('active');
        quickViewContent.innerHTML = '';
    }
    if (quickViewCloseBtn) quickViewCloseBtn.addEventListener('click', closeQuickView);
    if (quickViewModal) makeDraggable(quickViewModal, document.getElementById('quick-view-header'));
});
