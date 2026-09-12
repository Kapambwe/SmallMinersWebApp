// Leaflet Wrapper for Small Scale Mining GIS Operations
// Provides interactive mapping, site boundary drawing, overlap detection, and route planning

let map = null;
let drawnItems = null;
let markers = [];
let polygons = [];
let circles = [];
let polylines = [];
let heatmapLayer = null;
let satelliteLayer = null;
let baseTileLayer = null;
let offlineMode = false;

// Create map
export function createMap(elementId, lat, lng, zoom) {
    if (map) {
        map.remove();
    }

    map = L.map(elementId).setView([lat, lng], zoom);

    // Base tile layer (OpenStreetMap)
    baseTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Initialize drawn items layer
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    return true;
}

// Add marker
export function addMarker(lat, lng, popupText = null, icon = null) {
    let markerOptions = {};
    
    if (icon) {
        // Custom icon for different site types
        const customIcon = L.icon({
            iconUrl: icon,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        });
        markerOptions.icon = customIcon;
    }

    const marker = L.marker([lat, lng], markerOptions).addTo(map);
    
    if (popupText) {
        marker.bindPopup(popupText);
    }
    
    markers.push(marker);
    return true;
}

// Add circle (for buffer zones)
export function addCircle(lat, lng, radius, options = {}) {
    const defaultOptions = {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        radius: radius
    };
    
    const circle = L.circle([lat, lng], { ...defaultOptions, ...options }).addTo(map);
    circles.push(circle);
    return true;
}

// Add polygon (for site boundaries)
export function addPolygon(latLngs, options = {}) {
    const defaultOptions = {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.3
    };
    
    const polygon = L.polygon(latLngs, { ...defaultOptions, ...options }).addTo(map);
    polygons.push(polygon);
    return true;
}

// Add polyline (for routes)
export function addPolyline(latLngs, options = {}) {
    const defaultOptions = {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.7
    };
    
    const polyline = L.polyline(latLngs, { ...defaultOptions, ...options }).addTo(map);
    polylines.push(polyline);
    return true;
}

// Add GeoJSON
export function addGeoJson(geoJson, options = {}) {
    const defaultOptions = {
        style: {
            color: '#8b5cf6',
            weight: 2,
            fillOpacity: 0.3
        }
    };
    
    L.geoJSON(geoJson, { ...defaultOptions, ...options }).addTo(map);
    return true;
}

// Add GeoJSON with popup
export function addGeoJsonWithPopup(geoJson, options = {}) {
    L.geoJSON(geoJson, {
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.popupContent) {
                layer.bindPopup(feature.properties.popupContent);
            }
        },
        ...options
    }).addTo(map);
    return true;
}

// Add heatmap layer (requires leaflet-heat plugin)
export function addHeatmapLayer(points, options = {}) {
    if (typeof L.heatLayer === 'undefined') {
        console.warn('Leaflet.heat plugin not loaded. Heatmap layer cannot be created.');
        return false;
    }
    
    if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
    }
    
    const defaultOptions = {
        radius: 25,
        blur: 15,
        maxZoom: 17
    };
    
    heatmapLayer = L.heatLayer(points, { ...defaultOptions, ...options }).addTo(map);
    return true;
}

// Clear map
export function clearMap() {
    markers.forEach(marker => map.removeLayer(marker));
    polygons.forEach(polygon => map.removeLayer(polygon));
    circles.forEach(circle => map.removeLayer(circle));
    polylines.forEach(polyline => map.removeLayer(polyline));
    
    if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
        heatmapLayer = null;
    }
    
    markers = [];
    polygons = [];
    circles = [];
    polylines = [];
    
    return true;
}

// Initialize drawing tools (requires leaflet-draw plugin)
export function initDrawTools() {
    if (typeof L.Control.Draw === 'undefined') {
        console.warn('Leaflet.draw plugin not loaded. Drawing tools cannot be initialized.');
        return false;
    }
    
    const drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: {
            polygon: {
                allowIntersection: false,
                showArea: true,
                shapeOptions: {
                    color: '#10b981'
                }
            },
            polyline: {
                shapeOptions: {
                    color: '#f59e0b'
                }
            },
            circle: true,
            rectangle: {
                shapeOptions: {
                    color: '#3b82f6'
                }
            },
            marker: true,
            circlemarker: false
        }
    });
    
    map.addControl(drawControl);
    
    // Event handlers for drawing
    map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        drawnItems.addLayer(layer);
    });
    
    return true;
}

// Enable drawing mode
export function enableDrawing() {
    // Drawing is always enabled once initDrawTools is called
    return true;
}

// Disable drawing mode
export function disableDrawing() {
    // Optional: could remove draw controls
    return true;
}

// Clear all drawn items
export function clearAllDrawn() {
    drawnItems.clearLayers();
    return true;
}

// Get drawn items as GeoJSON
export function getDrawnGeoJson() {
    return JSON.stringify(drawnItems.toGeoJSON());
}

