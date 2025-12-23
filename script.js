function loadMarques() {
    ["gaz-type", "vente-gaz-type"].forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = "";
        for (let k in produits) {
            select.innerHTML += `<option value="${k}">${produits[k].label}</option>`;
        }
    });
    // Sélection par défaut sur le premier
    document.getElementById("gaz-type").selectedIndex = 0;
    document.getElementById("vente-gaz-type").selectedIndex = 0;

    updatePoidsStock();
    updatePoidsVente();
}

function updatePoidsStock() {
    const marque = document.getElementById("gaz-type").value;
    const select = document.getElementById("gaz-poids");
    select.innerHTML = "";
    for (let p in produits[marque].poids) {
        select.innerHTML += `<option value="${p}">${p} kg</option>`;
    }
    // Sélection par défaut sur le premier
    select.selectedIndex = 0;
}

function updatePoidsVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const select = document.getElementById("vente-poids");
    select.innerHTML = "";
    for (let p in produits[marque].poids) {
        select.innerHTML += `<option value="${p}">${p} kg</option>`;
    }
    select.selectedIndex = 0;
    updatePrix();
}};};
