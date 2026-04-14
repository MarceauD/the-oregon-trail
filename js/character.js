function renderCharacterIdentity() {
    const container = document.getElementById('identity-container');
    const data = gameState.character.identityFields || {};
    container.innerHTML = `
        <span>Nom</span>
        <span contenteditable="true" spellcheck="false"
            onblur="updateCharacterIdentity('name', this.textContent)"
            onkeydown="if(event.key==='Enter'){ this.blur(); event.preventDefault(); }">
            ${data.name || ''}
        </span>
        <span>Âge</span>
        <span contenteditable="true" spellcheck="false"
            onblur="updateCharacterIdentity('age', this.textContent)"
            onkeydown="if(event.key==='Enter'){ this.blur(); event.preventDefault(); }">
            ${data.age || ''}
        </span>
        <span>Origine</span>
        <span contenteditable="true" spellcheck="false"
            onblur="updateCharacterIdentity('origin', this.textContent)"
            onkeydown="if(event.key==='Enter'){ this.blur(); event.preventDefault(); }">
            ${data.origin || ''}
        </span>
        <span>Profession</span>
        <span contenteditable="true" spellcheck="false"
            onblur="updateCharacterIdentity('profession', this.textContent)"
            onkeydown="if(event.key==='Enter'){ this.blur(); event.preventDefault(); }">
            ${data.profession || ''}
        </span>
    `;
}

function renderCharacterHistory() {
    const container = document.getElementById('history-container');
    const data = gameState.character.history || '';
    container.innerHTML = `
        <p contenteditable="true" spellcheck="false"
        onblur="updateCharacterHistory(this.textContent)"
        onkeydown="if(event.key==='Enter'){ this.blur(); event.preventDefault(); }">
        ${data}
        </p>
    `;
}

window.updateCharacterIdentity = async function (field, newValue) {
    if (!gameState.character.identityFields) gameState.character.identityFields = {};
    gameState.character.identityFields[field] = newValue.trim();
    await saveGameData();
}

window.updateCharacterHistory = async function (newValue) {
    gameState.character.history = newValue.trim();
    await saveGameData();
}

function renderCharacterSheet() {
    if (!gameState.character) return;
    renderCharacterIdentity();
    renderCharacterHistory();
    renderEditableList('stats', 'Statistique', false);
    renderEditableList('skills', 'Compétence', false);
    renderEditableList('specificKnowledge', 'Savoir', true);
    renderHealthList('physicalState', 'Blessure');
    renderHealthList('mentalState', 'Trauma');
    renderEditableList('strengths', 'Point Fort', false, true);
    renderEditableList('weaknesses', 'Point Faible', false, true);
    renderInventory();
}

function renderEditableList(key, placeholder, hasDescription = false, isTextOnly = false) {
    const containerId = `${key.replace('.', '-')}-container`;
    const container = document.getElementById(containerId);

    if (!container) return;
    const path = key.split('.');
    const data = path.reduce((obj, prop) => (obj ? obj[prop] : undefined), gameState.character) || [];

    const isGeneralInventory = (key === 'inventory.general');
    container.innerHTML = '';

    data.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `editable-list-item ${isGeneralInventory && item.isAvailable === false ? 'is-unavailable' : ''}`;

        const propertyToEdit = isTextOnly ? 'text' : 'name';
        const textValue = item[propertyToEdit] || '';

        let itemHTML = `
            <span class="item-name" 
                contenteditable="true" 
                spellcheck="false"
                onblur="updateCharacterItemText('${key}', ${item.id}, '${propertyToEdit}', this.textContent)"
                onkeydown="if(event.key==='Enter'){ this.blur(); event.preventDefault(); }">
                ${textValue}
            </span>`;

        if (item.value !== undefined) {
            itemHTML += `<input type="number" value="${item.value}" onchange="updateCharacterItemValue('${key}', ${item.id}, this.value)">`;
        }
        if (item.description) {
            itemHTML += `<span>- <i>
                <span contenteditable="true"
                    spellcheck="false"
                    onblur="updateCharacterItemText('${key}', ${item.id}, 'description', this.textContent)"
                    onkeydown="if(event.key==='Enter'){ this.blur(); event.preventDefault(); }">
                    ${item.description}
                </span>
            </i></span>`;
        }

        if (isGeneralInventory) {
            itemHTML += `
                <button class="card-button" onclick="toggleItemAvailability('${key}', ${item.id})" title="Rendre disponible/indisponible">
                    <svg style="width:16px; height:16px; fill:currentColor;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 158.8 17.9 198.8 0 256s17.9 97.2 47.4 143.4C96.5 443.2 161.2 480 288 480s191.5-36.8 238.6-80.6C558.1 353.2 576 313.2 576 256s-17.9-97.2-47.4-143.4C434.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64z"/></svg>
                </button>
            `;
        }

        itemHTML += `<button class="delete-item-btn" onclick="deleteCharacterItem('${key}', ${item.id})">&times;</button>`;
        itemDiv.innerHTML = itemHTML;
        container.appendChild(itemDiv);
    });

    const addFormContainerId = `add-${key.replace('.', '-')}-form-container`;
    const addFormContainer = document.getElementById(addFormContainerId);
    if (addFormContainer) {
        addFormContainer.innerHTML = `<button class="add-btn-round" onclick="showAddItemForm('${key}', '${placeholder}', ${hasDescription}, ${isTextOnly})" title="Ajouter un élément">+</button>`;
    }
}

