// ===================== CONFIGURATION =====================
const ESP_IP = "192.168.4.1";
let refreshRate = 500;
let updateInterval;
let isDataStreamActive = true;
let packetCount = 0;
let startTime = Date.now();

// Data history for graphs
let tempData = [];
let pressureData = [];
let gasData = [];
const MAX_DATA_POINTS = 30;

// Chart instances
let tempChart, pressureChart, gasChart;

// 3D Variables
let scene, camera, renderer;
let satellite, engines = {};

// Engine configuration
const ENGINE_CONFIG = {
    1: { position: [2, 0, 0], direction: [-1, 0, 0], color: 0xff4444, name: "+X Front" },
    2: { position: [-2, 0, 0], direction: [1, 0, 0], color: 0xff8844, name: "-X Rear" },
    3: { position: [0, 2, 0], direction: [0, -1, 0], color: 0x44ff44, name: "+Y Right" },
    4: { position: [0, -2, 0], direction: [0, 1, 0], color: 0x4488ff, name: "-Y Left" },
    5: { position: [0, 0, 2], direction: [0, 0, -1], color: 0xff44ff, name: "+Z Top" },
    6: { position: [0, 0, -2], direction: [0, 0, 1], color: 0xffff44, name: "-Z Bottom" },
    7: { position: [1.5, 1.5, 0], direction: [-0.7, -0.7, 0], color: 0xffaa44, name: "+X+Y Corner" },
    8: { position: [-1.5, -1.5, 0], direction: [0.7, 0.7, 0], color: 0x44ffaa, name: "-X-Y Corner" }
};

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', function() {
    console.log("Dashboard initializing...");
    
    // Initialize 3D satellite
    setTimeout(init3DSatellite, 100);
    
    // Initialize charts
    setTimeout(initCharts, 200);
    
    // Start data stream
    setTimeout(startDataStream, 500);
    
    // Update clock every second
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();
    
    // Update uptime every second
    setInterval(updateUptime, 1000);
    
    // Add initial log entries
    addLogEntry('System', 'Dashboard initialized');
    addLogEntry('System', '3D visualization loading...');
    addLogEntry('System', 'Waiting for sensor data...');
});

// ===================== 3D SATELLITE =====================
function init3DSatellite() {
    const container = document.getElementById('satellite-container');
    if (!container) {
        console.error("3D container not found!");
        return;
    }
    
    console.log("Initializing 3D satellite...");
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00b4ff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    // Create satellite
    createSatellite();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
    
    console.log("3D satellite initialized!");
    addLogEntry('3D', 'Satellite model loaded');
}

function createSatellite() {
    const satelliteGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(3, 2, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2a3b5c,
        shininess: 50
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    satelliteGroup.add(body);
    
    // Solar panels
    const panelGeometry = new THREE.BoxGeometry(5, 0.1, 2);
    const panelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a5c8c,
        emissive: 0x0044aa,
        emissiveIntensity: 0.2
    });
    
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.x = -3;
    satelliteGroup.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = 3;
    satelliteGroup.add(rightPanel);
    
    // Antenna
    const antennaGeometry = new THREE.ConeGeometry(0.1, 2, 8);
    const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = 1.5;
    satelliteGroup.add(antenna);
    
    // Create engines
    for(let i = 1; i <= 8; i++) {
        createEngine(i, satelliteGroup);
    }
    
    satellite = satelliteGroup;
    scene.add(satellite);
}

