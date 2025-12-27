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
   UTILITAIRES
========================= */
function stockKey(marque, poids) {
    return `stock_${marque}_${poids}`;
}

function archiveKey(date) {
    return `archive_${date}`;
}

/* =========================
   GESTION DES MARQUES ET POIDS
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
    if (isNaN(qte) || qte < 0) { alert("Quantité invalide"); return; }
    localStorage.setItem(stockKey(marque, poids), qte);
    afficherStock();
    alert("Stock mis à jour !");
}

/* =========================
   ENREGISTRER VENTE ET ARCHIVES
========================= */
function enregistrerVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    const qte = parseInt(document.getElementById("quantite").value);
    if (isNaN(qte) || qte <= 0) { alert("Quantité invalide"); return; }

    const key = stockKey(marque, poids);
    let stock = parseInt(localStorage.getItem(key)) || 0;
    if (qte > stock) { alert("Stock insuffisant !"); return; }

    localStorage.setItem(key, stock - qte);

    const prix = produits[marque].poids[poids];
    const total = prix * qte;

    // Mettre à jour chiffre global
    let chiffre = parseInt(localStorage.getItem("chiffre")) || 0;
    chiffre += total;
    localStorage.setItem("chiffre", chiffre);

    // Enregistrement dans les archives
    const date = new Date().toISOString().split("T")[0];
    const heure = new Date().toLocaleTimeString("fr-FR");
    const utilisateur = document.getElementById("vendeur").value;

    let archive = JSON.parse(localStorage.getItem(archiveKey(date))) || [];
    archive.push({
        heure,
        utilisateur,
        marque: produits[marque].label,
        poids,
        qte,
        prix,
        total
    });
    localStorage.setItem(archiveKey(date), JSON.stringify(archive));

    afficherStock();
    afficherChiffre();
    document.getElementById("quantite").value = "";
    document.getElementById("total").value = "";
    alert("Vente enregistrée avec succès !");
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
   AFFICHAGE ARCHIVES
========================= */
function afficherArchiveJour() {
    const date = document.getElementById("archive-date").value;
    const tbody = document.getElementById("archive-table");
    tbody.innerHTML = "";
    let totalJour = 0;
    if (!date) return;
    const archive = JSON.parse(localStorage.getItem(archiveKey(date))) || [];
    archive.forEach(v => {
        totalJour += v.total;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${v.heure}</td>
            <td>${v.utilisateur}</td>
            <td>${v.marque}</td>
            <td>${v.poids} kg</td>
            <td>${v.qte}</td>
            <td>${v.prix}</td>
            <td>${v.total}</td>
        `;
        tbody.appendChild(tr);
    });
    document.getElementById("archive-total").textContent = totalJour + " FCFA";
}

/* =========================
   RÉINITIALISATIONS
========================= */
function reinitialiserVentes() {
    if(confirm("Voulez-vous vraiment réinitialiser toutes les ventes ?")) {
        Object.keys(localStorage).forEach(key => {
            if(key.startsWith("archive_")) localStorage.removeItem(key);
        });
        localStorage.setItem("chiffre", 0);
        afficherChiffre();
        document.getElementById("archive-table").innerHTML = "";
        document.getElementById("archive-total").textContent = "0 FCFA";
        alert("Ventes réinitialisées !");
    }
}

function reinitialiserStock() {
    if(confirm("Voulez-vous vraiment réinitialiser tout le stock ?")) {
        Object.keys(localStorage).forEach(key => {
            if(key.startsWith("stock_")) localStorage.removeItem(key);
        });
        afficherStock();
        alert("Stock réinitialisé !");
    }
}

function reinitialiserTout() {
    if(confirm("Voulez-vous vraiment tout réinitialiser ?")) {
        localStorage.clear();
        afficherStock();
        afficherChiffre();
        document.getElementById("archive-table").innerHTML = "";
        document.getElementById("archive-total").textContent = "0 FCFA";
        alert("Toutes les données ont été réinitialisées !");
    }
}

/* =========================
   NAVIGATION ENTRE SECTIONS
========================= */
function showSection(id) {
    document.querySelectorAll(".section").forEach(s => s.style.display="none");
    document.getElementById(id).style.display = "block";
}

/* =========================
   INIT
========================= */
window.onload = () => {
    loadMarques();
    afficherStock();
    afficherChiffre();
}};
