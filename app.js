//--------------------------------------
// ATTRIBUTE HELPERS
//--------------------------------------
function getProp(p, keys, fallback=null){
  for(const k of keys){
    if(p[k] !== undefined && p[k] !== null && p[k] !== "") return p[k];
  }
  return fallback;
}

function getNBT(p){ return Number(getProp(p, ["NBT","nbt","nilai"], 0)); }
function getNIB(p){ return getProp(p, ["NIB","nib","id"], "-"); }
function getKec(p){ return getProp(p, ["kecamatan","KECAMATAN","Kec"], "Tidak diketahui"); }
function getJalan(p){ return getProp(p, ["jalan","JALAN"], "-"); }
function getLahan(p){ return getProp(p, ["lahan","LAHAN","Penggunaan"], "-"); }

function getZona(p){
  const v = getNBT(p);
  if(v < 3000000) return "< 3 juta";
  if(v < 6000000) return "3 – 6 juta";
  if(v < 10000000) return "6 – 10 juta";
  return "> 10 juta";
}

//--------------------------------------
// INIT MAP (AUTO ZOOM SURABAYA)
//--------------------------------------
const map = L.map("map").setView([-7.2653, 112.7341], 12);

//--------------------------------------
// BASEMAP (TERMUKA VISUAL AERIAL)
//--------------------------------------
const baseLayers = {

  "OpenStreetMap": L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19 }
  ),

  "Esri Aerial (World Imagery)": L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 20 }
  ),

  "Google Satellite": L.tileLayer(
    "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    { maxZoom: 20 }
  ),

  "Google Hybrid": L.tileLayer(
    "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    { maxZoom: 20 }
  )
};

baseLayers["OpenStreetMap"].addTo(map);

//--------------------------------------
// CHOROPLETH STYLE
//--------------------------------------
function getColor(nbt){
  return nbt > 15000000 ? "#08306b" :
         nbt > 10000000 ? "#2171b5" :
         nbt >  6000000 ? "#6baed6" :
         nbt >  3000000 ? "#bdd7e7" :
                          "#eff3ff";
}

function styleFeature(f){
  return {
    fillColor: getColor(getNBT(f.properties)),
    weight: 1,
    color: "#555",
    fillOpacity: 0.7
  };
}

//--------------------------------------
const kecGroups = new Map();
const zonaGroups = new Map();
let allLayers = [];
let geojsonLayer;

// highlight events
function highlightFeature(e){
  e.target.setStyle({ weight:3, color:"#000", fillOpacity:0.9 });
}
function resetHighlight(e){
  geojsonLayer.resetStyle(e.target);
}

//--------------------------------------
// LOAD GEOJSON
//--------------------------------------
function onEachFeature(feature, layer){
  const p = feature.properties;

  layer.bindPopup(`
    <b>NIB:</b> ${getNIB(p)}<br>
    <b>Kecamatan:</b> ${getKec(p)}<br>
    <b>Jalan:</b> ${getJalan(p)}<br>
    <b>Zona:</b> ${getZona(p)}<br>
    <b>NBT:</b> Rp ${getNBT(p).toLocaleString()}
  `);

  layer.on({ mouseover:highlightFeature, mouseout:resetHighlight });

  const kec = getKec(p);
  const zona = getZona(p);

  if(!kecGroups.has(kec)) kecGroups.set(kec, []);
  kecGroups.get(kec).push(layer);

  if(!zonaGroups.has(zona)) zonaGroups.set(zona, []);
  zonaGroups.get(zona).push(layer);

  allLayers.push(layer);
}

//--------------------------------------
fetch("SHPBIDANGTANAH.json")
  .then(r => r.json())
  .then(data => {
    // Jika datanya GeometryCollection (bukan FeatureCollection)
if (data.type === "GeometryCollection" && data.geometries) {

  data = {
    type: "FeatureCollection",
    features: data.geometries.map((geom, i) => ({
      type: "Feature",
      properties: { 
        id: i + 1,
        NBT: 0,
        kecamatan: "Tidak diketahui",
        jalan: "-",
        lahan: "-"
      },
      geometry: geom
    }))
  };

  console.log("Converted GeoJSON:", data);
}

    geojsonLayer = L.geoJSON(data, {
      style: styleFeature,
      onEachFeature
    }).addTo(map);

    L.control.layers(baseLayers, { "Nilai Tanah": geojsonLayer }).addTo(map);

    buildSidebar();
    addLegend();
  });

