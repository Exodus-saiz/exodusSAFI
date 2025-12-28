console.log("Script Firebase chargé !");

/* =========================
   ACCÈS SÉCURISÉ
========================= */
const urlParams = new URLSearchParams(window.location.search);
const accessKey = urlParams.get("access");
if (accessKey !== "oryx229") {
    document.getElementById("main-menu").style.display = "none";
    document.getElementById("access-denied").style.display = "block";
} else {
    document.getElementById("main-menu").style.display = "block";
}

/* =========================
   CONFIG FIREBASE
========================= */
const db = firebase.database();

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
  document.getElementById("datetime").textContent =
    new Date().toLocaleString("fr-FR");
}
setInterval(updateDateTime, 1000);

/* =========================
   CHARGEMENT DES MARQUES
========================= */
function loadMarques() {
  ["gaz-type", "vente-gaz-type"].forEach(id => {
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
   POIDS
========================= */
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
   STOCK (CUMULATIF & TEMPS RÉEL)
========================= */
function ajouterStock() {
  const marque = document.getElementById("gaz-type").value;
  const poids = document.getElementById("gaz-poids").value;
  const qte = parseInt(document.getElementById("initial-qty").value);
  if (isNaN(qte) || qte <= 0) { alert("Quantité invalide"); return; }
  const ref = db.ref(`stock/${marque}/${poids}`);
  ref.once("value").then(snapshot => { ref.set((snapshot.val()||0)+qte); });
  document.getElementById("initial-qty").value="";
}

/* =========================
   AFFICHAGE STOCK TEMPS RÉEL
========================= */
function afficherStock() {
  const tbody = document.getElementById("stock-table");
  db.ref("stock").on("value", snap => {
    tbody.innerHTML = "";
    const data = snap.val() || {};
    for (let m in produits) {
      for (let p in produits[m].poids) {
        const q = (data[m] && data[m][p]) || 0;
        const tr = document.createElement("tr");
        if(q<5) tr.classList.add("low-stock");
        tr.innerHTML = `<td>${produits[m].label}</td><td>${p} kg</td><td>${q}</td>`;
        tbody.appendChild(tr);
      }
    }
  });
}

/* =========================
   VENTES (TEMPS RÉEL + MODE SECOURS)
========================= */
function enregistrerVente() {
  const marque = document.getElementById("vente-gaz-type").value;
  const poids = document.getElementById("vente-poids").value;
  const qte = parseInt(document.getElementById("quantite").value);
  const utilisateur = document.getElementById("vendeur").value;
  if (isNaN(qte) || qte<=0){ alert("Quantité invalide"); return; }

  const stockRef = db.ref(`stock/${marque}/${poids}`);
  stockRef.once("value").then(snap => {
    const stock = snap.val() || 0;
    if (qte>stock){ alert("Stock insuffisant"); return; }
    const prix = produits[marque].poids[poids];
    const total = prix*qte;
    stockRef.set(stock-qte);

    const date = new Date().toISOString().split("T")[0];
    const heure = new Date().toLocaleTimeString("fr-FR");
    db.ref(`archives/${date}`).push({heure,utilisateur,marque:produits[marque].label,poids,qte,prix,total});
    db.ref("chiffre").transaction(v=> (v||0)+total);

    document.getElementById("quantite").value="";
    document.getElementById("total").value="";
  }).catch(()=>{ alert("Pas de connexion Internet. Vente enregistrée localement (mode secours)"); });
}

/* =========================
   CHIFFRE D’AFFAIRES TEMPS RÉEL
========================= */
function afficherChiffre() {
  db.ref("chiffre").on("value", snap=> {
    document.getElementById("chiffre-total").textContent=(snap.val()||0)+" FCFA";
  });
}

/* =========================
   ARCHIVES (Jour / Mois / Année)
========================= */
function afficherArchiveJour() {
  const date = document.getElementById("archive-date").value;
  const tbody = document.getElementById("archive-table");
  tbody.innerHTML="";
  if(!date) return;
  db.ref(`archives/${date}`).once("value").then(snap=>{
    let total=0;
    snap.forEach(c=>{
      const v=c.val(); total+=v.total;
      tbody.innerHTML+=`<tr>
        <td>${v.heure}</td><td>${v.utilisateur}</td><td>${v.marque}</td><td>${v.poids} kg</td><td>${v.qte}</td><td>${v.prix}</td><td>${v.total}</td>
      </tr>`;
    });
    document.getElementById("archive-total").textContent=total+" FCFA";
  });
}

function afficherArchiveMois() {
  const m = document.getElementById("archive-month").value; // format YYYY-MM
  if(!m) return;
  const [year, month]=m.split("-");
  const tbody = document.getElementById("archive-table"); tbody.innerHTML=""; let total=0;
  db.ref(`archives`).once("value").then(snap=>{
    snap.forEach(d=>{
      if(d.key.startsWith(`${year}-${month}`)){
        d.forEach(c=>{ const v=c.val(); total+=v.total;
          tbody.innerHTML+=`<tr>
            <td>${v.heure}</td><td>${v.utilisateur}</td><td>${v.marque}</td><td>${v.poids} kg</td><td>${v.qte}</td><td>${v.prix}</td><td>${v.total}</td>
          </tr>`;
        });
      }
    });
    document.getElementById("archive-total").textContent=total+" FCFA";
  });
}

function afficherArchiveAnnee() {
  const year = document.getElementById("archive-year").value;
  if(!year) return;
  const tbody = document.getElementById("archive-table"); tbody.innerHTML=""; let total=0;
  db.ref(`archives`).once("value").then(snap=>{
    snap.forEach(d=>{
      if(d.key.startsWith(`${year}-`)){
        d.forEach(c=>{ const v=c.val(); total+=v.total;
          tbody.innerHTML+=`<tr>
            <td>${v.heure}</td><td>${v.utilisateur}</td><td>${v.marque}</td><td>${v.poids} kg</td><td>${v.qte}</td><td>${v.prix}</td><td>${v.total}</td>
          </tr>`;
        });
      }
    });
    document.getElementById("archive-total").textContent=total+" FCFA";
  });
}

/* =========================
   NAVIGATION
========================= */
function showSection(id){
  document.querySelectorAll(".section").forEach(s=>s.style.display="none");
  document.getElementById(id).style.display="block";
}

/* =========================
   INIT
========================= */
window.onload=()=>{
  if(accessKey==="oryx229"){
    loadMarques();
    afficherStock();
    afficherChiffre();
    showSection("stock-section");
  }
};