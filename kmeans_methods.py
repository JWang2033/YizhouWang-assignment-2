from sklearn.cluster import KMeans
import numpy as np

# Global variable to store the current state of centroids across iterations
current_kmeans_state = {
    "centroids": None,
    "labels": None,
    "iterations": 0,
    "max_iterations": 10,  # You can adjust the max iterations if needed
}

# Function to run KMeans step-by-step
def run_kmeans_step(data, n_clusters, init_method, current_iter):
    global current_kmeans_state

    # Select initialization method
    if init_method == 'random':
        init = 'random'
    elif init_method == 'kmeans++':
        init = 'k-means++'
    else:
        init = 'random'  # Default to random for unsupported methods

    # If first iteration, initialize KMeans with provided data and settings
    if current_iter == 1 or current_kmeans_state["centroids"] is None:
        print("Initializing KMeans for the first step.")
        kmeans = KMeans(n_clusters=n_clusters, init=init, max_iter=1, n_init=1)
        kmeans.fit(data)
        current_kmeans_state["centroids"] = kmeans.cluster_centers_
        current_kmeans_state["labels"] = kmeans.labels_
        current_kmeans_state["iterations"] = 1
        return kmeans.cluster_centers_, kmeans.labels_

    # If not the first iteration, continue from previous centroids
    else:
        print(f"Running step {current_iter} of KMeans.")
        # Refit KMeans using previous centroids as initialization
        kmeans = KMeans(n_clusters=n_clusters, init=current_kmeans_state["centroids"], max_iter=1, n_init=1)
        kmeans.fit(data)
        current_kmeans_state["centroids"] = kmeans.cluster_centers_
        current_kmeans_state["labels"] = kmeans.labels_
        current_kmeans_state["iterations"] += 1

        return current_kmeans_state["centroids"], current_kmeans_state["labels"]


# Function to run KMeans to convergence
def run_kmeans_convergence(data, n_clusters, init_method, centroids=None):
    print(f"Running KMeans to convergence with {n_clusters} clusters and {init_method} initialization.")

    # Check if centroids are provided (manual initialization)
    if centroids is not None:
        print(f"Using manually provided centroids: {centroids}")
        init = np.array(centroids)  # Use the manually provided centroids
    else:
        # Handle the initialization method based on the provided init_method
        if init_method == 'random':
            init = 'random'
        elif init_method == 'kmeans++':
            init = 'k-means++'
        else:
            init = 'random'

    # Run KMeans to full convergence with explicit n_init
    kmeans = KMeans(n_clusters=n_clusters, init=init, n_init=10 if centroids is None else 1)  # n_init=1 for custom centroids
    kmeans.fit(data)

    # Return the converged cluster centers and labels
    return kmeans.cluster_centers_, kmeans.labels_


# Function to reset KMeans state (this is more relevant if you have global states,
# but in this case, we are resetting KMeans every time)
def reset_kmeans():
    print("Resetting KMeans state.")
    # Since the state is not being persisted in this version, no need for special logic here.
    return "reset"