//--------------------------------------
// BUILD SIDEBAR
//--------------------------------------
function buildSidebar(){
  const listK = document.getElementById("listKecamatan");
  const listZ = document.getElementById("listZona");

  [...kecGroups.keys()].sort().forEach(k=>{
    const li = document.createElement("li");
    li.textContent = k;
    li.onclick = ()=> handleSidebarClick(k, "kec", li);
    listK.appendChild(li);
  });

  [...zonaGroups.keys()].sort().forEach(z=>{
    const li = document.createElement("li");
    li.textContent = z;
    li.onclick = ()=> handleSidebarClick(z, "zona", li);
    listZ.appendChild(li);
  });
}

function clearActive(){
  document.querySelectorAll("li.active").forEach(li => li.classList.remove("active"));
}

//--------------------------------------
// SIDEBAR CLICK → ZOOM + POPUP + DETAIL
//--------------------------------------
function handleSidebarClick(key, type, li){
  clearActive();
  li.classList.add("active");

  const layers = type==="kec" ? kecGroups.get(key) : zonaGroups.get(key);
  const fg = L.featureGroup(layers);

  map.fitBounds(fg.getBounds(), { padding:[25,25] });

  layers[0].openPopup();

  showDetailPanel(key, layers);
}

//--------------------------------------
// DETAIL PANEL
//--------------------------------------
const panel = document.getElementById("detailPanel");
document.getElementById("detailClose").onclick = ()=> panel.classList.remove("show");
document.getElementById("btnBatal").onclick = ()=> panel.classList.remove("show");

function showDetailPanel(title, layers){
  const p = layers[0].feature.properties;

  let vals = layers.map(l=>getNBT(l.feature.properties));
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  let avg = vals.reduce((a,b)=>a+b) / vals.length;

  document.getElementById("detailTitle").textContent = title;

  document.getElementById("detailContent").innerHTML = `
    <p><b>Jumlah bidang:</b> ${layers.length}</p>
    <p><b>Min:</b> Rp ${min.toLocaleString()}</p>
    <p><b>Max:</b> Rp ${max.toLocaleString()}</p>
    <p><b>Rata-rata:</b> Rp ${Math.round(avg).toLocaleString()}</p>
    <hr>
    <p><b>NIB:</b> ${getNIB(p)}</p>
    <p><b>Jalan:</b> ${getJalan(p)}</p>
    <p><b>Zona:</b> ${getZona(p)}</p>
    <p><b>NBT:</b> Rp ${getNBT(p).toLocaleString()}</p>
  `;

  document.getElementById("ratingInfo").innerHTML =
    `Menilai kelompok: <b>${title}</b>`;

  panel.classList.add("show");
}

document.getElementById("btnSubmit").onclick = ()=>{
  alert("Rating terkirim!");
};

//--------------------------------------
// LEGEND
//--------------------------------------
function addLegend(){
  const legend = L.control({ position:"bottomright" });

  legend.onAdd = ()=>{
    const div = L.DomUtil.create("div","legend");
    const grades=[0,3000000,6000000,10000000,15000000];

    div.innerHTML += "<b>Nilai Tanah (Rp)</b><br>";

    for(let i=0;i<grades.length;i++){
      div.innerHTML += `
        <i style="background:${getColor(grades[i]+1)}"></i>
        ${grades[i].toLocaleString()}
        ${grades[i+1] ? "–"+grades[i+1].toLocaleString()+"<br>" : "+" }
      `;
    }
    return div;
  };

  legend.addTo(map);
}

//--------------------------------------
// SIDEBAR COLLAPSE
//--------------------------------------
document.getElementById("toggleSidebar").onclick = ()=>{
  document.getElementById("sidebar").classList.toggle("collapsed");
  map.invalidateSize();
};
