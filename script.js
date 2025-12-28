console.log("Script final chargé !");

// ACCÈS SÉCURISÉ
const urlParams = new URLSearchParams(window.location.search);
const accessKey = urlParams.get("access");
if(accessKey!=="oryx229"){
  document.getElementById("main-menu").style.display="none";
  document.getElementById("access-denied").style.display="block";
}

// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCFAkmwlIiygEKD2ZEXP29eOxkvK2RMfFs",
  authDomain: "exodus-safi-stock.firebaseapp.com",
  databaseURL: "https://exodus-safi-stock-default-rtdb.firebaseio.com",
  projectId: "exodus-safi-stock",
  storageBucket: "exodus-safi-stock.appspot.com",
  messagingSenderId: "611374713628",
  appId: "1:611374713628:web:97529b3c5a3fc25e8f08d9",
  measurementId: "G-X6KB7GN7M6"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.database();

// PRODUITS & PRIX
const produits = {
  oryx:{label:"Oryx",poids:{"3":2000,"6":4500,"12.5":10000}},
  benin:{label:"Bénin Petro",poids:{"3":2000,"6":4500,"12.5":10000}},
  jpn:{label:"JPN",poids:{"6":4500,"12.5":10000}},
  puma:{label:"Puma",poids:{"6":4500,"12.5":10000}},
  progaz:{label:"Pro Gaz",poids:{"6":4500,"12.5":10000}}
};

// DATE & HEURE
function updateDateTime(){ document.getElementById("datetime").textContent=new Date().toLocaleString("fr-FR"); }
updateDateTime(); setInterval(updateDateTime,1000);

// UTILITAIRES
function stockKey(marque,poids){return `stock_${marque}_${poids}`; }
function archiveKey(date){return `archive_${date}`; }

// CHARGEMENT MARQUES
function loadMarques(){
  ["gaz-type","vente-gaz-type"].forEach(id=>{
    const select=document.getElementById(id); select.innerHTML="";
    Object.keys(produits).forEach(m=>{
      const opt=document.createElement("option");
      opt.value=m; opt.textContent=produits[m].label;
      select.appendChild(opt);
    });
  });
  updatePoidsStock(); updatePoidsVente();
}

// POIDS
function updatePoidsStock(){ const m=document.getElementById("gaz-type").value; const s=document.getElementById("gaz-poids"); s.innerHTML=""; Object.keys(produits[m].poids).forEach(p=>{ const opt=document.createElement("option"); opt.value=p; opt.textContent=p+" kg"; s.appendChild(opt); }); }
function updatePoidsVente(){ const m=document.getElementById("vente-gaz-type").value; const s=document.getElementById("vente-poids"); s.innerHTML=""; Object.keys(produits[m].poids).forEach(p=>{ const opt=document.createElement("option"); opt.value=p; opt.textContent=p+" kg"; s.appendChild(opt); }); updatePrix(); }

// PRIX & TOTAL
function updatePrix(){ const m=document.getElementById("vente-gaz-type").value; const p=document.getElementById("vente-poids").value; document.getElementById("prix-unitaire").value=produits[m].poids[p]; updateTotal(); }
function updateTotal(){ const prix=parseInt(document.getElementById("prix-unitaire").value)||0; const qte=parseInt(document.getElementById("quantite").value)||0; document.getElementById("total").value=prix*qte; }

// STOCK + FIREBASE
function ajouterStock(){
  const m=document.getElementById("gaz-type").value;
  const p=document.getElementById("gaz-poids").value;
  const q=parseInt(document.getElementById("initial-qty").value);
  if(isNaN(q)||q<=0){ alert("Quantité invalide"); return; }
  const ref=db.ref(`stock/${m}/${p}`);
  ref.once("value").then(snap=>{ ref.set((snap.val()||0)+q); document.getElementById("initial-qty").value=""; });
}