function createEngine(id, parent) {
    const config = ENGINE_CONFIG[id];
    
    // Engine nozzle
    const nozzleGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
    const nozzleMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.1
    });
    const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
    
    nozzle.position.set(...config.position);
    
    // Point engine in correct direction
    const direction = new THREE.Vector3(...config.direction);
    nozzle.lookAt(direction.clone().add(nozzle.position));
    
    parent.add(nozzle);
    
    // Store engine reference
    engines[id] = {
        mesh: nozzle,
        config: config,
        thrust: 0,
        flame: null
    };
    
    // Create flame (hidden initially)
    const flameGeometry = new THREE.ConeGeometry(0.1, 0.6, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600,
        transparent: true,
        opacity: 0
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.z = -0.5;
    flame.rotation.x = Math.PI;
    nozzle.add(flame);
    
    engines[id].flame = flame;
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate satellite slowly
    if (satellite) {
        satellite.rotation.y += 0.002;
    }
    
    // Update engine visuals
    updateEngineVisuals();
    
    renderer.render(scene, camera);
}

function updateEngineVisuals() {
    for(let id in engines) {
        const engine = engines[id];
        if(engine.flame) {
            if(engine.thrust > 0) {
                // Show flame
                engine.flame.material.opacity = engine.thrust / 100;
                engine.flame.scale.z = 1 + (engine.thrust / 50);
                
                // Add glow to engine
                engine.mesh.material.emissiveIntensity = 0.1 + (engine.thrust / 200);
                
                // Create occasional particles
                if(Math.random() > 0.8) {
                    createThrusterParticle(engine.mesh);
                }
            } else {
                // Hide flame
                engine.flame.material.opacity = 0;
                engine.mesh.material.emissiveIntensity = 0.1;
            }
        }
    }
}

function createThrusterParticle(engineMesh) {
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.8
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Position at nozzle tip
    particle.position.copy(engineMesh.position);
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(engineMesh.quaternion);
    particle.position.add(direction.multiplyScalar(0.8));
    
    scene.add(particle);
    
    // Animate particle
    const speed = 0.1 + Math.random() * 0.2;
    const particleDirection = direction.clone().normalize();
    
    function animateParticle() {
        particle.position.add(particleDirection.clone().multiplyScalar(speed));
        particle.material.opacity -= 0.02;
        particle.scale.multiplyScalar(0.98);
        
        if(particle.material.opacity > 0) {
            requestAnimationFrame(animateParticle);
        } else {
            scene.remove(particle);
        }
    }
    
    animateParticle();
}

function onWindowResize() {
    const container = document.getElementById('satellite-container');
    if(!container || !camera || !renderer) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// ===================== ENGINE CONTROL FUNCTIONS =====================
function manualThrust(engineId, thrust) {
    const engine = engines[engineId];
    if(!engine) return;
    
    engine.thrust = parseInt(thrust);
    
    // Update UI
    document.getElementById(`engine-${engineId}-value`).textContent = `${engine.thrust}%`;
    document.getElementById(`engine-${engineId}-status`).textContent = engine.thrust > 0 ? 'ON' : 'OFF';
    document.getElementById(`engine-${engineId}-status`).style.background = 
        engine.thrust > 0 ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 100, 100, 0.2)';
    
    // Log the action
    if(engine.thrust > 0) {
        addLogEntry('Thruster', `${engine.config.name} at ${engine.thrust}%`);
    }
}

function fireEngine(engineId) {
    // Fire engine at 80% for 1 second
    manualThrust(engineId, 80);
    setTimeout(() => manualThrust(engineId, 0), 1000);
    showNotification(`Engine ${engineId} fired`, 'info');
}

function stabilizeSatellite() {
    for(let i = 1; i <= 8; i++) {
        manualThrust(i, 0);
    }
    showNotification("All engines stopped - Satellite stabilized", "success");
    addLogEntry('Control', 'Stabilization initiated');
}

function rotateX() {
    // Fire opposing engines for rotation around X axis
    manualThrust(3, 60); // +Y
    manualThrust(4, 60); // -Y
    setTimeout(() => {
        manualThrust(3, 0);
        manualThrust(4, 0);
    }, 800);
    addLogEntry('Control', 'X-axis rotation');
}

function rotateY() {
    manualThrust(1, 60); // +X
    manualThrust(2, 60); // -X
    setTimeout(() => {
        manualThrust(1, 0);
        manualThrust(2, 0);
    }, 800);
    addLogEntry('Control', 'Y-axis rotation');
}

