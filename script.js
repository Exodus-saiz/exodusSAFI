console.log("Script chargé !");

/* =========================
   PRODUITS & PRIX
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
    const el = document.getElementById("datetime");
    if (!el) return;
    el.textContent = new Date().toLocaleString("fr-FR");
}
updateDateTime();
setInterval(updateDateTime, 1000);

/* =========================
   UTILITAIRES
========================= */
function stockKey(marque, poids) { return `stock_${marque}_${poids}`; }
function archiveJourKey(date) { return `archive_${date}`; }
function archiveMoisKey(anneeMois) { return `archive_month_${anneeMois}`; }
function archiveAnneeKey(annee) { return `archive_year_${annee}`; }

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
    });
    updatePoidsStock();
    updatePoidsVente();
}

/* =========================
   POIDS STOCK & VENTE
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
    updatePrix();
}

/* =========================
   PRIX & TOTAL
========================= */
function updatePrix() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    document.getElementById("prix-unitaire").value = produits[marque].poids[poids];
    updateTotal();
}

function updateTotal() {
    const prix = parseInt(document.getElementById("prix-unitaire").value) || 0;
    const qte = parseInt(document.getElementById("quantite").value) || 0;
    document.getElementById("total").value = prix * qte;
}

/* =========================
   STOCK CUMULATIF
========================= */
function ajouterStock() {
    const marque = document.getElementById("gaz-type").value;
    const poids = document.getElementById("gaz-poids").value;
    const ajout = parseInt(document.getElementById("initial-qty").value);

    if (isNaN(ajout) || ajout <= 0) { 
        alert("Quantité invalide"); 
        return; 
    }

    const key = stockKey(marque, poids);
    const stockActuel = parseInt(localStorage.getItem(key)) || 0;
    const nouveauStock = stockActuel + ajout;

    localStorage.setItem(key, nouveauStock);
    afficherStock();
    alert(`Stock mis à jour ! Nouveau stock : ${nouveauStock}`);
}

function afficherStock() {
    const tbody = document.getElementById("stock-table");
    tbody.innerHTML = "";
    for (let m in produits) {
        for (let p in produits[m].poids) {
            const q = parseInt(localStorage.getItem(stockKey(m, p))) || 0;
            const tr = document.createElement("tr");
            if (q < 5) tr.classList.add("low-stock");
            tr.innerHTML = `<td>${produits[m].label}</td><td>${p} kg</td><td>${q}</td>`;
            tbody.appendChild(tr);
        }
    }
}

/* =========================
   VENTES
========================= */
function enregistrerVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    const qte = parseInt(document.getElementById("quantite").value);

    if (isNaN(qte) || qte <= 0) { alert("Quantité invalide"); return; }

    const key = stockKey(marque, poids);
    const stock = parseInt(localStorage.getItem(key)) || 0;
    if (qte > stock) { alert("Stock insuffisant !"); return; }

    localStorage.setItem(key, stock - qte);

    const prix = produits[marque].poids[poids];
    const total = prix * qte;

    // Chiffre global
    let chiffre = parseInt(localStorage.getItem("chiffre")) || 0;
    chiffre += total;
    localStorage.setItem("chiffre", chiffre);

    // Archivage JOUR
    const date = new Date().toISOString().split("T")[0];
    const heure = new Date().toLocaleTimeString("fr-FR");
    const utilisateur = document.getElementById("vendeur").value;
    let archiveJour = JSON.parse(localStorage.getItem(archiveJourKey(date))) || [];
    archiveJour.push({ heure, utilisateur, marque: produits[marque].label, poids, qte, prix, total });
    localStorage.setItem(archiveJourKey(date), JSON.stringify(archiveJour));

    // Archivage MOIS
    const anneeMois = date.slice(0,7);
    let archiveMois = JSON.parse(localStorage.getItem(archiveMoisKey(anneeMois))) || { total:0, ventes:0 };
    archiveMois.total += total;
    archiveMois.ventes += qte;
    localStorage.setItem(archiveMoisKey(anneeMois), JSON.stringify(archiveMois));

    // Archivage ANNEE
    const annee = date.slice(0,4);
    let archiveAnnee = JSON.parse(localStorage.getItem(archiveAnneeKey(annee))) || { total:0, ventes:0 };
    archiveAnnee.total += total;
    archiveAnnee.ventes += qte;
    localStorage.setItem(archiveAnneeKey(annee), JSON.stringify(archiveAnnee));

    afficherStock();
    afficherChiffre();
    document.getElementById("quantite").value = "";
    document.getElementById("total").value = "";
    afficherArchive(currentArchiveType);
    alert("Vente enregistrée !");
}

