import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [13.38, 52.49],
  zoom: 11
});


function loadAndAdd(url, count) {
  fetch(url)
    .then(resp => resp.json())
    .then((trees) => {
      console.log(trees.count);
      if (trees.count > 5000){
        console.warn("Too many trees, aborting load");
        return
      }
      map.addLayer({
          "id": `trees-${count}`,
          "type": "circle",
          source: {
            type: 'geojson',
            data: trees,
          }
        }
      );
      if (trees.next){
        console.log(trees.next);
        loadAndAdd(trees.next, Math.random());
      }

    })
}

loadAndAdd('https://trees.codefor.de/api/trees/?page_size=1000&district_id=Neukölln&genus_latin=POPULUS', 0);
