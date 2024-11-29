// Mapbox initialization
mapboxgl.accessToken =
  'pk.eyJ1IjoicmF5YXBhdGk0OSIsImEiOiJjbGVvMWp6OGIwajFpM3luNTBqZHhweXZzIn0.1r2DoIQ1Gf2K3e5WBgDNjA';

const mapContainer = document.getElementById('map-container');
const layerContainer = document.getElementById('layer-container');

const orthoCenter = [78.342262, 17.3922];
const orthoZoom = 17.5;

const polygonColors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#8A2BE2'];
const lineColors = ['#FF4500', '#1E90FF', '#32CD32', '#FF1493', '#00FA9A'];

let map;
let geojsonData = null;
let floorMarkers = [];
let polygonVisibility = {};
let selectedLocation = null;

// Initialize Mapbox map
function initializeMap() {
  map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: orthoCenter,
    zoom: orthoZoom,
  });

  map.on('load', () => {
    // Add raster tileset layer
    map.addSource('orthoTileset', {
      type: 'raster',
      url: 'mapbox://rayapati49.cu3id2po',
    });
    map.addLayer({
      id: 'orthoTilesetLayer',
      source: 'orthoTileset',
      type: 'raster',
      layout: { visibility: 'visible' },
    });

    // Load and add GeoJSON layers
    loadGeoJSONLayers();

    
  });
}

// Load GeoJSON data and create polygon and line layers
function loadGeoJSONLayers() {
  axios.get('/bundle/assets/orthoPolygon.geojson').then((response) => {
    const data = response.data;
    let polygonColorIndex = 0;
    let lineColorIndex = 0;

    data.features.map((feature, index) => {
      const layerName = feature.properties.layer || `Layer ${index + 1}`;
      let color;

      if (feature.geometry.type === 'Polygon') {
        color = polygonColors[polygonColorIndex % polygonColors.length];
        addLayer(layerName, feature, color, 'fill');
        polygonColorIndex++;
        addLayerCheckbox(layerName, color);
      } else if (feature.geometry.type === 'LineString') {
        color = lineColors[lineColorIndex % lineColors.length];
        addLayer(layerName, feature, color, 'line');
        lineColorIndex++;
      }

      polygonVisibility[layerName] = true;
      
    });
  });
}

// Add GeoJSON layer to the map
function addLayer(layerName, feature, color, type) {
  map.addSource(layerName, {
    type: 'geojson',
    data: feature,
  });

  if (type === 'fill') {
    map.addLayer({
      id: `${layerName}Fill`,
      type: 'fill',
      source: layerName,
      paint: { 'fill-color': color, 'fill-opacity': 0.5 },
      layout: { visibility: 'visible' },
    });
    map.addLayer({
      id: `${layerName}Outline`,
      type: 'line',
      source: layerName,
      paint: { 'line-color': color, 'line-width': 2 },
      layout: { visibility: 'visible' },
    });
  } else if (type === 'line') {
    map.addLayer({
      id: `${layerName}Line`,
      type: 'line',
      source: layerName,
      paint: { 'line-color': color, 'line-width': 4 },
      layout: { visibility: 'visible' },
    });
  }
}

// Load GeoJSON data and create markers
async function loadGeoJSONMarkers() {
  try {
    const response = await axios.get('/bundle/assets/globaledge_spaces.geojson');
    geojsonData = response.data;

    // Call the function to create the floor panel and return it
    const floorPanel = addPannel(geojsonData);
    return floorPanel;
  } catch (error) {
    console.error('Error fetching GeoJSON:', error);
  }
}

// Add floor panel (this function is unchanged)
function addPannel(geojsonData) {
  console.log(geojsonData);
  const floorPanel = document.createElement('div');
  floorPanel.className = 'floor-panel';
  floorPanel.style.marginLeft = '30px';
  floorPanel.style.paddingLeft = '4px';
  floorPanel.style.paddingRight = '20px';
  floorPanel.style.color = 'black';

  const ul = document.createElement('ul');
  ul.style.paddingLeft = '8px';
  ul.style.margin = '5px';

  geojsonData.floors.forEach((floor, index) => {
    const li = document.createElement('li');
    li.style.listStyle = 'none';

    const button = document.createElement('button');
    button.className = 'floors';
    button.textContent = floor;
    button.onclick = () => handleFloorSelection(floor);

    li.appendChild(button);
    ul.appendChild(li);
  });

  floorPanel.appendChild(ul);
  return floorPanel;
}