function rotateZ() {
    manualThrust(5, 60); // +Z
    manualThrust(6, 60); // -Z
    setTimeout(() => {
        manualThrust(5, 0);
        manualThrust(6, 0);
    }, 800);
    addLogEntry('Control', 'Z-axis rotation');
}

function emergencyStop() {
    for(let i = 1; i <= 8; i++) {
        manualThrust(i, 0);
    }
    showNotification("EMERGENCY STOP - All engines disabled", "error");
    addLogEntry('Emergency', 'Emergency stop activated');
    
    // Visual feedback
    document.body.style.backgroundColor = '#4a0000';
    setTimeout(() => {
        document.body.style.backgroundColor = '';
    }, 500);
}

function setAutoMode() {
    showNotification("Auto mode activated", "info");
    addLogEntry('Control', 'Auto mode enabled');
}

function setManualMode() {
    showNotification("Manual mode activated", "info");
    addLogEntry('Control', 'Manual mode enabled');
}

// ===================== CHART FUNCTIONS =====================
function initCharts() {
    console.log("Initializing charts...");
    
    // Temperature Chart
    const tempCanvas = document.getElementById('temp-chart');
    if(tempCanvas) {
        const tempCtx = tempCanvas.getContext('2d');
        tempChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 10}, (_, i) => i + 1),
                datasets: [{
                    label: 'Temperature (°C)',
                    data: Array.from({length: 10}, () => 25 + Math.random() * 5),
                    borderColor: '#00ffcc',
                    backgroundColor: 'rgba(0, 255, 204, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#88aaff' }
                    }
                }
            }
        });
    }
    
    // Pressure Chart
    const pressureCanvas = document.getElementById('pressure-chart');
    if(pressureCanvas) {
        const pressureCtx = pressureCanvas.getContext('2d');
        pressureChart = new Chart(pressureCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 10}, (_, i) => i + 1),
                datasets: [{
                    label: 'Pressure (hPa)',
                    data: Array.from({length: 10}, () => 1010 + Math.random() * 10),
                    borderColor: '#00b4ff',
                    backgroundColor: 'rgba(0, 180, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#88aaff' }
                    }
                }
            }
        });
    }
    
    // Gas Chart
    const gasCanvas = document.getElementById('gas-chart');
    if(gasCanvas) {
        const gasCtx = gasCanvas.getContext('2d');
        gasChart = new Chart(gasCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 10}, (_, i) => i + 1),
                datasets: [{
                    label: 'Air Quality (PPM)',
                    data: Array.from({length: 10}, () => 200 + Math.random() * 100),
                    borderColor: '#ff3c64',
                    backgroundColor: 'rgba(255, 60, 100, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#88aaff' }
                    }
                }
            }
        });
    }
    
    console.log("Charts initialized!");
    addLogEntry('System', 'Charts ready');
}

function updateCharts(data) {
    if(!tempChart || !pressureChart || !gasChart) {
        console.error("Charts not initialized!");
        return;
    }
    
    // Add new data points
    const timeLabel = new Date().toLocaleTimeString([], {minute: '2-digit', second: '2-digit'});
    
    // Temperature
    tempData.push(data.bmpTemp);
    if(tempData.length > MAX_DATA_POINTS) tempData.shift();
    
    tempChart.data.labels = Array.from({length: tempData.length}, (_, i) => i + 1);
    tempChart.data.datasets[0].data = tempData;
    tempChart.update('none');
    
    // Pressure
    pressureData.push(data.pressure);
    if(pressureData.length > MAX_DATA_POINTS) pressureData.shift();
    
    pressureChart.data.labels = Array.from({length: pressureData.length}, (_, i) => i + 1);
    pressureChart.data.datasets[0].data = pressureData;
    pressureChart.update('none');
    
    // Gas
    gasData.push(data.mq135);
    if(gasData.length > MAX_DATA_POINTS) gasData.shift();
    
    gasChart.data.labels = Array.from({length: gasData.length}, (_, i) => i + 1);
    gasChart.data.datasets[0].data = gasData;
    gasChart.update('none');
    
    // Update statistics
    updateChartStats();
}

