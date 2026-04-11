document.addEventListener('DOMContentLoaded', () => {
    const addCityForm = document.getElementById('add-city-form');
    if (!addCityForm) return;

    addCityForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const x = parseInt(document.getElementById('city-coord-x').value, 10);
        const y = parseInt(document.getElementById('city-coord-y').value, 10);
        const cityName = document.getElementById('city-name').value.trim();
        const cityType = document.getElementById('city-type').value;
        const labelPosition = document.getElementById('city-label-pos').value;

        if (isNaN(x) || isNaN(y)) { alert("Les coordonnées X et Y doivent être des nombres."); return; }

        const newCity = {
            id: Date.now(),
            city: cityName,
            x: x,
            y: y,
            type: cityType,
            labelPosition: labelPosition
        };

        if (!gameState.route) gameState.route = [];
        gameState.route.push(newCity);
        await saveGameData();

        renderRoute();
        addCityForm.reset();
        console.log("Nouvelle ville ajoutée :", newCity);
    });
});

window.renderRoute = function () {
    const svg = document.getElementById('route-svg');
    if (!svg) return;

    svg.innerHTML = '';
    const route = gameState.route || [];
    if (route.length === 0) return;

    if (route.length >= 2) {
        const points = route.map(p => `${p.x},${p.y}`).join(' ');
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', points);
        polyline.setAttribute('class', 'route-line');
        svg.appendChild(polyline);
    }

    route.forEach(point => {
        if (point.type !== 'etape') {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('class', `route-point ${point.type}`);

            let radius = 10;
            switch (point.type) {
                case 'capital': radius = 15; break;
                case 'small-town': radius = 5; break;
            }
            circle.setAttribute('r', radius);
            svg.appendChild(circle);
        }
    });

    route.forEach(point => {
        if (point.type !== 'etape') {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

            let xOffset = 0; let yOffset = 0; let textAnchor = 'start'; const margin = 25;

            switch (point.labelPosition) {
                case 'top': yOffset = -margin; textAnchor = 'middle'; break;
                case 'top-right': xOffset = margin / 2; yOffset = -margin / 2; textAnchor = 'start'; break;
                case 'right': xOffset = margin; yOffset = 5; textAnchor = 'start'; break;
                case 'bottom-right': xOffset = margin / 2; yOffset = margin * 1.5; textAnchor = 'start'; break;
                case 'bottom': yOffset = margin * 1.8; textAnchor = 'middle'; break;
                case 'bottom-left': xOffset = -margin / 2; yOffset = margin * 1.5; textAnchor = 'end'; break;
                case 'left': xOffset = -margin; yOffset = 5; textAnchor = 'end'; break;
                case 'top-left': xOffset = -margin / 2; yOffset = -margin / 2; textAnchor = 'end'; break;
                default: yOffset = margin * 1.8; textAnchor = 'middle';
            }

            text.setAttribute('x', point.x + xOffset);
            text.setAttribute('y', point.y + yOffset);
            text.setAttribute('text-anchor', textAnchor);
            text.setAttribute('class', `route-label ${point.type}`);
            text.textContent = point.city;
            svg.appendChild(text);
        }
    });
}
