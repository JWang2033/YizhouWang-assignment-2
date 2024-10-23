# Makefile for KMeans Clustering Visualization

# Variables
FLASK_APP=app.py
FLASK_ENV=development
PORT=3000

# Targets
install:
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt

run:
	@echo "Starting Flask server on http://localhost:3000..."
	FLASK_APP=$(FLASK_APP) FLASK_ENV=$(FLASK_ENV) flask run --port=$(PORT) & \
	sleep 5  # Sleep for 5 seconds to ensure the server has time to start

clean:
	@echo "Cleaning up __pycache__..."
	find . -type d -name "__pycache__" -exec rm -rf {} +

.PHONY: install run clean

# Define the port number
PORT = 3000

# Command to find and kill the process occupying the port
killport:
		@echo "Checking if port $(PORT) is in use..."
		@PID=$$(lsof -ti tcp:$(PORT)); \
		if [ -n "$$PID" ]; then \
				echo "Killing process $$PID on port $(PORT)..."; \
				kill -9 $$PID; \
		else \
				echo "No process found on port $(PORT)."; \
		fi

# Start the Flask application
run: killport
		@echo "Starting Flask on port $(PORT)..."
		python app.py