// AFFICHAGE STOCK
function afficherStock(){
  const tbody=document.getElementById("stock-table");
  db.ref("stock").on("value",snap=>{ tbody.innerHTML=""; const data=snap.val()||{};
    Object.keys(produits).forEach(m=>{ Object.keys(produits[m].poids).forEach(p=>{
      const q=(data[m]&&data[m][p])||0;
      const tr=document.createElement("tr"); if(q<5) tr.classList.add("low-stock");
      tr.innerHTML=`<td>${produits[m].label}</td><td>${p} kg</td><td>${q}</td>`;
      tbody.appendChild(tr);
    }); });
  });
}

// VENTES
function enregistrerVente(){
  const m=document.getElementById("vente-gaz-type").value;
  const p=document.getElementById("vente-poids").value;
  const q=parseInt(document.getElementById("quantite").value);
  const u=document.getElementById("vendeur").value;
  if(isNaN(q)||q<=0){ alert("Quantité invalide"); return; }
  const stockRef=db.ref(`stock/${m}/${p}`);
  stockRef.once("value").then(snap=>{
    const stock=snap.val()||0; if(q>stock){ alert("Stock insuffisant"); return; }
    stockRef.set(stock-q);
    const prix=produits[m].poids[p]; const total=prix*q;
    const date=new Date().toISOString().split("T")[0]; const heure=new Date().toLocaleTimeString("fr-FR");
    db.ref(`archives/${date}`).push({heure,u,marque:produits[m].label,poids:p,qte:q,prix,total});
    db.ref("chiffre").transaction(v=>(v||0)+total);
    document.getElementById("quantite").value=""; document.getElementById("total").value="";
  });
}

// CHIFFRE
function afficherChiffre(){ db.ref("chiffre").on("value",snap=>{ document.getElementById("chiffre-total").textContent=(snap.val()||0)+" FCFA"; }); }

// ARCHIVES
function afficherArchiveJour(){ const date=document.getElementById("archive-date").value; const tbody=document.getElementById("archive-table"); tbody.innerHTML=""; if(!date) return;
db.ref(`archives/${date}`).once("value").then(snap=>{ let total=0; snap.forEach(c=>{ const v=c.val(); total+=v.total; tbody.innerHTML+=`<tr><td>${v.heure}</td><td>${v.u}</td><td>${v.marque}</td><td>${v.poids} kg</td><td>${v.qte}</td><td>${v.prix}</td><td>${v.total}</td></tr>`; }); document.getElementById("archive-total").textContent=total+" FCFA"; }); }

function afficherArchiveMois(){ const m=document.getElementById("archive-month").value; if(!m) return; const [y,mo]=m.split("-"); const tbody=document.getElementById("archive-table"); tbody.innerHTML=""; let total=0;
db.ref("archives").once("value").then(snap=>{ snap.forEach(d=>{ if(d.key.startsWith(`${y}-${mo}`)){ d.forEach(c=>{ const v=c.val(); total+=v.total; tbody.innerHTML+=`<tr><td>${v.heure}</td><td>${v.u}</td><td>${v.marque}</td><td>${v.poids} kg</td><td>${v.qte}</td><td>${v.prix}</td><td>${v.total}</td></tr>`; }); } }); document.getElementById("archive-total").textContent=total+" FCFA"; }); }

function afficherArchiveAnnee(){ const year=document.getElementById("archive-year").value; if(!year) return; const tbody=document.getElementById("archive-table"); tbody.innerHTML=""; let total=0;
db.ref("archives").once("value").then(snap=>{ snap.forEach(d=>{ if(d.key.startsWith(`${year}-`)){ d.forEach(c=>{ const v=c.val(); total+=v.total; tbody.innerHTML+=`<tr><td>${v.heure}</td><td>${v.u}</td><td>${v.marque}</td><td>${v.poids} kg</td><td>${v.qte}</td><td>${v.prix}</td><td>${v.total}</td></tr>`; }); } }); document.getElementById("archive-total").textContent=total+" FCFA"; }); }

// NAVIGATION
function showSection(id){ document.querySelectorAll(".section").forEach(s=>s.style.display="none"); document.getElementById(id).style.display="block"; }

// INIT
window.onload=()=>{
  loadMarques(); afficherStock(); afficherChiffre(); showSection("stock-section");
};