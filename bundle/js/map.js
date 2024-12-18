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

// Modified addPannel function
function addPannel(geojsonData) {
  console.log(geojsonData);
  const floorPanel = document.createElement('div');
  floorPanel.className = 'floor-panel';
  floorPanel.style.marginLeft = '30px';
  floorPanel.style.marginTop = '15px';
  floorPanel.style.paddingLeft = '4px';
  floorPanel.style.paddingRight = '20px';
  floorPanel.style.color = 'black';

  const ul = document.createElement('ul');
  ul.style.paddingLeft = '8px';
  ul.style.margin = '15px';
  ul.style.marginTop = '8px';

  geojsonData.floors.forEach((floor, index) => {
    const li = document.createElement('li');
    li.style.listStyle = 'none';
    li.style.margin = '5px';
    

    const button = document.createElement('button');
    button.className = 'floors';
    button.textContent = floor;
    button.style.marginTop = '3px';
    
    button.onclick = () => handleFloorSelection(floor);

    // Create a nested list for sub-buttons
    const subUl = document.createElement('ul');
    subUl.style.paddingLeft = '20px'; // Indent sub-buttons

    // Example sub-buttons for each floor
    const subButtons = getSubButtonsForFloor(floor); // Function to get sub-buttons based on the floor

    subButtons.forEach(subButton => {
      const subLi = document.createElement('li');
      subLi.style.listStyle = 'none';
      
      subLi.style.marginTop = '3px';
      

      const modelButton = document.createElement('button');
      modelButton.className = 'model-button';
      modelButton.textContent = subButton.name;

      // Check if the subButton has a URL or modelId
      if (subButton.url) {
        
        modelButton.onclick = () => openModelViewerForFloor(subButton.name);
      } else {
        modelButton.onclick = () => openModelViewerForFloor(subButton.name);
      }

      subLi.appendChild(modelButton); // Append the model button to the sub-list item
      subUl.appendChild(subLi);
     
      //async handleFloorSelection(floor);

    });

    li.appendChild(button);
    li.appendChild(subUl); // Append the sub-button list to the floor button
    ul.appendChild(li);
  });

  floorPanel.appendChild(ul);
  return floorPanel;
}

