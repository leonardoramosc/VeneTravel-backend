/* eslint-disable */
const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoibGVvcnJjIiwiYSI6ImNrdTJyYW95ajE0OTEydXFyemY5OXlhcnIifQ.LiuRx4U-qGo6QavObqfo1w';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/leorrc/cku2u9zvm013f17mcy9i76rme',
  scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // add marker
  const markerEl = document.createElement('div');
  markerEl.className = 'marker';

  new mapboxgl.Marker({
    element: markerEl,
    anchor: 'bottom',
  }).setLngLat(loc.coordinates).addTo(map);

  new mapboxgl.Popup({
    offset: 30
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100
  }
});
