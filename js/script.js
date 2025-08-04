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

        const firebaseConfig = {
            apiKey: "AIzaSyCx9A30knmNxaOpm9XNTD7zLKSFop9cJFg",
            authDomain: "the-oregon-trail-f6892.firebaseapp.com",
            projectId: "the-oregon-trail-f6892",
            storageBucket: "the-oregon-trail-f6892.firebasestorage.app",
            messagingSenderId: "180682046262",
            appId: "1:180682046262:web:bb6ce086568bae31e0d197"
        };

        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const saveDocRef = db.collection('saves').doc('mainSave');

        // --- 1. GESTION DE L'ÉTAT (LES DONNÉES DU JEU) ---
        const defaultState = {
            character: {
                money: 100.00,
                stats: [
                    { id: 1, name: "Force", value: 70 },
                    { id: 2, name: "Endurance", value: 75 },
                    { id: 3, name: "Charisme", value: 50 },
                    { id: 4, name: "Connaissances", value: 30 },
                    { id: 5, name: "Combat", value: 45 },
                    { id: 6, name: "Perception", value: 60 },
                    { id: 7, name: "Persuasion", value: 70 },
                    { id: 8, name: "Survie", value: 35 },
                    { id: 9, name: "Agilité", value: 50 },
                    { id: 10, name: "Discrétion", value: 65 },
                    { id: 11, name: "Dextérité", value: 40 },

                ],
                skills: [
                    { id: 101, name: "Résilience", value: 85 },
                    { id: 102, name: "Débrouillardise", value: 60 },
                    { id: 103, name: "Jeu de banjo", value: 70 },
                    { id: 104, name: "Attaque sournoise", value: 70 },
                    { id: 105, name: "Fuite", value: 65 },
                    { id: 106, name: "Tir au revolver", value: 25 },
                    { id: 107, name: "Tir au fusil", value: 20 },
                    { id: 108, name: "Poker", value: 30 },
                    { id: 109, name: "Lecture", value: 10 },
                    { id: 110, name: "Equitation", value: 15 },

                ],
                banjoMelodies: [
                    { id: 201, name: "Hard Times Come Again No More", description: "Triste et lent"}
                ],
                strengths: [ 
                    { id: 301, text: "Résilience"},
                    { id: 302, text: "Loyauté"},
                    { id: 303, text: "Droiture"},
                    { id: 304, text: "Rêveur"},
                 ],
                weaknesses: [ 
                    { id: 401, text: "Manque de confiance" },
                    { id: 402, text: "Ignorant" },
                    { id: 403, text: "Méfiant" },
                    { id: 404, text: "Rancunier"},
                ],
                inventory: {
                    firearms: [
                        { id: 501, name: "Remington Army New Model 1863", img: "images/remington_new_model.png" }
                    ],
                    clothing: [
                        { id: 601, name: "Chapeau Cattleman", img: "images/cattleman_hat.jpg" }
                    ],
                    companions: [
                        { id: 701, name: "Pilgrim, cheval Morgan", img: "images/morgan_horse.jpg" }
                    ],
                    general: [
                        { id: 801, text: "Vêtements neufs et robustes" },
                        { id: 802, text: "Bottes de marche neuves" },
                        { id: 803, text: "Gilet et vêtement de froid" },
                        { id: 804, text: "Couverture de voyage"},
                        { id: 805, text: "Kits de cuisine et d'entretien"},
                        { id: 806, text: "Couteau de chasse et petit couteau"},
                        { id: 807, text: "Banjo dans son étui"},
                        { id: 808, text: "Munitions .44 et .50"},
                        { id: 809, text: "Pierre d'ombre"}
                    ]
                }
            },
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
            await saveDocRef.set(gameState);
            console.log("Partie sauvegardée sur Firebase !");   
        }

        async function loadGameData() {
            const doc = await saveDocRef.get();
            if (doc.exists) {
                console.log("Données chargées depuis Firebase.");
                return doc.data();
            } else {
                console.log("Aucune sauvegarde Firebase trouvée.");
                return null; // Aucune sauvegarde n'existe
            }
        }

      

        // --- 2. LOGIQUE D'AFFICHAGE (RENDU) ---
        const npcContainer = document.getElementById('npc-container');
        const threadContainer = document.getElementById('thread-container');
        const journalContent = document.getElementById('journal-content');
        const moneyInput = document.getElementById('character-money');
        const saveMoneyButton = document.getElementById('save-money-button');

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
            
            await saveGameData();
        });


        function renderCharacterSheet() {
            if (!gameState.character) return;
            renderEditableList('stats', 'Statistique', false);
            renderEditableList('skills', 'Compétence', false);
            renderEditableList('banjoMelodies', 'Mélodie', true);
            renderEditableList('strengths', 'Point Fort', false, true); // le dernier 'true' est pour le champ 'text'
            renderEditableList('weaknesses', 'Point Faible', false, true);
            renderInventory();
        }

       function renderEditableList(key, placeholder, hasDescription = false, isTextOnly = false) {
            const containerId = `${key.replace('.', '-')}-container`;
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Erreur : Le conteneur #${containerId} est introuvable.`);
                return;
            }

            const path = key.split('.');
            const data = path.reduce((obj, prop) => (obj ? obj[prop] : undefined), gameState.character) || [];

            if (!Array.isArray(data)) {
                console.error(`Erreur critique : Les données pour la clé "${key}" ne sont pas un tableau.`, data);
                container.innerHTML = `<p style="color: red;">Erreur de données pour cette section.</p>`;
                return;
            }

            container.innerHTML = '';
            data.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'editable-list-item';
                
                let itemHTML = `<span class="item-name">${item.name || item.text}</span>`;
                if (item.value !== undefined) {
                    itemHTML += `<input type="number" value="${item.value}" onchange="updateCharacterItemValue('${key}', ${item.id}, this.value)">`;
                }
                if (item.description) {
                    itemHTML += `<span>- <i>${item.description}</i></span>`;
                }
                itemHTML += `<button class="delete-item-btn" onclick="deleteCharacterItem('${key}', ${item.id})">&times;</button>`;
                
                itemDiv.innerHTML = itemHTML;
                container.appendChild(itemDiv);
            });

            // La logique pour afficher le bouton "Ajouter"
            const addFormContainerId = `add-${key.replace('.', '-')}-form-container`;
            const addFormContainer = document.getElementById(addFormContainerId);
            if (addFormContainer) {
                addFormContainer.innerHTML = `<button class="action-button" style="font-size: 0.8em; padding: 5px 10px;" onclick="showAddItemForm('${key}', '${placeholder}', ${hasDescription}, ${isTextOnly})">+ Ajouter</button>`;
            }
        }

        function renderInventory() {
            if (!gameState.character.inventory) return;
            renderInventoryCategory('firearms', 'Arme à feu');
            renderInventoryCategory('clothing', 'Vêtement/Accessoire');
            renderInventoryCategory('companions', 'Compagnon');
            renderEditableList('inventory.general', 'Objet', false, true);
        }

        function renderInventoryCategory(category, placeholder) {
            const container = document.getElementById(`inventory-${category}-container`);
            container.innerHTML = '';
            const data = gameState.character.inventory[category] || [];

            data.forEach(item => {
                const slot = document.createElement('div');
                slot.className = 'inventory-item-slot';
                slot.innerHTML = `
                    <img src="${item.img || 'https://i.imgur.com/b6f8f5B.png'}" alt="${item.name}">
                    <span class="item-name">${item.name}</span>
                    <button class="delete-item-btn" onclick="deleteCharacterItem('inventory.${category}', ${item.id})">&times;</button>
                `;
                container.appendChild(slot);
            });

            const addSlot = document.createElement('div');
            addSlot.className = 'inventory-item-slot';
            addSlot.style.cursor = 'pointer';
            // Maintenant, la variable 'placeholder' est bien définie et sera transmise
            addSlot.onclick = () => showAddItemForm(`inventory.${category}`, placeholder, false, false, true);
            addSlot.innerHTML = `<span style="font-size: 3em; color: var(--border-color);">+</span>`;
            container.appendChild(addSlot);

            // On ajoute le conteneur pour le formulaire d'ajout
            const addFormContainer = document.getElementById(`add-inventory-${category}-form-container`);
            if(addFormContainer) addFormContainer.innerHTML = '';
        }

        window.showAddItemForm = (key, placeholder, hasDescription, isTextOnly, hasImage) => {
            const addFormContainerId = `add-${key.replace('.', '-')}-form-container`;
            const container = document.getElementById(addFormContainerId);
            
            let formHTML = `<div class="add-item-form">`;
            const inputId = `new-item-name-${key.replace('.', '-')}`;
            const valueId = `new-item-value-${key.replace('.', '-')}`;
            const descId = `new-item-desc-${key.replace('.', '-')}`;
            const imgId = `new-item-img-${key.replace('.', '-')}`;

            formHTML += `<input type="text" id="${inputId}" placeholder="${placeholder}">`;
            
            if (hasDescription) {
                formHTML += `<input type="text" id="${descId}" placeholder="Description">`;
            } else if (hasImage) {
                formHTML += `<input type="text" id="${imgId}" placeholder="URL de l'image (optionnel)">`;
            } else if (!isTextOnly) {
                formHTML += `<input type="number" id="${valueId}" placeholder="Valeur" style="width: 80px;">`;
            }
            
            formHTML += `<button class="action-button" onclick="handleAddItem('${key}', ${hasDescription}, ${isTextOnly}, ${hasImage})">✔</button>`;
            formHTML += `</div>`;
            container.innerHTML = formHTML;
        };

        window.handleAddItem = (key, hasDescription, isTextOnly, hasImage) => {
            const inputId = `new-item-name-${key.replace('.', '-')}`;
            const nameInput = document.getElementById(inputId);
            const name = nameInput.value.trim();

            if (!name) {
                alert("Le nom ne peut pas être vide.");
                return;
            }

            const newItem = { id: Date.now() };

            if (hasDescription) {
                newItem.name = name;
                newItem.description = document.getElementById(`new-item-desc-${key.replace('.', '-')}`).value;
            } else if (hasImage) {
                newItem.name = name;
                newItem.img = document.getElementById(`new-item-img-${key.replace('.', '-')}`).value;
            } else if (isTextOnly) {
                newItem.text = name;
            } else { // C'est une stat ou une compétence
                newItem.name = name;
                const value = document.getElementById(`new-item-value-${key.replace('.', '-')}`).value;
                newItem.value = parseInt(value, 10) || 0;
            }
            
            let list;
            if (key.startsWith('inventory.')) {
                const category = key.split('.')[1];
                list = gameState.character.inventory[category];
            } else {
                list = gameState.character[key];
            }
            
            list.push(newItem);
            saveGameData();
            renderCharacterSheet(); // On rafraîchit toute la fiche
        };

        window.updateCharacterItemValue = async (key, id, newValue) => {
            const item = gameState.character[key].find(i => i.id === id);
            if (item) {
                item.value = parseInt(newValue, 10);
                await saveGameData();
            }
        };

        window.deleteCharacterItem = async (key, id) => {
            let list;
            if (key.startsWith('inventory.')) {
                const category = key.split('.')[1];
                list = gameState.character.inventory[category];
            } else {
                list = gameState.character[key];
            }

            const index = list.findIndex(i => i.id === id);
            if (index > -1) {
                list.splice(index, 1);
                await saveGameData();
                renderCharacterSheet(); // On rafraîchit toute la fiche
            }
        };

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
            renderCharacterSheet();
            renderNpcs();
            renderThreads();
            renderJournal();
        }

        window.moveItem = async function(type, id, direction) {
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

            await saveGameData();
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
        };

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
           let data = await loadGameData();
            // Si aucune donnée n'est sur Firebase, on vérifie l'ancien localforage pour la migration
            if (!data) {
                console.log("Vérification de localforage pour migration...");
                const oldDataKeys = await localforage.keys();
                if (oldDataKeys.length > 0) {
                    alert("Anciennes données locales trouvées. Migration vers Firebase en cours...");
                    const migratedData = {};
                    for (const key of oldDataKeys) {
                        migratedData[key] = await localforage.getItem(key);
                    }
                    gameState = migratedData;
                    await saveGameData(); // On envoie les données migrées sur Firebase
                    await localforage.clear(); // On nettoie l'ancien stockage
                    alert("Migration terminée ! Vos données sont maintenant synchronisées en ligne.");
                    data = gameState;
                } else {
                    // Si aucune sauvegarde n'existe nulle part, on utilise les données par défaut
                    console.log("Aucune sauvegarde trouvée. Initialisation avec les données par défaut.");
                    gameState = defaultState;
                    await saveGameData();
                    data = gameState;
                }
            }
            
            // On remplit notre état de jeu avec les données chargées
            gameState = data;
            
            // On s'assure que toutes les propriétés existent pour éviter les erreurs
            for (const key in defaultState) {
                if (!gameState[key]) {
                    gameState[key] = defaultState[key];
                }
            }

            // Le reste de l'initialisation de la page
            if (gameState.character && gameState.character.money !== undefined) {
                moneyInput.value = parseFloat(gameState.character.money).toFixed(2);
            }
            renderAll();
            showSection('character');
        }

        
        // --- 5. INITIALISATION ---
        main();
    });