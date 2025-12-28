console.log("Script chargé !");

/* ========== PRODUITS & PRIX ========== */
const produits = {
    oryx: { label: "Oryx", poids: { "3": 2000, "6": 4500, "12.5": 10000 } },
    benin: { label: "Bénin Petro", poids: { "3": 2000, "6": 4500, "12.5": 10000 } },
    jpn: { label: "JPN", poids: { "6": 4500, "12.5": 10000 } },
    puma: { label: "Puma", poids: { "6": 4500, "12.5": 10000 } },
    progaz: { label: "Pro Gaz", poids: { "6": 4500, "12.5": 10000 } }
};

/* ========== UTILITAIRES ========== */
function stockKey(m, p) { return `stock_${m}_${p}`; }
function archiveJourKey(d) { return `archive_${d}`; }
function archiveMoisKey(m) { return `archive_month_${m}`; }
function archiveAnneeKey(a) { return `archive_year_${a}`; }

/* ========== DATE & HEURE ========== */
function updateDateTime() {
    const el = document.getElementById("datetime");
    if (el) el.textContent = new Date().toLocaleString("fr-FR");
}
updateDateTime();
setInterval(updateDateTime, 1000);

/* ========== INIT CHOIX ========== */
function loadMarques() {
    ["gaz-type","vente-gaz-type"].forEach(id => {
        const sel = document.getElementById(id);
        sel.innerHTML = "";
        for (let m in produits) {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = produits[m].label;
            sel.appendChild(opt);
        }
    });
    updatePoidsStock();
    updatePoidsVente();
}

/* ========== STOCK ========== */
function updatePoidsStock() {
    const marque = document.getElementById("gaz-type").value;
    const sel = document.getElementById("gaz-poids");
    sel.innerHTML = "";
    for (let p in produits[marque].poids) {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = `${p} kg`;
        sel.appendChild(opt);
    }
}

function ajouterStock() {
    const marque = document.getElementById("gaz-type").value;
    const poids = document.getElementById("gaz-poids").value;
    let ajout = parseInt(document.getElementById("initial-qty").value, 10);
    if (isNaN(ajout) || ajout <= 0) { alert("Quantité invalide"); return; }

    const key = stockKey(marque, poids);
    let stockActuel = parseInt(localStorage.getItem(key), 10) || 0;
    const nouveau = stockActuel + ajout;
    localStorage.setItem(key, nouveau);
    afficherStock();
    document.getElementById("initial-qty").value = "";
    alert(`Stock mis à jour : ${nouveau}`);
}

function afficherStock() {
    const tbody = document.getElementById("stock-table");
    tbody.innerHTML = "";
    for (let m in produits) {
        for (let p in produits[m].poids) {
            const q = parseInt(localStorage.getItem(stockKey(m,p)),10)||0;
            const tr = document.createElement("tr");
            if (q<5) tr.classList.add("low-stock");
            tr.innerHTML = `<td>${produits[m].label}</td><td>${p} kg</td><td>${q}</td>`;
            tbody.appendChild(tr);
        }
    }
}

/* ========== VENTES ========== */
function updatePoidsVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const sel = document.getElementById("vente-poids");
    sel.innerHTML = "";
    for (let p in produits[marque].poids) {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = `${p} kg`;
        sel.appendChild(opt);
    }
    updatePrix();
}

function updatePrix() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    document.getElementById("prix-unitaire").value = produits[marque].poids[poids];
    updateTotal();
}

function updateTotal() {
    const prix = parseInt(document.getElementById("prix-unitaire").value,10)||0;
    const qte = parseInt(document.getElementById("quantite").value,10)||0;
    document.getElementById("total").value = prix*qte;
}

