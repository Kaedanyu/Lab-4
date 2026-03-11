/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoia2FlZGFueXUiLCJhIjoiY21rYXJpNHF6MGltODNkcHE3dHM5cmxlZyJ9.nnYd9wh7kN2DJFgtuewiyg'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/kaedanyu/cml6bsqrf005q01s6e2sxgikd',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.7],  // starting point, longitude/latitude
    zoom: 11.5, // starting zoom level
    minZoom: 11, //furthest to zoom out, ideally to prevent seeing edges of bound box
    maxZoom: 12.5, //further zoom in level
    maxBounds: [ //limit panning to edge of bounding box
        [-79.64689574354577, 43.57790669999999],
        [-79.09799554836457, 43.85031730000001]
    ]
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
let pc_collision;
fetch('https://raw.githubusercontent.com/Kaedanyu/Lab-4/refs/heads/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        // console.log(response);
        pc_collision = response;
    });

//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable



/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler

map.on('load', () => {
    let envresult = turf.envelope(pc_collision);
    let bboxscaled = turf.transformScale(envresult, 1.1);
    console.log('bounding box', bboxscaled)

    let bboxcoords = [
        bboxscaled.geometry.coordinates[0][0][0],
        bboxscaled.geometry.coordinates[0][0][1],
        bboxscaled.geometry.coordinates[0][2][0],
        bboxscaled.geometry.coordinates[0][2][1],
    ];

    let hexdata = turf.hexGrid(bboxcoords, 0.5, { units: 'kilometers' });
    console.log(bboxcoords)


    //      First create a bounding box around the collision point data
    //      Access and store the bounding box coordinates as an array variable
    //      Use bounding box coordinates as argument in the turf hexgrid function
    //      **Option: You may want to consider how to increase the size of your bbox to enable greater geog coverage of your hexgrid
    //                Consider return types from different turf functions and required argument types carefully here



    /*--------------------------------------------------------------------
    Step 4: AGGREGATE COLLISIONS BY HEXGRID
    --------------------------------------------------------------------*/
    let collishex = turf.collect(hexdata, pc_collision, "_id", "values");
    let maxcollisions = 0;
    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length;
        if (feature.properties.COUNT > maxcollisions) {
            maxcollisions = feature.properties.COUNT;
        }
    });

    console.log('Max collisions:', maxcollisions);

    // breakpoints for the gradient based on the 25%, 50%, and 75% values
    const low = 21;
    const mid = 42;
    const high = 63;

    // Update the legend text with hexagon count values
    document.getElementById('val-25').textContent = low;
    document.getElementById('val-50').textContent = mid;
    document.getElementById('val-75').textContent = high;
    document.getElementById('val-100').textContent = maxcollisions;

    map.addSource("collishexgrid", {
        type: "geojson",
        data: collishex,
    });

    //add exponential symbology to the hexes
    map.addLayer({
        id: "collishexfill",
        type: "fill",
        source: "collishexgrid",
        paint: {
            "fill-color": [
                "interpolate",
                ["exponential", 0.95],
                ["get", "COUNT"],
                0, "#ffffff",
                1, "#C8E6C9",
                maxcollisions, "#B71C1C"
            ],
            "fill-opacity": [
                "case", ["==", ["get", "COUNT"], 0],
                0.1, //instead of filtering out all count=0 hexagons, make count=0 have 0.1 opacity, so there are no holes in the map
                0.5
            ]
        },
    });
});
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/

map.on("click", "collishexfill", (e) => {
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML("<b>Collision count: </b>" + e.features[0].properties.COUNT)
        .addTo(map);
});

//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