// Add drawn items from GeoJSON
export function addDrawnFromGeoJson(geoJson) {
    L.geoJSON(geoJson, {
        onEachFeature: function (feature, layer) {
            drawnItems.addLayer(layer);
        }
    });
    return true;
}

// Calculate distance between two points using Haversine formula (returns meters)
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const point1 = L.latLng(lat1, lng1);
    const point2 = L.latLng(lat2, lng2);
    return point1.distanceTo(point2);
}

// Check overlap between boundary and protected areas
export function checkOverlap(boundaryGeoJson, protectedAreasGeoJson) {
    if (typeof turf === 'undefined') {
        console.warn('Turf.js library not loaded. Overlap detection not available.');
        return false;
    }
    
    try {
        for (const protectedArea of protectedAreasGeoJson) {
            const intersection = turf.intersect(boundaryGeoJson, protectedArea);
            if (intersection) {
                return true; // Overlap detected
            }
        }
        return false; // No overlap
    } catch (error) {
        console.error('Error checking overlap:', error);
        return false;
    }
}

// Add buffer zone visualization
export function addBufferZone(lat, lng, bufferMeters, options = {}) {
    const defaultOptions = {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        dashArray: '5, 10'
    };
    
    const circle = L.circle([lat, lng], {
        radius: bufferMeters,
        ...defaultOptions,
        ...options
    }).addTo(map);
    
    circles.push(circle);
    return true;
}

// Calculate and display route (requires routing plugin)
export function calculateRoute(waypoints, options = {}) {
    if (typeof L.Routing === 'undefined') {
        console.warn('Leaflet Routing Machine plugin not loaded. Route calculation not available.');
        
        // Fallback: draw simple polyline through waypoints
        addPolyline(waypoints, {
            color: '#3b82f6',
            weight: 4,
            dashArray: '10, 5'
        });
        return true;
    }
    
    try {
        const control = L.Routing.control({
            waypoints: waypoints.map(wp => L.latLng(wp[0], wp[1])),
            routeWhileDragging: true,
            showAlternatives: true,
            ...options
        }).addTo(map);
        
        return true;
    } catch (error) {
        console.error('Error calculating route:', error);
        return false;
    }
}

// Add satellite imagery layer
export function addSatelliteLayer(provider = 'Esri') {
    if (satelliteLayer) {
        map.removeLayer(satelliteLayer);
    }
    
    let tileUrl = '';
    let attribution = '';
    
    if (provider === 'Esri') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attribution = 'Tiles &copy; Esri';
    } else if (provider === 'Google') {
        tileUrl = 'http://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
        attribution = '&copy; Google';
    }
    
    satelliteLayer = L.tileLayer(tileUrl, {
        attribution: attribution,
        maxZoom: 19
    });
    
    return true;
}

// Toggle satellite view
export function toggleSatelliteView() {
    if (!satelliteLayer) {
        addSatelliteLayer();
    }
    
    if (map.hasLayer(satelliteLayer)) {
        map.removeLayer(satelliteLayer);
        if (baseTileLayer) {
            map.addLayer(baseTileLayer);
        }
    } else {
        if (baseTileLayer) {
            map.removeLayer(baseTileLayer);
        }
        map.addLayer(satelliteLayer);
    }
    
    return true;
}

// Enable offline mode (requires leaflet-offline plugin)
export function enableOfflineMode(maxZoom = 16) {
    if (typeof L.tileLayer.offline === 'undefined') {
        console.warn('Leaflet.offline plugin not loaded. Offline mode not available.');
        offlineMode = false;
        return false;
    }
    
    try {
        // Replace base tile layer with offline-capable layer
        if (baseTileLayer) {
            map.removeLayer(baseTileLayer);
        }
        
        baseTileLayer = L.tileLayer.offline('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: maxZoom
        }).addTo(map);
        
        offlineMode = true;
        return true;
    } catch (error) {
        console.error('Error enabling offline mode:', error);
        offlineMode = false;
        return false;
    }
}

// Fit map bounds to show all sites
export function fitBounds(bounds) {
    if (bounds && bounds.length === 2) {
        map.fitBounds(bounds);
        return true;
    }
    return false;
}

// Set map view (center and zoom)
export function setView(lat, lng, zoom) {
    map.setView([lat, lng], zoom);
    return true;
}

// Export for use in modules
export default {
    createMap,
    addMarker,
    addCircle,
    addPolygon,
    addPolyline,
    addGeoJson,
    addGeoJsonWithPopup,
    addHeatmapLayer,
    clearMap,
    initDrawTools,
    enableDrawing,
    disableDrawing,
    clearAllDrawn,
    getDrawnGeoJson,
    addDrawnFromGeoJson,
    calculateDistance,
    checkOverlap,
    addBufferZone,
    calculateRoute,
    addSatelliteLayer,
    toggleSatelliteView,
    enableOfflineMode,
    fitBounds,
    setView
};