window.toggleItemAvailability = async function (key, id) {
    let list;
    if (key.startsWith('inventory.')) {
        const category = key.split('.')[1];
        list = gameState.character.inventory[category];
    }
    const item = list.find(i => i.id === id);
    if (item) {
        item.isAvailable = !(item.isAvailable === true);
        await saveGameData();
        renderCharacterSheet();
    }
};

function renderHealthList(key, placeholder) {
    const container = document.getElementById(`${key}-container`);
    if (!container) return;
    const data = gameState.character[key] || [];
    container.innerHTML = '';

    if (data.length > 0) {
        const table = document.createElement('table');
        table.className = 'health-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>${placeholder}</th>
                    <th>Durée</th>
                    <th>Soins</th>
                    <th>Effets</th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span contenteditable="true" spellcheck="false" 
                        onblur="updateCharacterItemText('${key}', ${item.id}, 'name', this.textContent)">
                        ${item.name || ''}
                    </span>
                </td>
                <td>
                    <span contenteditable="true" spellcheck="false" 
                        onblur="updateCharacterItemText('${key}', ${item.id}, 'duration', this.textContent)">
                        ${item.duration || ''}
                    </span>
                </td>
                <td>
                    <span contenteditable="true" spellcheck="false" 
                        onblur="updateCharacterItemText('${key}', ${item.id}, 'care', this.textContent)">
                        ${item.care || ''}
                    </span>
                </td>
                <td>
                    <span contenteditable="true" spellcheck="false" 
                        onblur="updateCharacterItemText('${key}', ${item.id}, 'effects', this.textContent)">
                        ${item.effects || ''}
                    </span>
                </td>
                <td>
                    <button class="delete-item-btn" onclick="deleteCharacterItem('${key}', ${item.id})">&times;</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        container.appendChild(table);
    }

    const addFormContainer = document.getElementById(`add-${key}-form-container`);
    if (addFormContainer) {
        addFormContainer.innerHTML = `<button class="add-btn-round" onclick="showAddHealthForm('${key}', '${placeholder}')" title="Ajouter un élément">+</button>`;
    }
}

window.showAddHealthForm = (key, placeholder) => {
    const container = document.getElementById(`add-${key}-form-container`);
    container.innerHTML = `
        <div class="add-item-form health-form">
            <input type="text" id="new-health-name-${key}" placeholder="${placeholder} (ex: Bras cassé)">
            <input type="text" id="new-health-duration-${key}" placeholder="Depuis (ex: 3 jours)">
            <input type="text" id="new-health-care-${key}" placeholder="Soins (ex: Attelle)">
            <input type="text" id="new-health-effects-${key}" placeholder="Effets (ex: -20% tir)">
            <button class="action-button" onclick="handleAddHealth('${key}')">✔</button>
        </div>
    `;
};

