const produits = {
    oryx: { label: "Oryx", poids: { "3": 2000, "6": 4500, "12.5": 10000 }},
    benin: { label: "Bénin Petro", poids: { "3": 2000, "6": 4500, "12.5": 10000 }},
    jpn: { label: "JPN", poids: { "6": 4500, "12.5": 10000 }},
    puma: { label: "Puma", poids: { "6": 4500, "12.5": 10000 }},
    progaz: { label: "Pro Gaz", poids: { "6": 4500, "12.5": 10000 }}
};

function updateDateTime() {
    document.getElementById("datetime").textContent =
        new Date().toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

function stockKey(marque, poids) {
    return `stock_${marque}_${poids}`;
}

function loadMarques() {
    ["gaz-type", "vente-gaz-type"].forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = "";
        for (let k in produits) {
            select.innerHTML += `<option value="${k}">${produits[k].label}</option>`;
        }
    });
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
}

function updatePoidsVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const select = document.getElementById("vente-poids");
    select.innerHTML = "";
    for (let p in produits[marque].poids) {
        select.innerHTML += `<option value="${p}">${p} kg</option>`;
    }
    updatePrix();
}

function updatePrix() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    const prix = produits[marque].poids[poids];
    document.getElementById("prix-unitaire").value = prix;
    updateTotal();
}

function updateTotal() {
    const prix = parseInt(document.getElementById("prix-unitaire").value) || 0;
    const qte = parseInt(document.getElementById("quantite").value) || 0;
    document.getElementById("total").value = prix * qte;
}

function ajouterStock() {
    const marque = document.getElementById("gaz-type").value;
    const poids = document.getElementById("gaz-poids").value;
    const qte = parseInt(document.getElementById("initial-qty").value) || 0;
    localStorage.setItem(stockKey(marque, poids), qte);
    afficherStock();
}

function enregistrerVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    const qte = parseInt(document.getElementById("quantite").value);
    const prix = produits[marque].poids[poids];
    const key = stockKey(marque, poids);
    let stock = parseInt(localStorage.getItem(key) || 0);

    if (qte > stock) {
        alert("Stock insuffisant !");
        return;
    }

    localStorage.setItem(key, stock - qte);

    let chiffre = parseInt(localStorage.getItem("chiffre") || 0);
    chiffre += prix * qte;
    localStorage.setItem("chiffre", chiffre);

    afficherStock();
    afficherChiffre();
    alert("Vente enregistrée");
}

function afficherStock() {
    const tbody = document.getElementById("stock-table");
    tbody.innerHTML = "";
    for (let m in produits) {
        for (let p in produits[m].poids) {
            const q = parseInt(localStorage.getItem(stockKey(m, p)) || 0);
            const tr = document.createElement("tr");
            if (q < 5) tr.classList.add("low-stock");
            tr.innerHTML = `<td>${produits[m].label}</td><td>${p} kg</td><td>${q}</td>`;
            tbody.appendChild(tr);
        }
    }
}

function afficherChiffre() {
    document.getElementById("chiffre-total").textContent =
        (localStorage.getItem("chiffre") || 0) + " FCFA";
}

window.onload = () => {
    loadMarques();
    afficherStock();
    afficherChiffre();
};};
