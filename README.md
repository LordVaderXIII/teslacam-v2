# TeslaCam V2

This project is a web application for viewing and editing Tesla dashcam footage. It provides a user-friendly interface to watch video clips, customize the layout of the camera feeds, and export merged videos.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

## Setup and Installation

1.  **Clone the Repository**

    ```bash
    git clone <repository-url>
    cd teslacam-v2
    ```

2.  **Configure Environment Variables**

    Create a `.env` file by copying the example file:

    ```bash
    cp .env.example .env
    ```

    Open the `.env` file and set the following variables:

    *   `APP_USERNAME`: The username for basic authentication (default: `admin`).
    *   `APP_PASSWORD`: The password for basic authentication (default: `password`).
    *   `TESLACAM_DIR`: The path on your local machine to the directory containing your TeslaCam footage (default: `./teslacam`).

3.  **Add TeslaCam Footage**

    By default, the application is configured to look for your Tesla dashcam footage in a directory named `teslacam` at the root of the project.

    If your footage is located elsewhere, you can specify the path in your `.env` file using the `TESLACAM_DIR` variable. This local directory is then mapped as a volume to the `/usr/src/app/teslacam` directory inside the `backend` Docker container, where the application will read your footage from.

4.  **Run the Application**

    Use Docker Compose to build and run the application in detached mode:

    ```bash
    docker-compose up -d
    ```

    The application will be accessible at `http://localhost`.

## Docker Configuration

The application is containerized using Docker and managed with Docker Compose. The `docker-compose.yml` file defines two services:

*   `backend`: A Node.js application that serves the API.
*   `frontend`: A React application served by Nginx.

### Proxy Configuration

Nginx is used as a reverse proxy to direct traffic to the appropriate service. Here's how it's configured:

*   Requests to `/api` are forwarded to the `backend` service.
*   All other requests are served by the `frontend` service.

This allows the application to be accessed from a single domain, with Nginx handling the routing between the frontend and backend.