/* =========================
   AFFICHAGE CHIFFRE
========================= */
function afficherChiffre() {
    document.getElementById("chiffre-total").textContent = (localStorage.getItem("chiffre") || 0) + " FCFA";
}

/* =========================
   AFFICHAGE ARCHIVES
========================= */
let currentArchiveType = 'jour';

function switchArchive(type) {
    currentArchiveType = type;
    document.querySelectorAll("#archive-tabs button").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`tab-${type}`).classList.add("active");
    afficherArchive(currentArchiveType);
}

function afficherArchive(type) {
    const tbody = document.getElementById("archive-table");
    tbody.innerHTML = "";

    if (type === "jour") {
        const date = document.getElementById("archive-date").value;
        if (!date) return;
        const archive = JSON.parse(localStorage.getItem(archiveJourKey(date))) || [];
        let total = 0;
        archive.forEach(v => {
            total += v.total;
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${v.heure}</td><td>${v.utilisateur}</td><td>${v.marque}</td><td>${v.poids} kg</td><td>${v.qte}</td><td>${v.prix}</td><td>${v.total}</td>`;
            tbody.appendChild(tr);
        });
        document.getElementById("archive-total").textContent = total + " FCFA";
    }

    if (type === "mois") {
        const date = document.getElementById("archive-date").value;
        if (!date) return;
        const anneeMois = date.slice(0,7);
        const archive = JSON.parse(localStorage.getItem(archiveMoisKey(anneeMois))) || { total:0, ventes:0 };
        tbody.innerHTML = `<tr><td colspan="6">Total ventes du mois</td><td>${archive.total} FCFA (${archive.ventes} bouteilles)</td></tr>`;
        document.getElementById("archive-total").textContent = archive.total + " FCFA";
    }

    if (type === "annee") {
        const date = document.getElementById("archive-date").value;
        if (!date) return;
        const annee = date.slice(0,4);
        const archive = JSON.parse(localStorage.getItem(archiveAnneeKey(annee))) || { total:0, ventes:0 };
        tbody.innerHTML = `<tr><td colspan="6">Total ventes de l'année</td><td>${archive.total} FCFA (${archive.ventes} bouteilles)</td></tr>`;
        document.getElementById("archive-total").textContent = archive.total + " FCFA";
    }
}

/* =========================
   RÉINITIALISATION
========================= */
function reinitialiserVentes() {
    if (!confirm("Réinitialiser toutes les ventes ?")) return;
    Object.keys(localStorage).forEach(k => { 
        if (k.startsWith("archive_") || k === "chiffre") localStorage.removeItem(k);
    });
    afficherChiffre();
    document.getElementById("archive-table").innerHTML = "";
    document.getElementById("archive-total").textContent = "0 FCFA";
    alert("Ventes réinitialisées !");
}

function reinitialiserStock() {
    if (!confirm("Réinitialiser tout le stock ?")) return;
    Object.keys(localStorage).forEach(k => { if (k.startsWith("stock_")) localStorage.removeItem(k); });
    afficherStock();
    alert("Stock réinitialisé !");
}

function reinitialiserTout() {
    if (!confirm("Réinitialiser toutes les données ?")) return;
    localStorage.clear();
    afficherStock();
    afficherChiffre();
    document.getElementById("archive-table").innerHTML = "";
    document.getElementById("archive-total").textContent = "0 FCFA";
    alert("Toutes les données ont été réinitialisées !");
}

/* =========================
   NAVIGATION
========================= */
function showSection(id) {
    document.querySelectorAll(".section").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";
}

/* =========================    afficherChiffre();