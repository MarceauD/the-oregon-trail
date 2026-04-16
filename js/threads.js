function renderThreads() {
    const threadContainer = document.getElementById('thread-container');
    if (!threadContainer) return;

    threadContainer.innerHTML = '';
    const searchTerm = document.getElementById('search-thread')?.value.toLowerCase() || '';
    const filteredThreads = gameState.threads.filter(t =>
        t.title.toLowerCase().includes(searchTerm) ||
        t.location.toLowerCase().includes(searchTerm)
    );

    filteredThreads.forEach((thread) => {
        const card = document.createElement('div');
        card.className = `card full-view-card status-${thread.status || 'en-cours'}`;
        card.dataset.id = thread.id;

        let eventsHtml = '';
        if (thread.events) {
            eventsHtml = `<ul>` + thread.events.map(event => `<li>${event}</li>`).join('') + `</ul>`;
        }

        let statusText = (thread.status || "").replace(/-/g, ' ');
        statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);

        let imgHtml = thread.img ? `<img src="${thread.img}" alt="${thread.title}" class="npc-portrait">` : `<img src="images/placeholder_thread.png" alt="Missing portrait" class="npc-portrait default">`;

        card.innerHTML = `
        <div class="card-content" style="padding: 15px;">
            ${imgHtml}
            <div class="card-text-container">
                <h3 style="margin-top:0; margin-bottom:5px;">${thread.title}</h3>
                <p style="color:var(--accent-color); font-weight:bold; font-size: 0.9em; margin-top:0; margin-bottom: 5px;">${thread.location}</p>
                <p style="color:var(--text-muted); font-size: 0.85em; font-style: italic; margin-top:0;">Statut: ${statusText}</p>
                <div style="margin-top: 15px;">
                    ${eventsHtml ? `<div style="margin-bottom:10px;"><strong>Événements :</strong>${eventsHtml}</div>` : ''}
                    <p>${thread.description}</p>
                </div>
            </div>
        </div>
        <div class="card-actions-bar">
            <div class="button-group">
                <button class="card-button" onclick="exportSingleItem('thread', ${thread.id})" title="Copier les détails">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H160V128H64z"/></svg>
                </button>
                <button class="card-button" onclick="openModal('thread', ${thread.id})" title="${isReadOnly ? 'Voir' : 'Modifier'}">
                         ${isReadOnly ?
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 158.8 17.9 198.8 0 256s17.9 97.2 47.4 143.4C96.5 443.2 161.2 480 288 480s191.5-36.8 238.6-80.6C558.1 353.2 576 313.2 576 256s-17.9-97.2-47.4-143.4C434.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0z"/></svg>' :
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>'}
                </button>
                ${!isReadOnly ? `
                <button class="card-button delete-button" onclick="deleteItem('thread', ${thread.id})" title="Supprimer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                </button>` : ''}
            </div>
        </div>
        `;
        threadContainer.appendChild(card);
    });

    renderPlotIdeas();
}

function renderPlotIdeas() {
    const container = document.getElementById('plot-ideas-container');
    if (!container) return;

    container.innerHTML = '';
    
    // Migration logic if plotNotes is still a string
    if (typeof gameState.character.plotNotes === 'string') {
        if (gameState.character.plotNotes.trim() === "") {
            gameState.character.plotNotes = [];
        } else {
            gameState.character.plotNotes = [{
                id: Date.now(),
                text: gameState.character.plotNotes,
                done: false
            }];
        }
    }

    if (!gameState.character.plotNotes || gameState.character.plotNotes.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-style:italic; text-align:center; padding: 20px;">Aucune idée notée pour le moment.</p>';
        return;
    }

    gameState.character.plotNotes.forEach((idea) => {
        const item = document.createElement('div');
        item.className = `plot-idea-item ${idea.done ? 'done' : ''}`;
        
        item.innerHTML = `
            <input type="checkbox" ${idea.done ? 'checked' : ''} onchange="togglePlotIdea(${idea.id})" ${isReadOnly ? 'disabled' : ''}>
            <div class="plot-idea-content">
                <textarea 
                    oninput="updatePlotIdeaText(${idea.id}, this.value)" 
                    ${isReadOnly ? 'readonly' : ''}
                    placeholder="Votre idée..."
                    rows="1"
                    onkeyup="autoGrow(this)"
                >${idea.text}</textarea>
            </div>
            ${!isReadOnly ? `
                <button class="delete-idea-btn" onclick="deletePlotIdea(${idea.id})" title="Supprimer">
                    &times;
                </button>
            ` : ''}
        `;
        container.appendChild(item);
        
        // Initial auto-grow
        const textarea = item.querySelector('textarea');
        autoGrow(textarea);
    });
}

window.autoGrow = function(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight) + "px";
}

window.addPlotIdea = async function() {
    if (isReadOnly) return;
    
    if (!Array.isArray(gameState.character.plotNotes)) {
        gameState.character.plotNotes = [];
    }

    const newIdea = {
        id: Date.now(),
        text: "",
        done: false
    };

    gameState.character.plotNotes.push(newIdea);
    renderPlotIdeas();
    
    // Focus the new textarea
    setTimeout(() => {
        const textareas = document.querySelectorAll('#plot-ideas-container textarea');
        if (textareas.length > 0) {
            textareas[textareas.length - 1].focus();
        }
    }, 0);
};

window.togglePlotIdea = async function(id) {
    if (isReadOnly) return;
    const idea = gameState.character.plotNotes.find(i => i.id === id);
    if (idea) {
        idea.done = !idea.done;
        await saveGameData();
        renderPlotIdeas();
    }
};

window.updatePlotIdeaText = function(id, text) {
    if (isReadOnly) return;
    const idea = gameState.character.plotNotes.find(i => i.id === id);
    if (idea) {
        idea.text = text;
        // Simple debounced save without visual indicator
        clearTimeout(window.plotNotesSaveTimeout);
        window.plotNotesSaveTimeout = setTimeout(() => saveGameData(), 1000);
    }
};

window.deletePlotIdea = async function(id) {
    if (isReadOnly) return;
    if (!confirm("Supprimer cette idée ?")) return;
    gameState.character.plotNotes = gameState.character.plotNotes.filter(i => i.id !== id);
    await saveGameData();
    renderPlotIdeas();
};

document.addEventListener('DOMContentLoaded', () => {
    const searchThread = document.getElementById('search-thread');
    if (searchThread) {
        searchThread.addEventListener('input', () => {
            renderThreads();
        });
    }
});
