/* =========================
   PRODUITS & PRIX (FIXES)
========================= */
const produits = {
    oryx: { label: "Oryx", poids: { "3": 2000, "6": 4500, "12.5": 10000 } },
    benin: { label: "Bénin Petro", poids: { "3": 2000, "6": 4500, "12.5": 10000 } },
    jpn: { label: "JPN", poids: { "6": 4500, "12.5": 10000 } },
    puma: { label: "Puma", poids: { "6": 4500, "12.5": 10000 } },
    progaz: { label: "Pro Gaz", poids: { "6": 4500, "12.5": 10000 } }
};

/* =========================
   DATE & HEURE
========================= */
function updateDateTime() {
    document.getElementById("datetime").textContent =
        new Date().toLocaleString("fr-FR");
}
setInterval(updateDateTime, 1000);
updateDateTime();

/* =========================
   OUTILS
========================= */
function stockKey(marque, poids) {
    return `stock_${marque}_${poids}`;
}

/* =========================
   CHARGEMENT DES MARQUES
========================= */
function loadMarques() {
    const selects = ["gaz-type", "vente-gaz-type"];

    selects.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = "";
        for (let m in produits) {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = produits[m].label;
            select.appendChild(opt);
        }
        select.selectedIndex = 0;
    });

    updatePoidsStock();
    updatePoidsVente();
}

/* =========================
   POIDS STOCK
========================= */
function updatePoidsStock() {
    const marque = document.getElementById("gaz-type").value;
    const select = document.getElementById("gaz-poids");
    select.innerHTML = "";

    for (let p in produits[marque].poids) {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = `${p} kg`;
        select.appendChild(opt);
    }

    select.selectedIndex = 0;
}

/* =========================
   POIDS VENTE
========================= */
function updatePoidsVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const select = document.getElementById("vente-poids");
    select.innerHTML = "";

    for (let p in produits[marque].poids) {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = `${p} kg`;
        select.appendChild(opt);
    }

    select.selectedIndex = 0;
    updatePrix();
}

/* =========================
   PRIX & TOTAL
========================= */
function updatePrix() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    document.getElementById("prix-unitaire").value =
        produits[marque].poids[poids];
    updateTotal();
}

function updateTotal() {
    const prix = parseInt(document.getElementById("prix-unitaire").value) || 0;
    const qte = parseInt(document.getElementById("quantite").value) || 0;
    document.getElementById("total").value = prix * qte;
}

/* =========================
   AJOUT / MODIFICATION STOCK
========================= */
function ajouterStock() {
    const marque = document.getElementById("gaz-type").value;
    const poids = document.getElementById("gaz-poids").value;
    const qte = parseInt(document.getElementById("initial-qty").value);

    if (isNaN(qte) || qte < 0) {
        alert("Quantité invalide");
        return;
    }

    localStorage.setItem(stockKey(marque, poids), qte);
    afficherStock();
    alert("Stock mis à jour");
}

/* =========================
   ENREGISTRER VENTE
========================= */
function enregistrerVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    const qte = parseInt(document.getElementById("quantite").value);

    if (isNaN(qte) || qte <= 0) {
        alert("Quantité invalide");
        return;
    }

    const key = stockKey(marque, poids);
    let stock = parseInt(localStorage.getItem(key)) || 0;

    if (qte > stock) {
        alert("Stock insuffisant !");
        return;
    }

    localStorage.setItem(key, stock - qte);

    let chiffre = parseInt(localStorage.getItem("chiffre")) || 0;
    chiffre += produits[marque].poids[poids] * qte;
    localStorage.setItem("chiffre", chiffre);

    afficherStock();
    afficherChiffre();

    document.getElementById("quantite").value = "";
    document.getElementById("total").value = "";

    alert("Vente enregistrée avec succès");
}

/* =========================
   AFFICHAGE STOCK
========================= */
function afficherStock() {
    const tbody = document.getElementById("stock-table");
    tbody.innerHTML = "";

    for (let m in produits) {
        for (let p in produits[m].poids) {
            const q = parseInt(localStorage.getItem(stockKey(m, p))) || 0;
            const tr = document.createElement("tr");
            if (q < 5) tr.classList.add("low-stock");
            tr.innerHTML = `
                <td>${produits[m].label}</td>
                <td>${p} kg</td>
                <td>${q}</td>
            `;
            tbody.appendChild(tr);
        }
    }
}

/* =========================
   AFFICHAGE CHIFFRE
========================= */
function afficherChiffre() {
    document.getElementById("chiffre-total").textContent =
        (localStorage.getItem("chiffre") || 0) + " FCFA";
}

/* =========================
   INIT
========================= */
window.onload = () => {
    loadMarques();
    afficherStock();
    afficherChiffre();
};
