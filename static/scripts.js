document.addEventListener('DOMContentLoaded', function() {
  let data = [];
  let centroids = [];  // Array to store manually selected centroids
  const canvas = document.getElementById('kmeans_plot');
  const ctx = canvas.getContext('2d');
  const canvasSize = 500;  // Assuming the canvas is 500x500 pixels
  let manualCentroidMode = false;  // Flag to indicate manual selection mode
  let currentIteration = 1;  // Initialize iteration counter

  // Function to scale and center the points on the canvas
  function scaleAndCenterPoints(points) {
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

      ctx.beginPath();
      ctx.moveTo(0, canvasSize / 2);
      ctx.lineTo(canvasSize, canvasSize / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(canvasSize / 2, 0);
      ctx.lineTo(canvasSize / 2, canvasSize);
      ctx.stroke();
  }

  // Function to draw the points on the canvas
  function drawPoints(points, labels = null, colors = []) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas
      drawAxes();  // Draw axes

      const scaledPoints = scaleAndCenterPoints(points);  // Scale points to canvas
      scaledPoints.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
          ctx.fillStyle = labels ? colors[labels[index]] : 'black';  // Use cluster labels for coloring points
          ctx.fill();
      });
  }

  // Function to draw centroids as red "X" marks
  function drawCentroids(centroids) {
      const scaledCentroids = scaleAndCenterPoints(centroids);

      // Loop through each centroid and draw an "X" mark
      scaledCentroids.forEach(centroid => {
          ctx.strokeStyle = 'red';  // Use red color for the "X"
          ctx.lineWidth = 2;

          ctx.beginPath();
          ctx.moveTo(centroid[0] - 5, centroid[1] - 5);  // Top-left of the "X"
          ctx.lineTo(centroid[0] + 5, centroid[1] + 5);  // Bottom-right of the "X"
          ctx.moveTo(centroid[0] - 5, centroid[1] + 5);  // Bottom-left of the "X"
          ctx.lineTo(centroid[0] + 5, centroid[1] - 5);  // Top-right of the "X"
          ctx.stroke();  // Draw the "X" on the canvas
      });
  }

  // Handle canvas clicks for manual centroid selection
  canvas.addEventListener('click', function(event) {
      if (manualCentroidMode) {
          const rect = canvas.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          // Scale the clicked coordinates back to the original data range
          const scaledX = (x / canvasSize) * 100;
          const scaledY = ((canvasSize - y) / canvasSize) * 100;  // Flip Y-axis

          centroids.push([scaledX, scaledY]);
          console.log('Manually selected centroid:', [scaledX, scaledY]);

          // Draw the updated centroids on the canvas
          drawCentroids(centroids);
      }
  });

  // Toggle manual centroid selection mode
  document.getElementById('init_method').addEventListener('change', function() {
      if (this.value === 'manual') {
          manualCentroidMode = true;
          centroids = [];  // Clear previously selected centroids
          console.log('Manual centroid selection mode enabled');
      } else {
          manualCentroidMode = false;
          centroids = [];  // Reset centroids if switching to another method
          console.log('Manual centroid selection mode disabled');
      }
  });

  // Generate new dataset and store it in the 'data' variable
  document.getElementById('generate').addEventListener('click', async function() {
      console.log('Generating new dataset...');
      const response = await fetch('/generate_dataset', { method: 'POST' });
      const result = await response.json();

      data = result.data;  // Store the generated dataset
      console.log('Generated data:', data);
      drawPoints(data);  // Draw the newly generated dataset on the canvas
  });

  // KMeans step through functionality
  document.getElementById('step_through').addEventListener('click', async function() {
    if (data.length === 0) {
        console.log('No data generated. Please generate a dataset first.');
        return;
    }

    const n_clusters = document.getElementById('n_clusters').value;
    const init_method = document.getElementById('init_method').value;

    try {
        console.log('Sending request to /run_kmeans_step');
        const response = await fetch('/run_kmeans_step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data, n_clusters: n_clusters, init_method: init_method, current_iter: currentIteration })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        console.log('Received response from /run_kmeans_step', result);
        const centers = result.centers;
        const labels = result.labels;
        const colors = generateColors(n_clusters);

        drawPoints(data, labels, colors);  // Draw points colored by cluster
        drawCentroids(centers);  // Draw the centroids

        currentIteration++;  // Increment iteration
    } catch (error) {
        console.error('Error in step through:', error);
    }
    });


  document.getElementById('run_convergence').addEventListener('click', async function() {
    if (data.length === 0) {
        console.log('No data generated. Please generate a dataset first.');
        return;
    }

    const n_clusters = document.getElementById('n_clusters').value;
    const init_method = document.getElementById('init_method').value;

    console.log('Sending request to /run_kmeans');
    const response = await fetch('/run_kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            data: data,
            n_clusters: n_clusters,
            init_method: init_method,
            centroids: init_method === 'manual' ? centroids : null  // Pass manually selected centroids if "manual" is selected
        })
    });

    const result = await response.json();
    console.log('Received response from /run_kmeans', result);
    const centers = result.centers;
    const labels = result.labels;
    const colors = generateColors(n_clusters);

    drawPoints(data, labels, colors);  // Draw points colored by cluster
    drawCentroids(centers);  // Draw the centroids
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
      console.log('Resetting algorithm');
      const response = await fetch('/reset_kmeans', { method: 'POST' });
      const result = await response.json();
      console.log('Received response from /reset_kmeans', result);

      currentIteration = 1;  // Reset iteration count
      centroids = [];  // Reset manual centroids if any
      drawPoints(data);  // Redraw the original dataset without centroids
  });
});
