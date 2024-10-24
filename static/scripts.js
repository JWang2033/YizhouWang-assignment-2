document.addEventListener('DOMContentLoaded', function() {
    let data = [];
    let centroids = [];  // Array to store manually selected centroids
    let currentCenters = null;  // To store the previous centroids for step-through
    let isDataGenerated = false;  // Track if data has been generated
    const canvas = document.getElementById('kmeans_plot');
    const ctx = canvas.getContext('2d');
    const canvasSize = 500;  // Assuming the canvas is 500x500 pixels
    let manualCentroidMode = false;  // Flag to indicate manual selection mode
    let currentIteration = 1;  // Initialize iteration counter

    // Function to scale and center the points on the canvas
    function scaleAndCenterPoints(points) {
        if (!points || points.length === 0) {
            console.error("Error: Points are undefined or empty.");
            return [];
        }

        const scaledPoints = points.map(point => {
            const scaledX = (point[0] / 100) * canvasSize;
            const scaledY = (point[1] / 100) * canvasSize;
            return [scaledX, canvasSize - scaledY];  // Flip Y-axis to match canvas coordinates
        });

        return scaledPoints;
    }

    // Function to draw axes on the canvas
    function drawAxes() {
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;

        // Draw horizontal axis
        ctx.beginPath();
        ctx.moveTo(0, canvasSize / 2);
        ctx.lineTo(canvasSize, canvasSize / 2);
        ctx.stroke();

        // Draw vertical axis
        ctx.beginPath();
        ctx.moveTo(canvasSize / 2, 0);
        ctx.lineTo(canvasSize / 2, canvasSize);
        ctx.stroke();
    }

    // Function to draw the points on the canvas
    function drawPoints(points, labels = null, colors = []) {
        if (!points || points.length === 0) {
            console.error("Error: Points are undefined or empty.");
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas
        drawAxes();  // Draw axes

        const scaledPoints = scaleAndCenterPoints(points);
        scaledPoints.forEach((point, index) => {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
            ctx.fillStyle = labels ? colors[labels[index]] : 'black';
            ctx.fill();
        });
    }

    // Function to draw centroids as red "X" marks
    function drawCentroids(centroids) {
        if (!centroids || centroids.length === 0) {
            console.error("Error: Centroids are undefined or empty.");
            return;
        }

        const scaledCentroids = scaleAndCenterPoints(centroids);

        scaledCentroids.forEach(centroid => {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(centroid[0] - 5, centroid[1] - 5);
            ctx.lineTo(centroid[0] + 5, centroid[1] + 5);
            ctx.moveTo(centroid[0] - 5, centroid[1] + 5);
            ctx.lineTo(centroid[0] + 5, centroid[1] - 5);
            ctx.stroke();
        });
    }

    // Handle canvas clicks for manual centroid selection
    canvas.addEventListener('click', function(event) {
        const n_clusters = document.getElementById('n_clusters').value;

        // Check if the number of centroids exceeds the number of clusters
        if (centroids.length >= n_clusters) {
            alert(`You can only select ${n_clusters} centroids. Please reset or adjust the number of clusters.`);
            return;
        }

        if (manualCentroidMode) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const scaledX = (x / canvasSize) * 100;
            const scaledY = ((canvasSize - y) / canvasSize) * 100;

            centroids.push([scaledX, scaledY]);
            drawCentroids(centroids);
        }
    });

    // Toggle manual centroid selection mode
    document.getElementById('init_method').addEventListener('change', function() {
        manualCentroidMode = this.value === 'manual';
        centroids = [];  // Clear previously selected centroids when the method changes
    });

    // Generate new dataset and initialize centroids
    document.getElementById('generate').addEventListener('click', async function() {
        const n_clusters = document.getElementById('n_clusters').value;
        const init_method = document.getElementById('init_method').value;

        // Step 1: Generate a new dataset
        const response = await fetch('/generate_dataset', { method: 'POST' });
        const result = await response.json();
        data = result.data;
        isDataGenerated = true;  // Track that data has been generated
        currentIteration = 1;  // Reset the iteration counter
        centroids = [];  // Reset centroids

        drawPoints(data);  // Draw the new dataset points

        // Step 2: Initialize centroids only if the method is not manual
        if (init_method !== 'manual') {
            const centroidResponse = await fetch('/initialize_centroids', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: data,
                    n_clusters: n_clusters,
                    init_method: init_method
                })
            });

            const centroidResult = await centroidResponse.json();
            centroids = centroidResult.centers;  // Store initialized centroids

            // Draw the initialized centroids on the canvas
            drawCentroids(centroids);
        }
    });

    // KMeans step through functionality
    document.getElementById('step_through').addEventListener('click', async function() {
        if (!isDataGenerated) {
            alert("Please generate data first before running KMeans.");
            return;
        }

        const n_clusters = document.getElementById('n_clusters').value;
        const init_method = document.getElementById('init_method').value;

        try {
            const response = await fetch('/run_kmeans_step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: data,
                    n_clusters: n_clusters,
                    init_method: init_method,
                    current_iter: currentIteration,
                    prev_centers: currentCenters || centroids  // Send previous centroids if available
                })
            });

            if (!response.ok) {
                throw new Error('Failed to run KMeans step');
            }

            const result = await response.json();
            const centers = result.centers;

            if (!centers || centers.length === 0) {
                console.error('Error: No valid centroids returned.');
                return;
            }

            const labels = result.labels;
            const colors = generateColors(n_clusters);

            drawPoints(data, labels, colors);
            drawCentroids(centers);

            currentCenters = centers;
            currentIteration++;

            if (result.convergence_reached) {
                alert("Reaching Convergence!");
            }
        } catch (error) {
            console.error('Error in step through:', error);
        }
    });

    // KMeans run to convergence functionality
    document.getElementById('run_convergence').addEventListener('click', async function() {
        if (!isDataGenerated) {
            alert("Please generate data first before running KMeans.");
            return;
        }

        const n_clusters = document.getElementById('n_clusters').value;
        const init_method = document.getElementById('init_method').value;

        const response = await fetch('/run_kmeans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: data,
                n_clusters: n_clusters,
                init_method: init_method,
                centroids: init_method === 'manual' ? centroids : null
            })
        });

        const result = await response.json();
        const centers = result.centers;
        const labels = result.labels;
        const colors = generateColors(n_clusters);

        drawPoints(data, labels, colors);
        drawCentroids(centers);
    });

    // Function to generate colors for clusters
    function generateColors(n_clusters) {
        const colors = [];
        for (let i = 0; i < n_clusters; i++) {
            colors.push(`hsl(${Math.floor(360 * i / n_clusters)}, 100%, 50%)`);
        }
        return colors;
    }

    // Reset functionality
    document.getElementById('reset').addEventListener('click', async function() {
        const response = await fetch('/reset_kmeans', { method: 'POST' });
        const result = await response.json();
        isDataGenerated = false;  // Reset data generation flag
        currentIteration = 1;
        centroids = [];
        currentCenters = null;  // Clear previous centroids
        drawPoints(data);  // Optionally redraw points or clear the canvas
    });
});
