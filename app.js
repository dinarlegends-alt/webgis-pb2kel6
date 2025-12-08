// =========================
//  BASEMAP
// =========================
var map = L.map("map", { zoomControl: true })
    .setView([-7.2452, 112.7683], 16);

var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 20 }).addTo(map);

var satellite = L.tileLayer(
    "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    { maxZoom: 20 }
);

L.control.layers(
    { "OpenStreetMap": osm, "Citra Satelit": satellite },
    null,
    { collapsed: true }
).addTo(map);


// =========================
// GLOBAL VAR
// =========================
let bidangLayer, rwLayer;
let allFeatures = [];
let rwPolygons = [];


// =========================
// LOAD GEOJSON
// =========================

Promise.all([
    fetch("GEOJSONGOAT.geojson").then(r => r.json()),
    fetch("BATASRW.geojson").then(r => r.json())
]).then(([dataBidang, dataRW]) => {

    allFeatures = dataBidang.features;

    // Simpan poligon RW
    rwPolygons = dataRW.features.map(f => ({
        rw: String(f.properties.RW),
        poly: f.geometry
    }));

    // =========================
    //  ASSIGN RW OTOMATIS KE BIDANG (WAJIB)
    // =========================
    allFeatures.forEach(bid => {
        let bidangPoly = bid.geometry;

        rwPolygons.forEach(rw => {
            if (turf.booleanIntersects(rw.poly, bidangPoly)) {
                bid.properties.RW = rw.rw;
            }
        });
    });

    // =========================
    // TAMPILKAN BIDANG
    // =========================
    bidangLayer = L.geoJSON(allFeatures, {
        style: styleBidangDefault,
        onEachFeature: bidangEvents
    }).addTo(map);

    // =========================
    // TAMPILKAN BATAS RW
    // =========================
    rwLayer = L.geoJSON(dataRW, {
        style: {
            color: "#00695c",
            weight: 2,
            fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
            layer.bindTooltip(
                "RW " + feature.properties.RW,
                { permanent: true, direction: "center", className: "rw-label" }
            );
        }
    }).addTo(map);

    // =========================
    // POPULATE RW DROPDOWN
    // =========================
    let rwSelect = document.getElementById("filterRW");
    rwSelect.innerHTML = `<option value="all">Semua RW</option>`;

    let rwList = [...new Set(allFeatures.map(f => f.properties.RW))].sort((a, b) => a - b);
    rwList.forEach(rw => {
        rwSelect.innerHTML += `<option value="${rw}">RW ${rw}</option>`;
    });

    rwSelect.addEventListener("change", applyFilters);
    document.querySelectorAll(".filterKelas").forEach(c => c.addEventListener("change", applyFilters));
    document.querySelectorAll(".filterKondisi").forEach(c => c.addEventListener("change", applyFilters));

});


// =========================
//  STYLE
// =========================

function styleBidangDefault(feature) {
    let nilai = feature.properties.Nilai_Tnh;

    return {
        color: "#800000",
        weight: 0.4,
        fillColor: getColor(nilai),
        fillOpacity: 0.65
    };
}

function getColor(v) {
    if (v >= 15000000) return "#67000d";
    if (v >= 10000000) return "#a50f15";
    if (v >= 6000000) return "#cb181d";
    if (v >= 3000000) return "#fb6a4a";
    return "#fcbba1";
}


// =======================================
// INTERAKSI BIDANG (KLIK LANGSUNG)
// =======================================
function bidangEvents(feature, layer) {
    layer.on("click", function () {

        if (bidangLayer && bidangLayer.resetStyle) {
            bidangLayer.resetStyle();
        }

        this.setStyle({
            weight: 2,
            color: "#000",
            fillOpacity: 0.9
        });

        updateDetailPanel(feature.properties);
    });
}




// =========================
//  FILTER
// =========================

function applyFilters() {

    let selectedRW = document.getElementById("filterRW").value;
    let selectedKelas = [...document.querySelectorAll(".filterKelas:checked")]
        .map(x => Number(x.value));
    let selectedKondisi = [...document.querySelectorAll(".filterKondisi:checked")]
        .map(x => x.value);

    bidangLayer.clearLayers();

    let filtered = allFeatures.filter(f => {
        let p = f.properties;

        if (selectedRW !== "all" && String(p.RW) !== selectedRW) return false;
        if (selectedKelas.length > 0 && !selectedKelas.includes(p.klass)) return false;
        if (selectedKondisi.length > 0 && !selectedKondisi.includes(p.Kondisi)) return false;
        return true;
    });

    // Jika semua filter kosong, tampilkan seluruh bidang + tetap interaktif
    let toShow = (selectedRW === "all" && selectedKelas.length === 0 && selectedKondisi.length === 0)
        ? allFeatures
        : filtered;

    bidangLayer.addData(toShow);

    // APPLY ULANG CLICK EVENT
    bidangLayer.eachLayer(layer => {
        bidangEvents(layer.feature, layer);
    });

    updateStatistics(toShow);

    // Zoom RW
    if (selectedRW !== "all") {
        let rwMatch = rwLayer.getLayers().find(l => l.feature.properties.RW == selectedRW);
        if (rwMatch) map.fitBounds(rwMatch.getBounds());
    }
}



// =========================
// DETAIL PANEL
// =========================
function updateDetailPanel(p) {
    document.getElementById("detailPanel").innerHTML = `
        <b>NIB:</b> ${p.NIB}<br>
        <b>Kelurahan:</b> ${p.Kelurahan}<br>
        <b>Kecamatan:</b> ${p.Kecamatan}<br>
        <b>Nilai Tanah:</b> Rp ${p.Nilai_Tnh.toLocaleString()}<br>
        <b>Luas:</b> ${p.Luas} m²<br>
        <b>Kondisi:</b> ${p.Kondisi}<br>
        <b>Kelas:</b> ${p.klass}<br>
        <b>RW:</b> ${p.RW}
    `;
}


// =========================
// STATISTIK
// =========================

function updateStatistics(list) {
    if (!list.length) {
        statJumlah.innerText = "-";
        statMin.innerText = "-";
        statMax.innerText = "-";
        statAvg.innerText = "-";
        return;
    }

    let values = list.map(f => f.properties.Nilai_Tnh);
    statJumlah.innerText = list.length;
    statMin.innerText = "Rp " + Math.min(...values).toLocaleString();
    statMax.innerText = "Rp " + Math.max(...values).toLocaleString();
    statAvg.innerText = "Rp " + Math.round(values.reduce((a, b) => a + b, 0) / values.length).toLocaleString();
}
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "info legend");

    let grades = [0, 3000000, 6000000, 10000000, 15000000];
    let labels = ["< 3 jt", "3–6 jt", "6–10 jt", "10–15 jt", "> 15 jt"];

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            `<i style="background:${getColor(grades[i] + 1)}"></i> ${labels[i]}<br>`;
    }

    return div;
};

legend.addTo(map);
