from sklearn.cluster import KMeans
import numpy as np
import random

# Random initialization of centroids from the data points
def random_initialization(data, n_clusters):
    return data[np.random.choice(data.shape[0], n_clusters, replace=False)]

# Farthest First Initialization Method
def farthest_first_initialization(data, n_clusters):
    centroids = []
    first_centroid = data[random.randint(0, len(data) - 1)]
    centroids.append(first_centroid)

    # Now choose the remaining centroids
    for _ in range(1, n_clusters):
        distances = np.array([min([np.linalg.norm(point - centroid) for centroid in centroids]) for point in data])
        next_centroid = data[np.argmax(distances)]
        centroids.append(next_centroid)

    return np.array(centroids)

# KMeans++ Initialization Method
def kmeans_plus_plus_initialization(data, n_clusters):
    kmeans = KMeans(n_clusters=n_clusters, init='k-means++', n_init=1, max_iter=1)
    kmeans.fit(data)
    return kmeans.cluster_centers_

# Function to initialize centroids based on the selected method
def initialize_centroids(data, n_clusters, init_method):
    if init_method == 'random':
        return random_initialization(data, n_clusters)
    elif init_method == 'farthest':
        return farthest_first_initialization(data, n_clusters)
    elif init_method == 'kmeans++':
        return kmeans_plus_plus_initialization(data, n_clusters)
    else:
        return None  # For manual mode, centroids are selected manually and not initialized

# Function to run one step of KMeans and detect convergence
def run_kmeans_step(data, n_clusters, init_method, current_iter, prev_centers=None):
    # If this is the first iteration, initialize the centroids
    if current_iter == 1:
        if init_method == 'random':
            init = 'random'
        elif init_method == 'kmeans++':
            init = 'k-means++'
        elif init_method == 'farthest':
            init = farthest_first_initialization(data, n_clusters)  # Custom farthest first initialization
        else:
            init = 'random'

        # Initialize KMeans with max_iter=1 for step-through and set n_init to 10
        kmeans = KMeans(n_clusters=n_clusters, init=init, max_iter=1, n_init=10)
    else:
        # If using previous centers, ensure the number of centers matches n_clusters
        if prev_centers is not None and len(prev_centers) == n_clusters:
            init = np.array(prev_centers)  # Convert previous centers to numpy array
            # Use n_init=1 for manually provided centroids
            kmeans = KMeans(n_clusters=n_clusters, init=init, max_iter=1, n_init=1)
        else:
            # If prev_centers is missing or invalid, fallback to standard initialization
            init = 'random' if init_method == 'random' else 'k-means++'
            kmeans = KMeans(n_clusters=n_clusters, init=init, max_iter=1, n_init=10)

    # Fit the data for one iteration
    kmeans.fit(data)

    # Check if centroids have changed (convergence check)
    if prev_centers is not None and np.allclose(prev_centers, kmeans.cluster_centers_):
        convergence_reached = True
    else:
        convergence_reached = False

    # Return the new centroids, labels, and convergence status
    return kmeans.cluster_centers_, kmeans.labels_, convergence_reached

# Function to run KMeans to convergence
def run_kmeans_convergence(data, n_clusters, init_method, centroids=None):
    if centroids is not None:
        # Use manually provided centroids if available
        init = np.array(centroids)
    else:
        # Use the initialization method provided (random or kmeans++)
        if init_method == 'random':
            init = 'random'
        elif init_method == 'kmeans++':
            init = 'k-means++'
        elif init_method == 'farthest':
            init = farthest_first_initialization(data, n_clusters)
        else:
            init = 'random'

    # Set n_init=10 for standard initialization or n_init=1 for manual centroids
    kmeans = KMeans(n_clusters=n_clusters, init=init, n_init=10 if centroids is None else 1)
    kmeans.fit(data)

    return kmeans.cluster_centers_, kmeans.labels_

# Reset function for KMeans (if needed)
def reset_kmeans():
    # This function can handle any reset logic if needed
    return "Reset successful"
