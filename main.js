import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v9",
  center: [13.38, 52.49],
  zoom: 11
});

// When a click event occurs on a feature in the places layer, open a popup at the
// location of the feature, with description HTML from its properties.
map.on("click", "trees", function(e) {
  var coordinates = e.features[0].geometry.coordinates.slice();
  const properties = e.features[0].properties;
  const keys = Object.keys(properties);
  const rows = keys.map(key => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.innerText = key;
    const td = document.createElement("td");
    td.innerText = properties[key];
    tr.appendChild(th);
    tr.appendChild(td);
    return tr;
  });
  const table = document.createElement("table");
  rows.forEach(row => table.appendChild(row));

  // Ensure that if the map is zoomed out such that multiple
  // copies of the feature are visible, the popup appears
  // over the copy being pointed to.
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setDOMContent(table)
    .addTo(map);
});

// Change the cursor to a pointer when the mouse is over the places layer.
map.on("mouseenter", "trees", function() {
  map.getCanvas().style.cursor = "pointer";
});

// Change it back to a pointer when it leaves.
map.on("mouseleave", "trees", function() {
  map.getCanvas().style.cursor = "";
});

const counter = document.createElement("div");
counter.style.position = "absolute";
counter.style.top = 0;
counter.style.left = 0;
counter.style.padding = "10px";
counter.style.background = "white";
document.body.appendChild(counter);

function loadAndAdd(url, collectedTrees) {
  fetch(url)
    .then(resp => resp.json())
    .then(trees => {
      if (trees.count > 5000) {
	counter.innerText = `⚠️  zu viele 🌳 (${trees.count})`
        return;
      }
      const nextTrees = collectedTrees
        ? {
            ...collectedTrees,
            features: [...collectedTrees.features, ...trees.features]
          }
        : trees;
      if (trees.next) {
        loadAndAdd(trees.next, nextTrees);
      } else {
        counter.innerText = `${nextTrees.features.length} 🌳 geladen`;
        map.addLayer({
          id: "trees",
          type: "circle",
          source: {
            type: "geojson",
            data: nextTrees
          }
        });
      }
    });
}

const addGenusFilter = (names, callback, offsetTop) => {
  const input = document.createElement("select");
  const options = names.map(tree => {
    const option = document.createElement("option");
    option.innerText = tree;
    option.value = tree;
    return option;
  });

  options.forEach(option => input.appendChild(option));
  input.style.position = "absolute";
  input.style.top = offsetTop;
  input.style.right = 0;
  document.body.appendChild(input);
  input.onchange = callback;
};

const genusData = require("./data/genus.json");
addGenusFilter(genusData, event => filterStringColumn("genus", event.target.value), 0);

const speciesData = require("./data/species.json");
addGenusFilter(speciesData, event => filterStringColumn("species", event.target.value), 50);

const filterStringColumn = (column, name) => {
  if (map.getLayer("trees")) map.removeLayer("trees");
  if (map.getSource("trees")) map.removeSource("trees");
  loadAndAdd(
    `https://trees.codefor.de/api/v2/trees/?page_size=1000&${column}__iexact=${name}`
  );
};