function updateChartStats() {
    if(tempData.length > 0) {
        const maxTemp = Math.max(...tempData).toFixed(1);
        const minTemp = Math.min(...tempData).toFixed(1);
        const avgTemp = (tempData.reduce((a, b) => a + b) / tempData.length).toFixed(1);
        
        document.getElementById('temp-max').textContent = maxTemp;
        document.getElementById('temp-min').textContent = minTemp;
        document.getElementById('temp-avg').textContent = avgTemp;
    }
    
    if(pressureData.length > 0) {
        const maxPress = Math.max(...pressureData).toFixed(1);
        const minPress = Math.min(...pressureData).toFixed(1);
        const avgPress = (pressureData.reduce((a, b) => a + b) / pressureData.length).toFixed(1);
        
        document.getElementById('pressure-max').textContent = maxPress;
        document.getElementById('pressure-min').textContent = minPress;
        document.getElementById('pressure-avg').textContent = avgPress;
    }
    
    if(gasData.length > 0) {
        const maxGas = Math.max(...gasData);
        const minGas = Math.min(...gasData);
        const avgGas = Math.round(gasData.reduce((a, b) => a + b) / gasData.length);
        
        document.getElementById('gas-max').textContent = maxGas;
        document.getElementById('gas-min').textContent = minGas;
        document.getElementById('gas-avg').textContent = avgGas;
    }
}

function showGraph(type) {
    showNotification(`Showing ${type} graph`, 'info');
}

function clearGraphs() {
    tempData = [];
    pressureData = [];
    gasData = [];
    
    if(tempChart && pressureChart && gasChart) {
        tempChart.data.datasets[0].data = [];
        pressureChart.data.datasets[0].data = [];
        gasChart.data.datasets[0].data = [];
        
        tempChart.update();
        pressureChart.update();
        gasChart.update();
    }
    
    updateChartStats();
    addLogEntry('System', 'Graphs cleared');
    showNotification('Graphs cleared', 'success');
}

// ===================== DATA FETCHING & PROCESSING =====================
async function fetchData() {
    if(!isDataStreamActive) return;
    
    try {
        const response = await fetch(`http://${ESP_IP}/data`);
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        processSensorData(data);
        packetCount++;
        
        // Update connection status
        updateConnectionStatus(true);
        updateLastUpdateTime();
        
    } catch(error) {
        console.error('Fetch error:', error);
        updateConnectionStatus(false);
    }
}

function processSensorData(data) {
    console.log("Processing sensor data:", data);
    
    // Update numeric displays
    document.getElementById('ax-value').textContent = data.ax;
    document.getElementById('ay-value').textContent = data.ay;
    document.getElementById('az-value').textContent = data.az;
    document.getElementById('gx-value').textContent = data.gx;
    document.getElementById('gy-value').textContent = data.gy;
    document.getElementById('gz-value').textContent = data.gz;
    document.getElementById('temp-value').textContent = data.bmpTemp.toFixed(1);
    document.getElementById('pressure-value').textContent = data.pressure.toFixed(1);
    document.getElementById('mq135-value').textContent = data.mq135;
    
    // Update gauges
    updateGauge('ax-gauge', Math.abs(data.ax), 16384);
    updateGauge('ay-gauge', Math.abs(data.ay), 16384);
    updateGauge('az-gauge', Math.abs(data.az), 16384);
    updateGauge('gx-gauge', Math.abs(data.gx), 2000);
    updateGauge('gy-gauge', Math.abs(data.gy), 2000);
    updateGauge('gz-gauge', Math.abs(data.gz), 2000);
    
    // Update orientation
    updateOrientation(data.ax, data.ay, data.az);
    
    // Update 3D satellite rotation based on gyro
    if(satellite) {
        const scaleX = 0.00005;
        const scaleY = 0.00005;
        const scaleZ = 0.00005;
        
        satellite.rotation.x += data.gy * scaleX;
        satellite.rotation.y += data.gx * scaleY;
        satellite.rotation.z += data.gz * scaleZ;
        
        // Limit rotation
        satellite.rotation.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, satellite.rotation.x));
        satellite.rotation.y = Math.max(-Math.PI/4, Math.min(Math.PI/4, satellite.rotation.y));
        satellite.rotation.z = Math.max(-Math.PI/4, Math.min(Math.PI/4, satellite.rotation.z));
    }
    
    // Update quality indicator
    updateQualityIndicator(data.mq135);
    
    // Update trends
    updateTrends(data.bmpTemp, data.pressure);
    
    // Update graphs
    updateCharts(data);
    
    // Update packet count
    document.getElementById('packet-count').textContent = packetCount;
    
    // Log data reception occasionally
    if(packetCount % 10 === 0) {
        addLogEntry('Telemetry', `Received ${packetCount} packets`);
    }
}

