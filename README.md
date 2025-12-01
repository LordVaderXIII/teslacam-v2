# TeslaCam V2

This project is a web application for viewing and editing Tesla dashcam footage. It provides a user-friendly interface to watch video clips, customize the layout of the camera feeds, and export merged videos. It is currently broken, as it is in development. 

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

    The application is configured to look for your Tesla dashcam footage in a directory with the following structure:

    ```
    <TESLACAM_DIR>/
    ├── RecentClips/
    │   └── <event_folder>/
    │       ├── <timestamp>-front.mp4
    │       └── ...
    ├── SavedClips/
    │   └── <event_folder>/
    │       ├── <timestamp>-front.mp4
    │       └── ...
    └── SentryClips/
        └── <event_folder>/
            ├── <timestamp>-front.mp4
            └── ...
    ```

    By default, `TESLACAM_DIR` is set to `./teslacam` at the root of the project. This local directory is mapped as a volume to the `/usr/src/app/teslacam` directory inside the `backend` Docker container.

4.  **Run the Application**

    Use Docker Compose to build and run the application in detached mode:

    ```bash
    docker-compose up -d --build
    ```

    The application will be accessible at `http://localhost`.

## Developer Guide

This section provides a technical overview of the project for developers and AI agents who want to contribute to the codebase.

### Project Architecture

The application is composed of two main services, orchestrated by Docker Compose:

*   **`backend`**: A Node.js and Express application that serves the API. It is responsible for reading the TeslaCam footage, managing video events, and handling video exports.
*   **`frontend`**: A React application, served by Nginx, that provides the user interface.

Nginx also acts as a reverse proxy, directing requests to the appropriate service:

*   Requests to `/api` are forwarded to the `backend` service.
*   All other requests are served by the `frontend`.

### Folder Structure

```
.
├── backend/
│   └── index.js      # Main backend file
├── frontend/
│   ├── public/
│   └── src/          # React source code
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
└── README.md
```

### Backend (Node.js/Express)

The backend is a single-file application (`backend/index.js`) that performs the following tasks:

*   **File Watching**: It uses `chokidar` to watch the `TESLACAM_DIR` for new video event folders.
*   **Event Management**: It maintains an in-memory dictionary of video events, which is populated by an initial scan and updated by the file watcher.
*   **API Server**: It exposes a set of API endpoints for the frontend to consume.

#### Key Dependencies:

*   `express`: Web framework
*   `chokidar`: File watcher
*   `fluent-ffmpeg`: For video processing and exports

#### API Endpoints:

*   `GET /api/health`: A healthcheck endpoint.
*   `GET /api/events`: Returns a sorted list of all video events.
*   `GET /api/video/:eventId/:camera`: Streams a specific video file.
*   `POST /api/export`: Exports a merged video clip.

### Frontend (React)

The frontend is a standard Create React App application.

#### Key Components:

*   `App.js`: The main component, which handles routing.
*   `EventGallery.js`: Displays a gallery of all video events.
*   `VideoPlayer.js`: The main video player component, which allows users to view and export clips.

#### Authentication

The application uses basic authentication. The `APP_USERNAME` and `APP_PASSWORD` from the `.env` file are used to protect the application. The frontend stores the credentials in `sessionStorage` and includes them in all API requests.
