from flask import Flask, request, jsonify, render_template
import numpy as np
from kmeans_methods import initialize_centroids, run_kmeans_step, run_kmeans_convergence, reset_kmeans

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/initialize_centroids', methods=['POST'])
def initialize_centroids_route():
    data = np.array(request.json['data'])
    n_clusters = int(request.json['n_clusters'])
    init_method = request.json['init_method']

    if init_method != 'manual':
        centers = initialize_centroids(data, n_clusters, init_method)
        return jsonify(centers=centers.tolist())
    else:
        return jsonify(centers=[])

@app.route('/generate_dataset', methods=['POST'])
def generate_dataset():
    n_points = 100  # Example dataset size
    data = np.random.rand(n_points, 2) * 100  # Generate 2D points in the range [0, 100]
    return jsonify(data=data.tolist())

@app.route('/run_kmeans_step', methods=['POST'])
def step_kmeans():
    data = np.array(request.json['data'])
    n_clusters = int(request.json['n_clusters'])
    init_method = request.json['init_method']
    current_iter = int(request.json['current_iter'])
    prev_centers = request.json.get('prev_centers')

    centers, labels, convergence_reached = run_kmeans_step(data, n_clusters, init_method, current_iter, prev_centers)
    return jsonify(centers=centers.tolist(), labels=labels.tolist(), convergence_reached=convergence_reached)

@app.route('/run_kmeans', methods=['POST'])
def run_kmeans():
    data = np.array(request.json['data'])
    n_clusters = int(request.json['n_clusters'])
    init_method = request.json['init_method']
    centroids = request.json.get('centroids')

    centers, labels = run_kmeans_convergence(data, n_clusters, init_method, centroids)
    return jsonify(centers=centers.tolist(), labels=labels.tolist())

@app.route('/reset_kmeans', methods=['POST'])
def reset():
    result = reset_kmeans()
    return jsonify(status=result)

if __name__ == '__main__':
    app.run(debug=True, port=3000)