function updateGauge(id, value, max) {
    const gauge = document.getElementById(id);
    if(gauge) {
        const percentage = Math.min((value / max) * 100, 100);
        gauge.style.width = `${percentage}%`;
        
        // Color based on percentage
        if(percentage > 80) {
            gauge.style.background = 'linear-gradient(90deg, #ff3c64, #ff6b9d)';
        } else if(percentage > 50) {
            gauge.style.background = 'linear-gradient(90deg, #ffb74d, #ff9800)';
        } else {
            gauge.style.background = 'linear-gradient(90deg, #00b4ff, #00ffcc)';
        }
    }
}

function updateOrientation(ax, ay, az) {
    // Calculate simple orientation from accelerometer
    const roll = Math.atan2(ay, az) * (180 / Math.PI);
    const pitch = Math.atan2(-ax, Math.sqrt(ay*ay + az*az)) * (180 / Math.PI);
    
    document.getElementById('roll').textContent = `${roll.toFixed(1)}°`;
    document.getElementById('pitch').textContent = `${pitch.toFixed(1)}°`;
    document.getElementById('yaw').textContent = '0.0°';
}

function updateQualityIndicator(value) {
    const indicator = document.getElementById('quality-indicator');
    if(!indicator) return;
    
    if(value < 200) {
        indicator.style.backgroundColor = '#00ff9d';
        indicator.title = 'Good Air Quality';
    } else if(value < 400) {
        indicator.style.backgroundColor = '#ffb74d';
        indicator.title = 'Moderate Air Quality';
    } else {
        indicator.style.backgroundColor = '#ff3c64';
        indicator.title = 'Poor Air Quality';
    }
}

function updateTrends(temp, pressure) {
    const tempTrend = document.getElementById('temp-trend');
    const pressureTrend = document.getElementById('pressure-trend');
    
    if(tempData.length > 1) {
        const prevTemp = tempData[tempData.length - 2];
        if(temp > prevTemp) {
            tempTrend.innerHTML = '<i class="fas fa-arrow-up"></i>';
            tempTrend.style.color = '#ff3c64';
        } else if(temp < prevTemp) {
            tempTrend.innerHTML = '<i class="fas fa-arrow-down"></i>';
            tempTrend.style.color = '#00b4ff';
        } else {
            tempTrend.innerHTML = '<i class="fas fa-minus"></i>';
            tempTrend.style.color = '#88aaff';
        }
    }
    
    if(pressureData.length > 1) {
        const prevPressure = pressureData[pressureData.length - 2];
        if(pressure > prevPressure) {
            pressureTrend.innerHTML = '<i class="fas fa-arrow-up"></i>';
            pressureTrend.style.color = '#ff3c64';
        } else if(pressure < prevPressure) {
            pressureTrend.innerHTML = '<i class="fas fa-arrow-down"></i>';
            pressureTrend.style.color = '#00b4ff';
        } else {
            pressureTrend.innerHTML = '<i class="fas fa-minus"></i>';
            pressureTrend.style.color = '#88aaff';
        }
    }
}

