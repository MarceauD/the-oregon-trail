document.addEventListener('DOMContentLoaded', () => {
            tinymce.init({
                selector: '#journal-entry-text',
                license_key: 'gpl',
                plugins: 'lists link image table code help wordcount',
                toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | link image | alignleft aligncenter alignright | code',
                language: 'fr_FR',
                menubar: false,
                content_style: `body { font-family: 'Lora', serif; font-size: 16px; line-height: 1.6; } img { max-width: 100%; height: auto; display: block; margin: 10px 0; }`
            });

        // --- 1. GESTION DE L'ÉTAT (LES DONNÉES DU JEU) ---
        const defaultState = {
            character: {money: 100.00},
            npcs: [
                { id: 1, name: "Abigail Carter", description: "Une fermière tenace et bienveillante.", status: "ami", faitsMarquants: "M'a donné des provisions gratuitement."},
                { id: 2, name: "Silas 'Le Corbeau'", description: "Un bandit de grand chemin rusé et dangereux.", status: "ennemi", faitsMarquants: "A tenté de me voler près d'une auberge."}
            ],
            threads: [
                { id: 1, title: "Traverser la Pennsylvanie", location: "Pennsylvanie", description: "Atteindre la frontière de l'Ohio.", status: "en-cours", events: ["Quitté Philadelphie.", "Repoussé l'attaque de Silas."]}
            ],
            journal: [
                { id: 1690378800000, date: "1868-07-15", entry: "Je me suis enfui. Enfin libre, mais le souffle court. La silhouette de Harrisburg s'éloigne derrière moi. Direction l'ouest, vers Lewistown, en suivant la voie ferrée. Le banjo sur mon dos pèse moins lourd que le nom des Dunbar." }
            ],
            // capital, major-city, small-town
            route: [
                { city: "Harrisburg",  x: 3164, y: 1013, type: "major-city",     labelPosition: "top-right" },
                { city: "Lewistown",   x: 3132, y: 997, type: "small-town",  labelPosition: "top" },
                { city: "Mount Union", x: 3094, y: 1001, type: "small-town",  labelPosition: "bottom-right" },
                { city: "",  x: 3084, y: 999, type: "small-town",  labelPosition: "top-right" },
                { city: "Altoona",     x: 3068, y: 996, type: "small-town",  labelPosition: "top-left" },
                { city: "Ebensburg",     x: 3038, y: 1020, type: "small-town",  labelPosition: "bottom" },
                { city: "Johnstown",     x: 3020, y: 1026, type: "small-town",  labelPosition: "top-left" },
            ]
        };

        let gameState = {};
        //let gameState = JSON.parse(localStorage.getItem('oregonTrailSave')) || defaultState;
                

        async function saveGameData() {
            // On sauvegarde chaque "tiroir" de données séparément
            await localforage.setItem('character', gameState.character);
            await localforage.setItem('npcs', gameState.npcs);
            await localforage.setItem('threads', gameState.threads);
            await localforage.setItem('journal', gameState.journal);
            await localforage.setItem('route', gameState.route);
            console.log("Partie sauvegardée avec LocalForage !");
            updateStorageUsageDisplay();
        }

      

        // --- 2. LOGIQUE D'AFFICHAGE (RENDU) ---
        const npcContainer = document.getElementById('npc-container');
        const threadContainer = document.getElementById('thread-container');
        const journalContent = document.getElementById('journal-content');
        const moneyInput = document.getElementById('character-money');
        const saveMoneyButton = document.getElementById('save-money-button');
        const exportButton = document.getElementById('export-save-button');
        const importButton = document.getElementById('import-save-button');
        const importFileInput = document.getElementById('import-file-input');

        // Initialiser la valeur au chargement de la page
        if (gameState.character && gameState.character.money !== undefined) {
            moneyInput.value = parseFloat(gameState.character.money).toFixed(2);
        }

        // Sauvegarder en cliquant sur le bouton
        saveMoneyButton.addEventListener('click', async () => {
            const newAmount = parseFloat(moneyInput.value);
            if (!isNaN(newAmount)) {
                // Mettre à jour l'état du jeu
                if (!gameState.character) gameState.character = {};
                gameState.character.money = newAmount;
                
                // Sauvegarder dans le localStorage
                await saveGameData();

                // Mettre à jour l'affichage et donner un feedback visuel
                moneyInput.value = newAmount.toFixed(2);
                saveMoneyButton.classList.add('saved');
                setTimeout(() => {
                    saveMoneyButton.classList.remove('saved');
                }, 1500); // Le bouton redevient normal après 1.5s
            } else {
                alert("Veuillez entrer une valeur numérique valide.");
            }
        });

        async function exportFullSave() {
            console.log("Exportation de la sauvegarde...");
            const saveData = {};
            const keys = await localforage.keys();
            
            for (const key of keys) {
                saveData[key] = await localforage.getItem(key);
            }

            const saveDataString = JSON.stringify(saveData, null, 2);
            const blob = new Blob([saveDataString], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sauvegarde_oregon_trail_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        exportButton.addEventListener('click', exportFullSave);

        importButton.addEventListener('click', () => {
            if (confirm("Attention : Importer une sauvegarde écrasera votre partie actuelle sur cet ordinateur. Continuer ?")) {
                importFileInput.click();
            }
        });

        importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    // On vérifie que les données semblent valides
                    if (importedData.character && importedData.npcs) {
                        // On efface l'ancienne base de données
                        await localforage.clear();
                        // On importe les nouvelles données, clé par clé
                        for (const key in importedData) {
                            if (Object.hasOwnProperty.call(importedData, key)) {
                                await localforage.setItem(key, importedData[key]);
                            }
                        }
                        alert("Sauvegarde importée avec succès ! La page va maintenant se recharger.");
                        location.reload(); // On recharge la page pour que tout soit mis à jour
                    } else {
                        alert("Erreur : Le fichier de sauvegarde semble invalide.");
                    }
                } catch (error) {
                    console.error("Erreur lors de l'importation :", error);
                    alert("Erreur : Le fichier est corrompu ou n'est pas un fichier de sauvegarde valide.");
                }
            };
            reader.readAsText(file);
        });

        function renderNpcs() {
            const npcContainer = document.getElementById('npc-container');
            npcContainer.innerHTML = '';
            gameState.npcs.forEach((npc, index) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.id = npc.id;
                
                let statusText = npc.status.replace(/-/g, ' ');
                statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);

                let faitsHtml = '';
                if (npc.faitsMarquants && npc.faitsMarquants.trim() !== '') {
                    const faitsContent = npc.faitsMarquants.replace(/\n/g, '<br>');
                    faitsHtml = `<div class="card-section" style="margin-top: 15px;"><strong>Faits marquants :</strong><p>${faitsContent}</p></div>`;
                }
                
                card.innerHTML = `
                    <div class="card-header">
                        <h3>${npc.name} <span class="status status-${npc.status}">${statusText}</span></h3>
                    </div>
                    <div class="card-details">
                        <p>${npc.description}</p>
                        ${faitsHtml}
                    </div>
                    <div class="card-footer">
                        <div class="button-group">
                            <button class="card-button" onclick="openModal('npc', ${npc.id})" title="Modifier">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>
                            </button>
                            <button class="card-button delete-button" onclick="deleteItem('npc', ${npc.id})" title="Supprimer">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                            </button>
                            <div class="order-buttons">
                                <button class="order-button" onclick="moveItem('npcs', ${npc.id}, 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                                <button class="order-button" onclick="moveItem('npcs', ${npc.id}, 'down')" ${index === gameState.npcs.length - 1 ? 'disabled' : ''}>↓</button>
                            </div>
                        </div>
                    </div>
                `;
                npcContainer.appendChild(card);
            });
        }

        function renderThreads() {
            const threadContainer = document.getElementById('thread-container');
            threadContainer.innerHTML = '';
            gameState.threads.forEach((thread, index) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.id = thread.id;
                
                const eventsHtml = thread.events && thread.events.length > 0 ? `<ul>${thread.events.map(e => `<li>${e}</li>`).join('')}</ul>` : '';
                let statusText = thread.status.replace(/-/g, ' ');
                statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);

                card.innerHTML = `
                    <div class="card-header">
                        <h3>${thread.title} <span class="status status-${thread.status}">${statusText}</span></h3>
                    </div>
                    <div class="card-details">
                        <p><strong>Lieu :</strong> ${thread.location}</p>
                        <p>${thread.description}</p>
                        ${eventsHtml ? `<strong>Événements :</strong>${eventsHtml}` : ''}
                    </div>
                    <div class="card-footer">
                        <div class="button-group">
                             <button class="card-button" onclick="openModal('thread', ${thread.id})" title="Modifier">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>
                            </button>
                            <button class="card-button delete-button" onclick="deleteItem('thread', ${thread.id})" title="Supprimer">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                            </button>
                            <div class="order-buttons">
                                <button class="order-button" onclick="moveItem('threads', ${thread.id}, 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                                <button class="order-button" onclick="moveItem('threads', ${thread.id}, 'down')" ${index === gameState.threads.length - 1 ? 'disabled' : ''}>↓</button>
                            </div>
                        </div>
                    </div>
                `;
                threadContainer.appendChild(card);
            });
        }

        function renderJournal() {
            const journalContent = document.getElementById('journal-content');
            journalContent.innerHTML = '';
            const sortedJournal = [...gameState.journal].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedJournal.forEach(item => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'journal-entry';
                // On utilise .innerHTML pour que le navigateur interprète les balises HTML (gras, italique, etc.)
                entryDiv.innerHTML = `
                    <div class="journal-header">
                        <p class="journal-date">${new Date(item.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                        <div class="button-group">
                            <button class="card-button" onclick="openModal('journal', ${item.id})">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>
                            </button>
                            <button class="card-button delete-button" onclick="deleteItem('journal', ${item.id})">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="journal-content-display">
                        ${item.entry} 
                    </div>
                `;
                journalContent.appendChild(entryDiv);
            });
        }

        
        function renderAll() {
            renderNpcs();
            renderThreads();
            renderJournal();
        }

        window.moveItem = function(type, id, direction) {
            const list = gameState[type];
            const index = list.findIndex(item => item.id === id);

            if (index === -1) return; // Sécurité

            if (direction === 'up' && index > 0) {
                // Swap avec l'élément précédent
                [list[index - 1], list[index]] = [list[index], list[index - 1]];
            } else if (direction === 'down' && index < list.length - 1) {
                // Swap avec l'élément suivant
                [list[index], list[index + 1]] = [list[index + 1], list[index]];
            }

            saveState();
            renderAll();
        }

        // --- 3. LOGIQUE DE LA FENÊTRE MODALE ---
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalForm = document.getElementById('modal-form');
        const npcFields = document.getElementById('npc-fields');
        const threadFields = document.getElementById('thread-fields');
        const journalFields = document.getElementById('journal-fields');
        const editIdInput = document.getElementById('edit-id');
        const editTypeInput = document.getElementById('edit-type');
        

        function exportSectionToClipboard(type) {
            let output = '';
            const separator = '\n------------------------------------\n\n';

            if (type === 'npcs') {
                output = '=== PERSONNAGES NON-JOUABLES ===\n\n';
                gameState.npcs.forEach(npc => {
                    let statusText = npc.status.replace(/-/g, ' ');
                    statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);
                    
                    output += `Nom: ${npc.name}\n`;
                    output += `Statut: ${statusText}\n\n`;
                    output += `Description:\n${npc.description}\n\n`;
                    if (npc.faitsMarquants && npc.faitsMarquants.trim() !== '') {
                        output += `Faits marquants:\n${npc.faitsMarquants}\n`;
                    }
                    output += separator;
                });
            } else if (type === 'threads') {
                output = '=== THREADS ===\n\n';
                gameState.threads.forEach(thread => {
                     let statusText = thread.status.replace(/-/g, ' ');
                     statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);

                    output += `Titre: ${thread.title}\n`;
                    output += `Lieu: ${thread.location}\n`;
                    output += `Statut: ${statusText}\n\n`;
                    output += `Description:\n${thread.description}\n\n`;
                    if (thread.events && thread.events.length > 0) {
                        output += `Événements:\n${thread.events.map(e => `- ${e}`).join('\n')}\n`;
                    }
                    output += separator;
                });
            } else if (type === 'journal') {
                output = '=== JOURNAL DE BORD ===\n\n';
                const sortedJournal = [...gameState.journal].sort((a, b) => new Date(a.date) - new Date(b.date));
                const tempDiv = document.createElement('div');

                sortedJournal.forEach(item => {
                    const date = new Date(item.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'});
                    
                    // On met le HTML de l'entrée dans notre élément temporaire
                    tempDiv.innerHTML = item.entry;
                    // On récupère uniquement le texte brut
                    const plainText = tempDiv.textContent || "";

                    output += `Date: ${date}\n`;
                    output += `${plainText}\n`; // On ajoute le texte brut à l'export
                    output += separator;
                });
            }

            // Utilisation de l'API Clipboard pour copier le texte
            navigator.clipboard.writeText(output).then(() => {
                alert('Contenu copié dans le presse-papiers !');
            }).catch(err => {
                console.error('Erreur lors de la copie : ', err);
                alert('Une erreur est survenue lors de la copie.');
            });
        }

        // MODIFICATION DE openModal pour utiliser la nouvelle fonction
        window.openModal = function(type, id = null) {
            modalForm.reset();
            editTypeInput.value = type;

            // On cache toutes les sections
            npcFields.style.display = 'none';
            threadFields.style.display = 'none';
            journalFields.style.display = 'none';

            const editor = tinymce.get('journal-entry-text');
            
            // On active la bonne section
            if (type === 'npc') {
                npcFields.style.display = 'grid';
                if (editor) editor.mode.set('readonly'); // On désactive l'éditeur s'il n'est pas utilisé
                if (id) {
                    modalTitle.textContent = 'Modifier le PNJ';
                    const npc = gameState.npcs.find(n => n.id === id);
                    document.getElementById('npc-name').value = npc.name;
                    document.getElementById('npc-status').value = npc.status;
                    document.getElementById('npc-description').value = npc.description;
                    document.getElementById('npc-faits').value = npc.faitsMarquants || '';
                    editIdInput.value = id;
                } else {
                    modalTitle.textContent = 'Ajouter un PNJ';
                    editIdInput.value = '';
                }

            } else if (type === 'thread') {
                threadFields.style.display = 'grid';
                if (editor) editor.mode.set('readonly'); // On désactive l'éditeur s'il n'est pas utilisé
                if (id) {
                    modalTitle.textContent = 'Modifier le Thread';
                    const thread = gameState.threads.find(t => t.id === id);
                    document.getElementById('thread-title').value = thread.title;
                    document.getElementById('thread-location').value = thread.location;
                    document.getElementById('thread-status').value = thread.status;
                    document.getElementById('thread-description').value = thread.description;
                    editIdInput.value = id;
                } else {
                    modalTitle.textContent = 'Ajouter un Thread';
                    editIdInput.value = '';
                }

            } else if (type === 'journal') {
                journalFields.style.display = 'grid';
                
                const item = id ? gameState.journal.find(j => j.id === id) : null;
                const initialContent = item ? item.entry : '';
                
                // CORRECTION MAJEURE : On remplit le textarea AVANT d'initialiser l'éditeur
                document.getElementById('journal-entry-text').value = initialContent;
                
                
                if (id) {
                    modalTitle.textContent = 'Modifier l\'entrée du journal';
                    document.getElementById('journal-date').value = item.date;
                    editIdInput.value = id;
                } else {
                    modalTitle.textContent = 'Ajouter une entrée au journal';
                    document.getElementById('journal-date').valueAsDate = new Date();
                    editIdInput.value = '';
                }

                if (editor) {
                    editor.mode.set('design'); // On s'assure qu'il est éditable
                    editor.setContent(initialContent); // On met à jour son contenu
                }

                // L'initialisation se fait maintenant sur un textarea qui a déjà le bon contenu.
                
            }

            modalOverlay.classList.add('active');
        }   

        function closeModal() {
            const editor = tinymce.get('journal-entry-text');
            if (editor) {
                editor.setContent(''); // On vide l'éditeur pour la prochaine fois
            }
            modalOverlay.classList.remove('active');
        }

        modalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = editIdInput.value ? parseInt(editIdInput.value) : null;
            const type = editTypeInput.value;
            if (type === 'npc') {
                const npcData = {
                    name: document.getElementById('npc-name').value,
                    status: document.getElementById('npc-status').value,
                    description: document.getElementById('npc-description').value,
                    // NOUVEAU : Plus besoin de .split(), on récupère directement la valeur du textarea.
                    faitsMarquants: document.getElementById('npc-faits').value
                };

                if (id) {
                    const index = gameState.npcs.findIndex(n => n.id === id);
                    gameState.npcs[index] = { ...gameState.npcs[index], ...npcData };
                } else {
                    npcData.id = Date.now();
                    // NOUVEAU : On s'assure que le champ existe même s'il est vide.
                    if (!npcData.faitsMarquants) {
                        npcData.faitsMarquants = "";
                    }
                    gameState.npcs.unshift(npcData);
                }
            } else if (type === 'thread') {
                const threadData = { title: document.getElementById('thread-title').value, location: document.getElementById('thread-location').value, status: document.getElementById('thread-status').value, description: document.getElementById('thread-description').value, };
                if (id) {
                    const index = gameState.threads.findIndex(t => t.id === id);
                    gameState.threads[index] = { ...gameState.threads[index], ...threadData };
                } else { threadData.id = Date.now(); threadData.events = []; gameState.threads.unshift(threadData); }
            } else if (type === 'journal') {
                const editor = tinymce.get('journal-entry-text');
                const journalData = {
                    date: document.getElementById('journal-date').value,
                    // On utilise la méthode de TinyMCE pour récupérer le contenu HTML
                    entry: editor ? editor.getContent() : ''
                };
                if (id) {
                    const index = gameState.journal.findIndex(j => j.id === id);
                    gameState.journal[index] = { ...gameState.journal[index], ...journalData };
                } else {
                    journalData.id = Date.now();
                    gameState.journal.push(journalData);
                }
            }

            await saveGameData();

            renderAll();
            closeModal();
        });
        
        window.deleteItem = async function(type, id) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
                if (type === 'npc') { gameState.npcs = gameState.npcs.filter(npc => npc.id !== id); } 
                else if (type === 'thread') { gameState.threads = gameState.threads.filter(thread => thread.id !== id); } 
                else if (type === 'journal') { gameState.journal = gameState.journal.filter(j => j.id !== id); }
                await saveGameData();
                renderAll();
            }
        }

        function handleCardToggle(event) {
            const cardHeader = event.target.closest('.card-header');
            if (!cardHeader) return; // Si on n'a pas cliqué sur un en-tête, on ne fait rien

            // Empêche le clic de se propager aux boutons qui pourraient être dans l'en-tête
            if (event.target.tagName === 'BUTTON' || event.target.closest('button')) return;

            const card = cardHeader.closest('.card');
            if (card) {
                card.classList.toggle('is-expanded');
            }
        }

        function renderRoute() {
            const svg = document.getElementById('route-svg');
            if (!svg) return;

            svg.innerHTML = '';
            const route = gameState.route || [];
            if (route.length === 0) return;

            // Étape 1 : On dessine la ligne du trajet en premier
            if (route.length >= 2) {
                const points = route.map(p => `${p.x},${p.y}`).join(' ');
                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                polyline.setAttribute('points', points);
                polyline.setAttribute('class', 'route-line');
                svg.appendChild(polyline);
            }

            // Étape 2 : On dessine tous les textes (noms des villes)
            

            // Étape 3 : On dessine tous les points (cercles) par-dessus tout le reste
            route.forEach(point => {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', point.x);
                circle.setAttribute('cy', point.y);
                circle.setAttribute('class', `route-point ${point.type}`);
                
                // CORRECTION : On définit l'attribut du rayon (r) ici, en JavaScript
                let radius = 10; // Valeur par défaut pour major-city
                switch(point.type) {
                    case 'capital':
                        radius = 15;
                        break;
                    case 'small-town':
                        radius = 5;
                        break;
                }
                circle.setAttribute('r', radius);

                svg.appendChild(circle);
            });

            route.forEach(point => {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                
                // CORRECTION : Logique avancée pour la position du texte
                let xOffset = 0;
                let yOffset = 0;
                let textAnchor = 'start'; // Alignement du texte (start, middle, end)
                const margin = 25; // Marge entre le point et le texte

                switch(point.labelPosition) {
                    case 'top':
                        yOffset = -margin;
                        textAnchor = 'middle';
                        break;
                    case 'top-right':
                        xOffset = margin / 2;
                        yOffset = -margin / 2;
                        textAnchor = 'start';
                        break;
                    case 'right':
                        xOffset = margin;
                        yOffset = 5; // Centrage vertical approximatif
                        textAnchor = 'start';
                        break;
                    case 'bottom-right':
                        xOffset = margin / 2;
                        yOffset = margin * 1.5;
                        textAnchor = 'start';
                        break;
                    case 'bottom':
                        yOffset = margin * 1.8;
                        textAnchor = 'middle';
                        break;
                    case 'bottom-left':
                        xOffset = -margin / 2;
                        yOffset = margin * 1.5;
                        textAnchor = 'end';
                        break;
                    case 'left':
                        xOffset = -margin;
                        yOffset = 5;
                        textAnchor = 'end';
                        break;
                    case 'top-left':
                        xOffset = -margin / 2;
                        yOffset = -margin / 2;
                        textAnchor = 'end';
                        break;
                    default: // Par défaut en bas
                        yOffset = margin * 1.8;
                        textAnchor = 'middle';
                }
                
                text.setAttribute('x', point.x + xOffset);
                text.setAttribute('y', point.y + yOffset);
                text.setAttribute('text-anchor', textAnchor);
                text.setAttribute('class', `route-label ${point.type}`);
                text.textContent = point.city;
                svg.appendChild(text);
            });
        }

        // --- 4. GESTIONNAIRES D'ÉVÉNEMENTS ---
        const navButtons = document.querySelectorAll('.nav-button');
        const contentSections = document.querySelectorAll('.content-section');

        window.showSection = function(sectionId) {
            const contentSections = document.querySelectorAll('.content-section');
            const navButtons = document.querySelectorAll('.nav-button');
            
            contentSections.forEach(section => section.classList.remove('active'));
            navButtons.forEach(button => button.classList.remove('active'));
            
            document.getElementById(sectionId).classList.add('active');
            document.querySelector(`.nav-button[onclick="showSection('${sectionId}')"]`).classList.add('active');

            // On appelle le dessin de la carte uniquement quand on affiche cet onglet
            if (sectionId === 'map') {
                renderRoute();
            }
        }

        document.getElementById('add-npc-button').addEventListener('click', () => openModal('npc'));
        document.getElementById('add-thread-button').addEventListener('click', () => openModal('thread'));
        document.getElementById('add-journal-button').addEventListener('click', () => openModal('journal'));
        document.getElementById('modal-close-button').addEventListener('click', closeModal);
        document.getElementById('export-npcs-button').addEventListener('click', () => exportSectionToClipboard('npcs'));
        document.getElementById('export-threads-button').addEventListener('click', () => exportSectionToClipboard('threads'));
        document.getElementById('export-journal-button').addEventListener('click', () => exportSectionToClipboard('journal'));
        document.getElementById('npc-container').addEventListener('click', handleCardToggle);
        document.getElementById('thread-container').addEventListener('click', handleCardToggle);
        

        modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) { closeModal(); } });

        // --- LOGIQUE DU LANCEUR DE DÉ ---
        const diceButton = document.getElementById('dice-roller-button');
        const diceOverlay = document.getElementById('dice-overlay');
        const diceCube = document.getElementById('dice-cube');
        diceButton.addEventListener('click', () => {
            diceOverlay.classList.add('show');
            diceCube.classList.remove('rolling');
            diceCube.textContent = '?';
            void diceCube.offsetWidth; 
            diceCube.classList.add('rolling');
            setTimeout(() => {
                const result = Math.floor(Math.random() * 100) + 1;
                diceCube.textContent = result;
            }, 1000);
        });
        diceOverlay.addEventListener('click', () => {
            diceOverlay.classList.remove('show');
        });

        

        // --- LOGIQUE POUR LE VISUALISEUR PDF ---
        const pdfViewer = document.getElementById('pdf-viewer');
        window.showPdf = function(fileName) {
            if (pdfViewer) {
                 pdfViewer.src = `pdfs/${fileName}`;
            }
        }

        async function main() {
            // On essaie de charger les données depuis LocalForage
            let character = await localforage.getItem('character');
            let npcs = await localforage.getItem('npcs');
            let threads = await localforage.getItem('threads');
            let journal = await localforage.getItem('journal');
            let route = defaultState.route;

            // Si les données n'existent pas dans LocalForage, on vérifie l'ancien localStorage
            if (!character && !npcs) {
                console.log("Aucune donnée LocalForage. Vérification du localStorage pour migration...");
                const oldDataRaw = localStorage.getItem('oregonTrailSave');
                if (oldDataRaw) {
                    try {
                        const oldData = JSON.parse(oldDataRaw);
                        console.log("Anciennes données trouvées ! Migration en cours...");
                        gameState = oldData;
                        await saveGameData(); // On sauvegarde tout dans le nouveau système
                        localStorage.removeItem('oregonTrailSave'); // On supprime l'ancienne sauvegarde
                        alert("Migration des données réussie ! Votre jeu est maintenant sur le nouveau système de sauvegarde.");
                    } catch (e) {
                        console.error("Erreur lors de la migration", e);
                        gameState = defaultState; // En cas d'erreur, on repart de zéro
                        await saveGameData();
                    }
                } else {
                    // Si aucune sauvegarde n'existe nulle part, on utilise les données par défaut
                    console.log("Aucune sauvegarde trouvée. Initialisation avec les données par défaut.");
                    gameState = defaultState;
                    await saveGameData();
                }
            } else {
                // Si les données existent, on les charge dans l'état du jeu
                console.log("Données chargées depuis LocalForage.");
                gameState.character = character || defaultState.character;
                gameState.npcs = npcs || defaultState.npcs;
                gameState.threads = threads || defaultState.threads;
                gameState.journal = journal || defaultState.journal;
                gameState.route = route || defaultState.route;
            }

            // Le reste de l'initialisation de la page
            if (gameState.character.money !== undefined) {
                moneyInput.value = parseFloat(gameState.character.money).toFixed(2);
            }

            updateStorageUsageDisplay();
            renderAll();
            showSection('character');
        }

        async function updateStorageUsageDisplay() {
            const displayElement = document.getElementById('storage-usage-display');
            const keys = await localforage.keys();
            let totalBytes = 0;
            for (const key of keys) {
                const value = await localforage.getItem(key);
                totalBytes += new Blob([JSON.stringify(value)]).size;
            }
            const sizeInKb = totalBytes / 1024;
            const sizeInMb = sizeInKb / 1024;
            displayElement.textContent = `${sizeInMb.toFixed(2)} Mo`;
            displayElement.style.color = 'white';
        }

        // --- 5. INITIALISATION ---
        main();
    });