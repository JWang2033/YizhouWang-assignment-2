from flask import Flask, request, jsonify, render_template
import numpy as np
from kmeans_methods import run_kmeans_step, run_kmeans_convergence, reset_kmeans

app = Flask(__name__)

# Route to serve the main HTML page
@app.route('/')
def index():
    return render_template('index.html')

# Route to generate a random dataset
@app.route('/generate_dataset', methods=['POST'])
def generate_dataset():
    n_points = 100  # Example dataset size
    data = np.random.rand(n_points, 2) * 100  # Generate 2D points in the range [0, 100]
    return jsonify(data=data.tolist())

# Route to run KMeans step-by-step
@app.route('/run_kmeans_step', methods=['POST'])
def step_kmeans():
    try:
        data = np.array(request.json['data'])
        n_clusters = int(request.json['n_clusters'])
        init_method = request.json['init_method']
        current_iter = int(request.json['current_iter'])

        # Call the step function from your kmeans_methods module
        centers, labels = run_kmeans_step(data, n_clusters, init_method, current_iter)

        return jsonify(centers=centers.tolist(), labels=labels.tolist())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to run KMeans to convergence
@app.route('/run_kmeans', methods=['POST'])
def run_kmeans():
    try:
        data = np.array(request.json['data'])
        n_clusters = int(request.json['n_clusters'])
        init_method = request.json['init_method']
        centroids = request.json.get('centroids')

        centers, labels = run_kmeans_convergence(data, n_clusters, init_method, centroids)

        return jsonify(centers=centers.tolist(), labels=labels.tolist())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to reset KMeans
@app.route('/reset_kmeans', methods=['POST'])
def reset():
    result = reset_kmeans()
    return jsonify(status=result)

# Start the Flask application on port 5000 (to avoid conflicts with 3000)
if __name__ == '__main__':
    app.run(debug=True, port=5000)
