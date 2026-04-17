function renderNpcs() {
    const npcContainer = document.getElementById('npc-container');
    if (!npcContainer) return;

    npcContainer.innerHTML = '';
    gameState.npcs.forEach((npc) => {
        const card = document.createElement('div');
        card.className = `card full-view-card status-${npc.status || 'vivant'}`; // New dynamic status class
        card.dataset.id = npc.id;

        let statusText = (npc.status || "").replace(/-/g, ' ');
        statusText = statusText.charAt(0).toUpperCase() + statusText.slice(1);

        let faitsHtml = '';
        if (npc.faitsMarquants && npc.faitsMarquants.trim() !== '') {
            const faitsContent = npc.faitsMarquants.replace(/\n/g, '<br>');
            faitsHtml = `<div class="card-section" style="margin-top: 15px;"><strong>Faits marquants :</strong><p>${faitsContent}</p></div>`;
        }

        let imgHtml = npc.img ? `<img src="${npc.img}" alt="${npc.name}" class="npc-portrait">` : `<img src="https://res.cloudinary.com/dg64n9fhe/image/upload/w_300,c_scale,f_auto,q_auto/v1776178797/f9zhxf8orfqhkjmu5b8p.jpg" alt="Missing portrait" class="npc-portrait default">`;

        card.innerHTML = `
            <div class="card-content">
                ${imgHtml}
                <div class="card-text-container">
                    <h3 class="npc-name">${npc.name}</h3>
                    <p class="npc-status-sober">Statut: ${statusText}</p>
                    <p class="npc-desc">${npc.description}</p>
                    ${faitsHtml}
                </div>
            </div>
            <div class="card-actions-bar">
                <div class="button-group">
                    <button class="card-button" onclick="openModal('npc', ${npc.id})" title="${isReadOnly ? 'Voir' : 'Modifier'}">
                        ${isReadOnly ?
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 158.8 17.9 198.8 0 256s17.9 97.2 47.4 143.4C96.5 443.2 161.2 480 288 480s191.5-36.8 238.6-80.6C558.1 353.2 576 313.2 576 256s-17.9-97.2-47.4-143.4C434.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0z"/></svg>' :
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>'}
                    </button>
                    <button class="card-button" onclick="exportSingleItem('npc', ${npc.id})" title="Copier les détails">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L400 115.9V320c0 8.8-7.2 16-16 16zM192 384H384c35.3 0 64-28.7 64-64V115.9c0-12.7-5.1-24.9-14.1-33.9L366.1 14.1c-9-9-21.2-14.1-33.9-14.1H192c-35.3 0-64 28.7-64 64V320c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16H160V128H64z"/></svg>
                    </button>
                    ${!isReadOnly ? `
                    <button class="card-button delete-button" onclick="deleteItem('npc', ${npc.id})" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                    </button>` : ''}
                </div>
            </div>
        `;
        npcContainer.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const searchNpc = document.getElementById('search-npc');
    if (searchNpc) {
        searchNpc.addEventListener('input', () => {
            const query = searchNpc.value.toLowerCase();
            const cards = document.querySelectorAll('#npc-container .card');
            cards.forEach(card => {
                const titleNode = card.querySelector('h3');
                const text = titleNode ? titleNode.textContent.toLowerCase() : '';
                card.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }
});