// ===================== UI CONTROLS =====================
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if(!statusEl) return;
    
    if(connected) {
        statusEl.innerHTML = '<i class="fas fa-circle"></i> CONNECTED';
        statusEl.className = 'connected';
    } else {
        statusEl.innerHTML = '<i class="fas fa-circle"></i> DISCONNECTED';
        statusEl.className = 'disconnected';
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    document.getElementById('last-update-time').textContent = timeString;
}

function updateUptime() {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;
    document.getElementById('uptime').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startDataStream() {
    isDataStreamActive = true;
    clearInterval(updateInterval);
    updateInterval = setInterval(fetchData, refreshRate);
    fetchData(); // Immediate fetch
    addLogEntry('System', 'Data stream started');
}

function stopDataStream() {
    isDataStreamActive = false;
    clearInterval(updateInterval);
    addLogEntry('System', 'Data stream paused');
}

function changeRefreshRate(rate) {
    refreshRate = parseInt(rate);
    if(isDataStreamActive) {
        startDataStream();
    }
    showNotification(`Refresh rate: ${rate}ms`, 'info');
}

function addLogEntry(category, message) {
    const logContainer = document.getElementById('event-log');
    if(!logContainer) return;
    
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `[${timestamp}] <span class="log-category">${category}:</span> ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Keep only last 20 entries
    if(logContainer.children.length > 20) {
        logContainer.removeChild(logContainer.children[0]);
    }
}

function clearLog() {
    const logContainer = document.getElementById('event-log');
    if(logContainer) {
        logContainer.innerHTML = '';
        addLogEntry('System', 'Event log cleared');
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if(!container) return;
    
    const icon = type === 'error' ? 'exclamation-triangle' :
                 type === 'warning' ? 'exclamation-circle' :
                 type === 'success' ? 'check-circle' : 'info-circle';
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    const timeElement = document.getElementById('current-time');
    if(timeElement) {
        timeElement.textContent = timeString;
    }
}

function changeView(view) {
    if(!camera) return;
    
    switch(view) {
        case 'top':
            camera.position.set(0, 10, 0.1);
            camera.lookAt(0, 0, 0);
            break;
        case 'front':
            camera.position.set(0, 0, 10);
            camera.lookAt(0, 0, 0);
            break;
        case 'side':
            camera.position.set(10, 0, 0);
            camera.lookAt(0, 0, 0);
            break;
        default:
            camera.position.set(8, 6, 8);
            camera.lookAt(0, 0, 0);
    }
}

function resetView() {
    if(camera) {
        camera.position.set(8, 6, 8);
        camera.lookAt(0, 0, 0);
    }
}

function exportData() {
    const data = {
        temperature: tempData,
        pressure: pressureData,
        gas: gasData,
        timestamp: new Date().toISOString(),
        packetCount: packetCount
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satellite-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('Data exported successfully', 'success');
    addLogEntry('System', 'Telemetry data exported');
}

function fullScreen() {
    if(!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Expose functions to window
window.manualThrust = manualThrust;
window.fireEngine = fireEngine;
window.stabilizeSatellite = stabilizeSatellite;
window.rotateX = rotateX;
window.rotateY = rotateY;
window.rotateZ = rotateZ;
window.emergencyStop = emergencyStop;
window.setAutoMode = setAutoMode;
window.setManualMode = setManualMode;
window.changeView = changeView;
window.resetView = resetView;
window.showGraph = showGraph;
window.clearGraphs = clearGraphs;
window.startDataStream = startDataStream;
window.stopDataStream = stopDataStream;
window.changeRefreshRate = changeRefreshRate;
window.exportData = exportData;
window.fullScreen = fullScreen;
window.clearLog = clearLog;