function enregistrerVente() {
    const marque = document.getElementById("vente-gaz-type").value;
    const poids = document.getElementById("vente-poids").value;
    const qte = parseInt(document.getElementById("quantite").value,10);
    if (isNaN(qte)||qte<=0){ alert("Quantité invalide"); return; }

    const key = stockKey(marque,poids);
    let stock = parseInt(localStorage.getItem(key),10)||0;
    if(qte>stock){ alert("Stock insuffisant"); return; }
    localStorage.setItem(key,stock-qte);

    const prix = produits[marque].poids[poids];
    const total = prix*qte;
    let chiffre = parseInt(localStorage.getItem("chiffre"),10)||0;
    chiffre += total;
    localStorage.setItem("chiffre",chiffre);

    const date = new Date().toISOString().split("T")[0];
    const heure = new Date().toLocaleTimeString("fr-FR");
    const user = document.getElementById("vendeur").value;
    let jour = JSON.parse(localStorage.getItem(archiveJourKey(date)))||[];
    jour.push({heure,user,marque:produits[marque].label,poids,qte,prix,total});
    localStorage.setItem(archiveJourKey(date),JSON.stringify(jour));

    const mois = date.slice(0,7);
    let am = JSON.parse(localStorage.getItem(archiveMoisKey(mois)))||{total:0,ventes:0};
    am.total += total; am.ventes += qte;
    localStorage.setItem(archiveMoisKey(mois),JSON.stringify(am));

    const an = date.slice(0,4);
    let ay = JSON.parse(localStorage.getItem(archiveAnneeKey(an)))||{total:0,ventes:0};
    ay.total += total; ay.ventes += qte;
    localStorage.setItem(archiveAnneeKey(an),JSON.stringify(ay));

    afficherStock(); afficherChiffre();
    document.getElementById("quantite").value=""; document.getElementById("total").value="";
    afficherArchive(currentArchiveType);
    alert("Vente enregistrée !");
}

/* ========== ARCHIVES ========== */
let currentArchiveType='jour';
function switchArchive(t){ currentArchiveType=t;
document.querySelectorAll("#archive-tabs button").forEach(b=>b.classList.remove("active"));
document.getElementById(`tab-${t}`).classList.add("active");
afficherArchive(t);
}

function afficherArchive(type){
    const tbody=document.getElementById("archive-table"); tbody.innerHTML="";
    const date=document.getElementById("archive-date").value;
    if(!date)return;
    if(type==="jour"){
        const arr=JSON.parse(localStorage.getItem(archiveJourKey(date)))||[];
        let sum=0; arr.forEach(v=>{
            sum+=v.total;
            const tr=document.createElement("tr");
            tr.innerHTML=`<td>${v.heure}</td><td>${v.user}</td><td>${v.marque}</td><td>${v.poids} kg</td><td>${v.qte}</td><td>${v.prix}</td><td>${v.total}</td>`;
            tbody.appendChild(tr);
        });
        document.getElementById("archive-total").textContent=sum+" FCFA";
    }
    if(type==="mois"){
        const m=date.slice(0,7);
        const obj=JSON.parse(localStorage.getItem(archiveMoisKey(m)))||{total:0,ventes:0};
        tbody.innerHTML=`<tr><td colspan="6">Total ventes du mois</td><td>${obj.total} FCFA (${obj.ventes})</td></tr>`;
        document.getElementById("archive-total").textContent=obj.total+" FCFA";
    }
    if(type==="annee"){
        const a=date.slice(0,4);
        const obj=JSON.parse(localStorage.getItem(archiveAnneeKey(a)))||{total:0,ventes:0};
        tbody.innerHTML=`<tr><td colspan="6">Total ventes de l'année</td><td>${obj.total} FCFA (${obj.ventes})</td></tr>`;
        document.getElementById("archive-total").textContent=obj.total+" FCFA";
    }
}

function afficherChiffre(){document.getElementById("chiffre-total").textContent=(localStorage.getItem("chiffre")||0)+" FCFA";}
function reinitialiserVentes(){ if(!confirm("Réinitialiser toutes les ventes ?"))return; Object.keys(localStorage).forEach(k=>{ if(k.startsWith("archive_")||k==="chiffre")localStorage.removeItem(k)}); afficherChiffre(); document.getElementById("archive-table").innerHTML=""; document.getElementById("archive-total").textContent="0 FCFA"; alert("Ventes effacées"); }
function reinitialiserStock(){ if(!confirm("Réinitialiser le stock ?"))return; Object.keys(localStorage).forEach(k=>{ if(k.startsWith("stock_"))localStorage.removeItem(k)}); afficherStock(); alert("Stock effacé"); }
function reinitialiserTout(){ if(!confirm("Effacer toutes les données ?"))return; localStorage.clear(); afficherStock(); afficherChiffre(); document.getElementById("archive-table").innerHTML=""; document.getElementById("archive-total").textContent="0 FCFA"; alert("Toutes les données effacées"); }
function showSection(id){document.querySelectorAll(".section").forEach(s=>s.style.display="none"); document.getElementById(id).style.display="block";}
window.onload=()=>{loadMarques(); afficherStock(); afficherChiffre(); showSection("stock-section");};};