// Function to get sub-buttons based on the floor
function getSubButtonsForFloor(floor) {
  const subButtons = {
    'Ground': [
      { name: 'ICT Lab', modelId: 'zQV33R4HsGA' },
      { name: 'Rest of Ground Floor', modelId: 'v1sp9avYgvY' },
      { name: 'Male Washroom', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34' },
      { name: 'Atrium', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69' },
      { name: 'Library', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=26&sr=-2.84,.65' },
      { name: 'Classroom Euro Seniors', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=70&sr=-2.59,-.97' },
      { name: 'Infirmary', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=81&sr=-.23,-1.16' },
      { name: 'Class Grade 10', url: 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=11&sr=-.55,-1.09' }

    ],
    'First': [
      { name: 'Dining Hall', modelId: 'Tqcgzn3Vfsv' },
      { name: 'Store', modelId: 'y7Z9Tt1weYt' },
    ],
    'Second': [{ name: 'Biology Lab', modelId: 'vywA6PDMhE7' },
      { name: 'MP Hall', modelId: '7EdA6zKCTwx' }]
  };
  return subButtons[floor] || [];
}

// New function to handle 3D model viewing for specific areas
function openModelViewerForFloor(area) {
  console.log(`Opening model for ${area}`);
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');

  // Hardcoded URL for the Rest of Ground Floor
  const restOfGroundFloorUrl = '/bundle/showcase.html?m=v1sp9avYgvY&applicationKey=h8m1gx75u1bezk7yaw7yggzwb&play=1';

  // Check if the area has a modelId or a URL
  const modelId = getModelIdForArea(area);
  const deepLink = getDeepLinkForArea(area); // New function to get deep link if available

  let modelUrl;
  if (modelId) {
    // If modelId exists, construct the model URL
    modelUrl = `/bundle/showcase.html?m=${modelId}&applicationKey=h8m1gx75u1bezk7yaw7yggzwb&play=1&qs=1`;
    floorPlanFrame.src = modelUrl; // Set the floor plan frame source to the model URL
  } else if (deepLink) {
    // If deep link exists, use it directly
    modelUrl = deepLink; // Use the deep link for the model URL
    floorPlanFrame.src = restOfGroundFloorUrl; // Hardcoded URL for Rest of Ground Floor
  } else {
    console.error('No model ID or deep link available for this area.');
    return; // Exit if neither is available
  }

  document.getElementById('map-container').classList.add('shifted'); // Shift the map
  modelFrame.src = modelUrl; // Set the model frame source

  modelViewer.classList.add('active');
  modelOverlay.classList.add('active');

  // After loading the model, synchronize the view for the deep link
  modelFrame.addEventListener('load', async () => {
    try {
      const modelSdk = await modelFrame.contentWindow.MP_SDK.connect(modelFrame.contentWindow);
      console.log('Connected to 3D Model SDK:', modelSdk);

      // Ensure the model is in the correct mode after a slight delay
      setTimeout(async () => {
        await ensureFloorPlanMode(modelSdk);
      }, 10000); // Wait for 1 second before switching modes
    } catch (error) {
      console.error('Error connecting to 3D Model SDK:', error);
    }
  });
}

// Ensure Model Mode
async function ensureModelMode(modelSdk) {
  try {
    await modelSdk.Mode.moveTo(modelSdk.Mode.Mode.FLOORPLAN, {
      transition: modelSdk.Mode.TransitionType.FLY
    });
    await modelSdk.Floor.showAll();
  } catch (error) {
    console.error("Error ensuring model mode:", error);
  }
}

// Synchronize View for Deep Link
async function syncViewForDeepLink(modelSdk, deepLink) {
  try {
    // Explicitly set the camera position and rotation for the "Rest of Ground Floor"
    const position = { x: 0, y: 0, z: 0 }; // Replace with actual coordinates for the "Rest of Ground Floor"
    const rotation = { x: -85, y: 0, z: 0 }; // Adjust as needed

    // Set the camera position and rotation
    await modelSdk.Camera.setPosition(position);
    console.log('Camera position set to:', position); // Debugging log
    await modelSdk.Camera.setRotation(rotation);
    console.log('Camera rotation set to:', rotation); // Debugging log
    await modelSdk.Camera.zoomTo({ zoom: 5 }); // Adjust zoom level
  } catch (error) {
    console.error("Error synchronizing view for deep link:", error);
  }
}

// Function to extract position from the deep link
function extractPositionFromDeepLink(deepLink) {
  // Implement logic to parse the deep link and return the position
  // For example, if the deep link contains coordinates in the URL, extract them
  // This is a placeholder implementation; adjust based on your deep link format
  return { x: 0, y: 0, z: 0 }; // Replace with actual logic
}

// Function to get the deep link based on the area
function getDeepLinkForArea(area) {
  const deepLinks = {
    'Male Washroom': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34',
    'Atrium': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=62&sr=-.25,.69',
    'Library': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=26&sr=-2.84,.65',
    'Classroom Euro Seniors': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=70&sr=-2.59,-.97',
    'Infirmary': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=81&sr=-.23,-1.16',
    'Class Grade 10': 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=11&sr=-.55,-1.09'
    
  };
  return deepLinks[area] || '';
}

// Function to get the model ID based on the area
function getModelIdForArea(area) {
  const modelIds = {
    'ICT Lab': 'zQV33R4HsGA',
    'Rest of Ground Floor': 'v1sp9avYgvY',
    'Dining Hall': 'Tqcgzn3Vfsv',
    'Store': 'y7Z9Tt1weYt',
    'Biology Lab': 'vywA6PDMhE7',
    'MP Hall': '7EdA6zKCTwx',
    // 'Male Washroom': 'v1sp9avYgvY', // Use the same ID for the deep link
    // 'Atrium': 'v1sp9avYgvY', // Use the same ID for the deep link
    // 'Library': 'v1sp9avYgvY', // Use the same ID for the deep link
    // 'Classroom Euro Seniors': 'v1sp9avYgvY', // Use the same ID for the deep link
    // 'Infirmary': 'v1sp9avYgvY', // Use the same ID for the deep link
    // 'Class Grade 10': 'v1sp9avYgvY' // Use the same ID for the deep link
  };
  return modelIds[area] || '';
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
// map.js

// Keep all your existing initialization code until handleFloorSelection

// Modified handleFloorSelection function
function handleFloorSelection(selectedFloor) {
  console.log('Handling floor selection:', selectedFloor);
  
  floorMarkers.forEach(marker => marker.remove());
  floorMarkers = [];

  const filteredFeatures = geojsonData.features.filter(
      feature => feature.properties.Floor === selectedFloor
  );
  
  console.log('Filtered features:', filteredFeatures);

  filteredFeatures.forEach(feature => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.setAttribute('data-floor', feature.properties.Floor);

      const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
          offset: [0, 0],
          clickTolerance: 3
      })
          .setLngLat(feature.geometry.coordinates)
          .addTo(map);

      el.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log('Marker clicked:', feature.properties);
          
          if (feature.properties.m) {
              openModelViewer(feature.properties.m, feature.properties.Space);
          }
      });

      floorMarkers.push(marker);
  });
}

function openModelViewer(modelId, spaceName) {
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  const modelTitle = document.querySelector('.model-viewer-title');

  //modelTitle.textContent = spaceName || 'View Model';
  const modelUrl = `/bundle/showcase.html?m=${modelId}&applicationKey=h8m1gx75u1bezk7yaw7yggzwb&play=1&qs=1`;
  document.getElementById('map-container').classList.add('shifted'); // Shift the map
  modelFrame.src = modelUrl;
  floorPlanFrame.src = modelUrl;

  modelViewer.classList.add('active');
  modelOverlay.classList.add('active');
}

const markerStyles = `
.marker {
  width: 20px;
  height: 20px;
  background-color: #4CAF50;
  border: 2px solid #ffffff;
  border-radius: 50% 50% 50% 0;
  cursor: pointer !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  transform: rotate(-45deg);
  position: relative;
  animation: dropIn 0.5s ease-out;
}

.marker::after {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.marker:hover {
  transform: rotate(-45deg) scale(1.1);
  background-color: #45a049;
  box-shadow: 0 3px 6px rgba(0,0,0,0.3);
}

.marker[data-floor="Ground"] {
  background-color: #4CAF50;  /* Green */
}

.marker[data-floor="First"] {
  background-color: #2196F3;  /* Blue */
}

.marker[data-floor="Second"] {
  background-color: #FF9800;  /* Orange */
}

@keyframes dropIn {
  from {
      transform: rotate(-45deg) translateY(-20px);
      opacity: 0;
  }
  to {
      transform: rotate(-45deg) translateY(0);
      opacity: 1;
  }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = markerStyles;
document.head.appendChild(styleSheet);

document.querySelector('.close-button').addEventListener('click', () => {
  const modelViewer = document.querySelector('.model-viewer');
  const modelOverlay = document.querySelector('.model-overlay');
  const modelFrame = document.getElementById('modelFrame');
  const floorPlanFrame = document.getElementById('floorPlanFrame');
  document.getElementById('map-container').classList.add('shifted'); // Shift the map
  modelViewer.classList.remove('active');
  modelOverlay.classList.remove('active');
  modelFrame.src = '';
  floorPlanFrame.src = '';
});

async function triggerFloorPlanView(modelUrl) {
    try {
        // Get the model frame element
        const modelFrame = document.getElementById('modelFrame');

        // Set the model frame source to the provided model URL
        modelFrame.src = modelUrl;

        // Wait for the model to load
        modelFrame.addEventListener('load', async () => {
            try {
                // Connect to the SDK
                const modelSdk = await modelFrame.contentWindow.MP_SDK.connect(modelFrame.contentWindow);
                console.log('Connected to 3D Model SDK:', modelSdk);

                // Ensure the model is in the correct mode (floor plan)
                await ensureFloorPlanMode(modelSdk);
            } catch (error) {
                console.error('Error connecting to 3D Model SDK:', error);
            }
        });
    } catch (error) {
        console.error('Error triggering floor plan view:', error);
    }
}

// Ensure Floor Plan Mode
async function ensureFloorPlanMode() {
    try {
        if (!floorPlanSdk) {
            console.error("Floor Plan SDK is not initialized.");
            return;
        }

        console.log("Current Mode:", await floorPlanSdk.Mode.getCurrentMode());
        console.log("Switching to FLOORPLAN mode...");

        // Introduce a delay before switching modes
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second

        await floorPlanSdk.Mode.moveTo(floorPlanSdk.Mode.Mode.FLOORPLAN, {
            transition: floorPlanSdk.Mode.TransitionType.FLY
        });

        await floorPlanSdk.Floor.showAll();
        await floorPlanSdk.Camera.setRotation({
            x: -85,
            y: 0,
            z: 0
        });
        console.log("Successfully switched to FLOORPLAN mode.");
    } catch (error) {
        console.error("Error ensuring FLOORPLAN mode:", error);
    }
}

initializeMap();

const modelUrl = `/bundle/showcase.html?m=v1sp9avYgvY&applicationKey=h8m1gx75u1bezk7yaw7yggzwb&play=1`;
triggerFloorPlanView(modelUrl);

// Hardcoded URL for the Rest of Ground Floor
const restOfGroundFloorUrl = '/bundle/showcase.html?m=v1sp9avYgvY&applicationKey=h8m1gx75u1bezk7yaw7yggzwb&play=1';

// Function to explicitly render the floor view of the Rest of Ground Floor for all deep links
function renderRestOfGroundFloorView() {
    const floorPlanFrame = document.getElementById('floorPlanFrame');
    
    // Set the floor plan frame source to the Rest of Ground Floor URL
    floorPlanFrame.src = restOfGroundFloorUrl;

    // Add load event listener to the floor plan frame
    floorPlanFrame.addEventListener('load', async () => {
        try {
            floorPlanSdk = await floorPlanFrame.contentWindow.MP_SDK.connect(floorPlanFrame.contentWindow);
            console.log('Connected to Floor Plan SDK:', floorPlanSdk);
            setTimeout(async () => {
              await ensureFloorPlanMode();
          }, 1000); // Adjust the delay as needed// Ensure we switch to floor plan mode
            //await addFloorPlanMarker();
        } catch (error) {
            console.error('Error connecting to Floor Plan SDK:', error);
        }
    });
}

// Call this function when a deep link is accessed
document.querySelectorAll('.model-btn').forEach(button => {
    button.addEventListener('click', () => {
        const modelId = button.getAttribute('data-model-id');
        
        // Clear existing content first
        modelFrame.src = ''; // Optionally clear the model frame
        // Reset SDKs
        modelSdk = null;
        floorPlanSdk = null;

        // Show the viewer
        modelViewer.classList.add('active');
        document.getElementById('map-container').classList.add('shifted'); // Shift the map
        modelViewer.classList.add('active'); // Activate the model viewer
        contentContainer.classList.add('model-open'); // Adjust content container

        // Load new model
        setTimeout(() => {
            changeModel(modelId); // Load the new model
            renderRestOfGroundFloorView(); // Render the floor view of the Rest of Ground Floor
        }, 1000);
    });
});

// Ensure Floor Plan Mode
async function ensureFloorPlanMode() {
    try {
        if (!floorPlanSdk) {
            console.error("Floor Plan SDK is not initialized.");
            return;
        }

        console.log("Current Mode:", await floorPlanSdk.Mode.getCurrentMode());
        console.log("Switching to FLOORPLAN mode...");

        // Introduce a delay before switching modes
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second

        await floorPlanSdk.Mode.moveTo(floorPlanSdk.Mode.Mode.FLOORPLAN, {
            transition: floorPlanSdk.Mode.TransitionType.FLY
        });

        await floorPlanSdk.Floor.showAll();
        await floorPlanSdk.Camera.setRotation({
            x: -85,
            y: 0,
            z: 0
        });
        console.log("Successfully switched to FLOORPLAN mode.");
    } catch (error) {
        console.error("Error ensuring FLOORPLAN mode:", error);
    }
}

// Add Floor Plan Marker
async function addFloorPlanMarker() {
    try {
        if (!floorPlanSdk) return;

        // Remove existing markers
        const existingMarkers = await floorPlanSdk.Mattertag.getData();
        for (const marker of existingMarkers) {
            await floorPlanSdk.Mattertag.remove(marker.sid);
        }

        // Add new position marker
        await floorPlanSdk.Mattertag.add({
            label: "Current Position",
            description: "",
            anchorPosition: { x: 0, y: 0, z: 0 },
            stemVector: { x: 0, y: 0, z: 0.1 },
            color: { r: 1, g: 0, b: 0 },
            floorIndex: 0
        });
    } catch (error) {
        console.error("Error adding floor plan marker:", error);
    }
}

// Function to render the floor view for deep links
async function renderFloorView(deepLink, modelName) {
    const floorPlanFrame = document.getElementById('floorPlanFrame'); // Get the floor plan frame

    // Check if the model is a deep link and if the model name is "Rest of Ground Floor"
    if (deepLink && modelName === 'Rest of Ground Floor') {
        // Set the source of the floor plan frame to the appropriate URL
        floorPlanFrame.src =  'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34'; // Replace with the actual URL of the floor plan
        floorPlanFrame.style.display = 'block'; // Ensure the frame is visible

        // Ensure the floor plan SDK is connected
        floorPlanFrame.addEventListener('load', async () => {
            try {
                floorPlanSdk = await floorPlanFrame.contentWindow.MP_SDK.connect(floorPlanFrame.contentWindow);
                console.log('Connected to Floor Plan SDK:', floorPlanSdk);
                
                // Ensure the floor plan mode is set correctly
                await ensureFloorPlanMode();
               // await addFloorPlanMarker(); // Optionally add markers
            } catch (error) {
                console.error('Error connecting to Floor Plan SDK:', error);
            }
        });
    } else {
        // Hide the floor plan frame for all other deep links
        if (deepLink) {
            floorPlanFrame.src = 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34';// Clear the frame source
            floorPlanFrame.style.display = 'block'; // Hide the frame
        } else {
            // Show the floor plan frame for all other models
            floorPlanFrame.style.display = 'block'; // Ensure the frame is visible
        }
    }

    // Extract coordinates from the deep link
    const coordinates = extractCoordinatesFromDeepLink(deepLink);
    
    // Check if coordinates are available
    if (coordinates.ss && coordinates.sr) {
        // Logic to handle coordinates can be added here if needed
    } else {
        console.error('No valid coordinates found in the deep link.');
    }
}

// Function to ensure the floor plan mode is set correctly
async function ensureFloorPlanMode() {
    try {
        if (!floorPlanSdk) return; // Check if the floorPlanSdk is initialized

        // Move to the FLOORPLAN mode with a fly transition
        await floorPlanSdk.Mode.moveTo(floorPlanSdk.Mode.Mode.FLOORPLAN, {
            transition: floorPlanSdk.Mode.TransitionType.FLY
        });

        // Show all floors in the floor plan
        await floorPlanSdk.Floor.showAll();

        // Set the camera rotation to a specific angle
        await floorPlanSdk.Camera.setRotation({
            x: -85, // Rotate the camera downwards
            y: 0,   // No rotation around the Y-axis
            z: 0    // No rotation around the Z-axis
        });
    } catch (error) {
        console.error("Error ensuring FLOORPLAN mode:", error); // Log any errors
    }
}

// Function to add floor plan markers
async function addFloorPlanMarker() {
    try {
        if (!floorPlanSdk) return;

        // Remove existing markers
        const existingMarkers = await floorPlanSdk.Mattertag.getData();
        for (const marker of existingMarkers) {
            await floorPlanSdk.Mattertag.remove(marker.sid);
        }

        // Add new position marker
        await floorPlanSdk.Mattertag.add({
            label: "Current Position",
            description: "",
            anchorPosition: { x: 0, y: 0, z: 0 },
            stemVector: { x: 0, y: 0, z: 0.1 },
            color: { r: 1, g: 0, b: 0 },
            floorIndex: 0
        });
    } catch (error) {
        console.error("Error adding floor plan marker:", error);
    }
}

// Example usage
const deepLink = 'https://my.matterport.com/show/?m=v1sp9avYgvY&qs=1&play=1&cloudEdit=1&ss=59&sr=-2.88,.34';
const modelName = 'Rest of Ground Floor'; // Example model name
renderFloorView(deepLink, modelName);