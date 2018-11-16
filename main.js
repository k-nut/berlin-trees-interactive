import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [13.38, 52.49],
  zoom: 11,
});

const counter = document.createElement('div');
counter.style.position = 'absolute';
counter.style.top = 0;
counter.style.left = 0;
counter.style.padding = '10px';
counter.style.backgrounrd = 'white';
document.body.appendChild(counter);

function loadAndAdd(url, collectedTrees) {
  fetch(url)
    .then(resp => resp.json())
    .then(trees => {
      if (trees.count > 5000) {
        console.warn(`Too many trees (${trees.count}), aborting load`);
        return;
      }
      const nextTrees = collectedTrees
        ? {
            ...collectedTrees,
            features: [...collectedTrees.features, ...trees.features],
          }
        : trees;
      if (trees.next) {
        loadAndAdd(trees.next.replace('http://', 'https://'), nextTrees);
      } else {
        counter.innerText = nextTrees.features.length;
        map.addLayer({
          id: 'trees',
          type: 'circle',
          source: {
            type: 'geojson',
            data: nextTrees,
          },
        });
      }
    });
}

const addGenusFilter = () => {
  const input = document.createElement('select');
  const options = ['BUXUS', 'CALOCEDRUS', 'CARAGANA', 'Prunus'].map(tree => {
    const option = document.createElement('option');
    option.innerText = tree;
    option.value = tree;
    return option;
  });

  options.forEach(option => input.appendChild(option));
  input.style.position = 'absolute';
  input.style.top = 0;
  input.style.right = 0;
  document.body.appendChild(input);
  input.onchange = event => filterGenus(event.target.value);
};

addGenusFilter();

const filterGenus = name => {
  if (map.getLayer('trees')) map.removeLayer('trees');
  if (map.getSource('trees')) map.removeSource('trees');
  loadAndAdd(
    `https://trees.codefor.de/api/v2/trees/?page_size=1000&genus=${name}`
  );
};