window.handleAddHealth = async (key) => {
    const name = document.getElementById(`new-health-name-${key}`).value.trim();
    const duration = document.getElementById(`new-health-duration-${key}`).value.trim();
    const care = document.getElementById(`new-health-care-${key}`).value.trim();
    const effects = document.getElementById(`new-health-effects-${key}`).value.trim();

    // On accepte désormais les champs vides si l'un au moins est rempli
    if (!name && !duration && !care && !effects) {
        showToast("Veuillez remplir au moins un champ.", 'warning');
        return;
    }

    const newItem = { id: Date.now(), name, duration, care, effects };
    if (!gameState.character[key]) gameState.character[key] = [];
    gameState.character[key].push(newItem);
    await saveGameData();
    renderCharacterSheet();
};

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
        slot.className = `inventory-item-slot ${item.isAvailable === false ? 'is-unavailable' : ''}`;
        slot.innerHTML = `
            <div class="image-container">
                <img src="${getCloudUrl(item.img || 'images/placeholder_inventory.png')}" alt="${item.name}">
            </div>
            <span class="item-name"
                spellcheck="false"
                contenteditable="true"
                onblur="updateCharacterItemText('inventory.${category}', ${item.id}, 'name', this.textContent)"
                onkeydown="if(event.key==='Enter'){ this.blur(); event.preventDefault(); }">
                ${item.name}
            </span>
            <button class="delete-item-btn" onclick="deleteCharacterItem('inventory.${category}', ${item.id})" title="Supprimer cet objet">&times;</button>
            <button class="availability-toggle-btn" onclick="toggleItemAvailability('inventory.${category}', ${item.id})" title="Rendre disponible/indisponible">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 158.8 17.9 198.8 0 256s17.9 97.2 47.4 143.4C96.5 443.2 161.2 480 288 480s191.5-36.8 238.6-80.6C558.1 353.2 576 313.2 576 256s-17.9-97.2-47.4-143.4C434.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64z"/></svg>
            </button>
            <button class="change-img-btn" onclick="changeInventoryItemImage('${category}', ${item.id})" title="Changer l'image">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="width:12px; height:12px; fill:currentColor;"><path d="M448 80c8.8 0 16 7.2 16 16V415.8l-5-6.5-136-176c-4.5-5.9-11.6-9.3-19-9.3s-14.4 3.4-19 9.3L202 340.7l-30.5-42.7C167 291.7 159.8 288 152 288s-15 3.7-19.5 10.1l-80 112L48 416.3l0-.3V96c0-8.8 7.2-16 16-16H448zM64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm80 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/></svg>
            </button>
        `;
        container.appendChild(slot);
    });

    const addSlot = document.createElement('div');
    addSlot.className = 'inventory-item-slot add-item-slot';
    addSlot.style.cursor = 'pointer';
    addSlot.onclick = () => showAddItemForm(`inventory.${category}`, placeholder, false, false, true);
    addSlot.innerHTML = `
        <div class="add-slot-content">
            <span style="font-size: 3em;">+</span>
            <span style="font-size: 0.8em; text-transform: uppercase; font-weight: bold;">${placeholder}</span>
        </div>
    `;
    container.appendChild(addSlot);

    const addFormContainer = document.getElementById(`add-inventory-${category}-form-container`);
    if (addFormContainer) addFormContainer.innerHTML = '';
}

window.changeInventoryItemImage = function (category, id) {
    openImagePicker(async (newPath) => {
        const list = gameState.character.inventory[category];
        const item = list.find(i => i.id === id);
        if (item) {
            item.img = newPath;
            await saveGameData();
            renderCharacterSheet();
        }
    });
};

window.updateCharacterItemText = async function (key, id, property, newText) {
    const path = key.split('.');
    const list = path.reduce((obj, prop) => (obj ? obj[prop] : undefined), gameState.character);
    if (list && Array.isArray(list)) {
        const item = list.find(i => i.id === id);
        if (item) {
            item[property] = newText.trim();
            await saveGameData();
        }
    }
};

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
        formHTML += `<input type="text" id="${imgId}" placeholder="URL image (images/...)">`;
    } else if (!isTextOnly) {
        formHTML += `<input type="number" id="${valueId}" placeholder="Val" style="width: 80px;">`;
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
        showToast("Le nom ne peut pas être vide.", 'warning');
        return;
    }

    const newItem = { id: Date.now() };

    if (hasDescription) {
        newItem.name = name;
        newItem.description = document.getElementById(`new-item-desc-${key.replace('.', '-')}`).value;
    } else if (hasImage) {
        newItem.name = name;
        newItem.img = document.getElementById(`new-item-img-${key.replace('.', '-')}`).value;
        if (newItem.img && !newItem.img.startsWith('images/')) { newItem.img = 'images/' + newItem.img; }
        newItem.isAvailable = true;
    } else if (isTextOnly) {
        newItem.text = name;
        newItem.isAvailable = true;
    } else {
        newItem.name = name;
        const value = document.getElementById(`new-item-value-${key.replace('.', '-')}`).value;
        newItem.value = parseInt(value, 10) || 0;
    }

    let list;
    if (key.startsWith('inventory.')) {
        list = gameState.character.inventory[key.split('.')[1]];
    } else list = gameState.character[key];

    list.push(newItem);
    saveGameData();
    renderCharacterSheet();
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
    if (key.startsWith('inventory.')) list = gameState.character.inventory[key.split('.')[1]];
    else list = gameState.character[key];
    const index = list.findIndex(i => i.id === id);
    if (index > -1) {
        list.splice(index, 1);
        await saveGameData();
        renderCharacterSheet();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const moneyInput = document.getElementById('character-money');
    if (moneyInput) {
        moneyInput.addEventListener('change', async () => {
            const newAmount = parseFloat(moneyInput.value);
            if (!isNaN(newAmount)) {
                if (!gameState.character) gameState.character = {};
                gameState.character.money = newAmount;
                await saveGameData();
                moneyInput.value = newAmount.toFixed(2);
                showToast("Porte-monnaie mis à jour !", "success");
            } else {
                showToast("Veuillez entrer une valeur numérique valide.", 'error');
            }
        });
    }
});