// Add checkbox for toggling layer visibility
async function addLayerCheckbox(layerName, color) {
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  const colorBox = document.createElement('div');
  colorBox.style.backgroundColor = color;
  colorBox.className = 'layer-color-box';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = true;
  checkbox.addEventListener('change', () => toggleLayerVisibility(layerName));

  const label = document.createElement('label');
  label.textContent = layerName;
  container.appendChild(checkbox);
  container.appendChild(colorBox);
  container.appendChild(label);

  // Check if layerName is 'School' and fetch the floor panel
  if (layerName === 'School') {
    console.log(layerName);
    
    // Wait for the GeoJSON markers and floor panel to be loaded
    const floorPanel = await loadGeoJSONMarkers();
    console.log(floorPanel);

    if (floorPanel) {
      container.appendChild(floorPanel);  // Append the floor panel to the container
    }
  }

  layerContainer.appendChild(container);
}


// Toggle layer visibility
function toggleLayerVisibility(layerName) {
  const isVisible = !polygonVisibility[layerName];
  polygonVisibility[layerName] = isVisible;

  const visibility = isVisible ? 'visible' : 'none';

  map.setLayoutProperty(`${layerName}Fill`, 'visibility', visibility);
  map.setLayoutProperty(`${layerName}Outline`, 'visibility', visibility);
  map.setLayoutProperty(`${layerName}Line`, 'visibility', visibility);
}

// Handle floor selection and update markers
function handleFloorSelection(selectedFloor) {
  // Remove existing floor markers before adding new ones
  floorMarkers.forEach((marker) => marker.remove());

  // Filter features based on selected floor
  const filteredFeatures = geojsonData.features.filter(
    (feature) => feature.properties.Floor === selectedFloor
  );

  // Create markers for each feature
  floorMarkers = filteredFeatures.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const marker = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map);

    // Add click event listener to each marker
    marker.getElement().addEventListener('click', () => {
      selectedLocation = {
        name: feature.properties.Space,  // Log the 'Space' property
        floor: feature.properties.Floor,
        coordinates: [lng, lat],
      };

      // If you want to log just the 'Space' property, you can do this as well:
      console.log('Selected Space:', feature.properties.Space);
    });

    return marker;
  });
}

// Handle floor selection and update markers
function handleFloorSelection(selectedFloor) {
  // Remove existing floor markers before adding new ones
  floorMarkers.forEach((marker) => marker.remove());

  // Filter features based on selected floor
  const filteredFeatures = geojsonData.features.filter(
    (feature) => feature.properties.Floor === selectedFloor
  );

  // Create markers for each feature
  floorMarkers = filteredFeatures.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const marker = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map);

    // Add click event listener to each marker
    marker.getElement().addEventListener('click', () => {
      const selectedSpace = feature.properties.Space; // Get the 'Space' property
      selectedLocation = {
        name: selectedSpace,
        floor: feature.properties.Floor,
        coordinates: [lng, lat],
      };

      // Log the selected space
      console.log('Selected Space:', feature.properties.m);
      updateIframeSrc(feature.properties.m)
      openContainer();
    });

    return marker;
  });
}

// Function to update iframe source
function updateIframeSrc(value) {
  const iframe1 = document.getElementById('modelFrame');
  const iframe2 = document.getElementById('floorPlanFrame');

  
  // Define your mapping logic or rules to generate the new src URL
  const newSrc1 = `/bundle/showcase.html?m=${value}&applicationKey=h8m1gx75u1bezk7yaw7yggzwb&play=1`;
  const newSrc2 = `/bundle/showcase.html?m=${value}&applicationKey=h8m1gx75u1bezk7yaw7yggzwb&play=1`;


  // Update the iframe src attribute
  iframe1.src = newSrc1;
  iframe2.src = newSrc2

  // Log the updated src for debugging
  console.log('Updated iframe1 src:', newSrc1);
  console.log('Updated iframe1 src:', newSrc2);

}



// Initialize the map
initializeMap();
