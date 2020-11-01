/* eslint-disable */
// DOM elements
const mapbox = document.getElementById('map');

const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYWJpc3dhczM5MSIsImEiOiJja2c3dmNmYXMwNGp1MnFteXh6NmR3ODNqIn0.lmFfnhoYLhDkfMgepKdCYA';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    //   center: [-118.113491, 34.111745],
    //   zoom: 10,
    scrollZoom: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current locations
    bounds.extend(loc.coordinates);

    map.fitBounds(bounds, {
      padding: {
        top: 200,
        bottom: 150,
        left: 100,
        right: 100
      }
    });
  });
};

// Delegation
if (mapbox) {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
}
