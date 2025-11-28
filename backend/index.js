const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const basicAuth = require('express-basic-auth');
const chokidar = require('chokidar');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3001;
const TESLACAM_DIR = path.join(__dirname, '../teslacam');
const EXPORT_DIR = path.join(__dirname, 'exports');

if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR);
if (!fs.existsSync(TESLACAM_DIR)) fs.mkdirSync(TESLACAM_DIR);

app.use(express.json());

// --- Healthcheck endpoint ---
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

let videoEvents = {};
const clipTypes = ['RecentClips', 'SavedClips', 'SentryClips'];

// --- Initial Synchronous Scan ---
console.log('Performing initial scan of TeslaCam directory...');
clipTypes.forEach(clipType => {
    const clipTypeDir = path.join(TESLACAM_DIR, clipType);
    if (fs.existsSync(clipTypeDir)) {
        const initialDirs = fs.readdirSync(clipTypeDir, { withFileTypes: true });
        initialDirs.forEach(dirent => {
            if (dirent.isDirectory() && dirent.name.match(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/)) {
                const dirName = dirent.name;
                const eventId = `${clipType}__${dirName}`;
                console.log(`Found initial event folder: ${eventId}`);
                videoEvents[eventId] = { id: eventId, timestamp: dirName.replace('_', ' '), cameras: [] };
                const files = fs.readdirSync(path.join(clipTypeDir, dirName));
                files.forEach(file => {
                    if (file.endsWith('.mp4')) {
                        const camera = file.split('-').pop().replace('.mp4', '');
                        videoEvents[eventId].cameras.push(camera);
                    }
                });
            }
        });
    }
});
console.log('Initial scan complete.');

// --- Asynchronous Watcher for new files ---
const watcher = chokidar.watch(clipTypes.map(c => path.join(TESLACAM_DIR, c)), { ignored: /(^|[\/\\])\../, persistent: true, depth: 2 });

watcher
  .on('addDir', dirPath => {
    const dirName = path.basename(dirPath);
    const clipType = path.basename(path.dirname(dirPath));
    if (clipTypes.includes(clipType) && dirName.match(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/)) {
        const eventId = `${clipType}__${dirName}`;
        if (!videoEvents[eventId]) {
            console.log(`Watcher found new event: ${eventId}`);
            videoEvents[eventId] = { id: eventId, timestamp: dirName.replace('_', ' '), cameras: [] };
            fs.readdir(dirPath, (err, files) => {
                if (err) return;
                files.forEach(file => {
                    if (file.endsWith('.mp4')) {
                        const camera = file.split('-').pop().replace('.mp4', '');
                        videoEvents[eventId].cameras.push(camera);
                    }
                });
            });
        }
    }
  })
  .on('unlinkDir', dirPath => {
    const dirName = path.basename(dirPath);
    const clipType = path.basename(path.dirname(dirPath));
    if (clipTypes.includes(clipType)) {
        const eventId = `${clipType}__${dirName}`;
        if (videoEvents[eventId]) {
            console.log(`Watcher removed event: ${eventId}`);
            delete videoEvents[eventId];
        }
    }
  });


const appUsername = process.env.APP_USERNAME || 'admin';
const appPassword = process.env.APP_PASSWORD || 'password';
const users = { [appUsername]: appPassword };
app.use(basicAuth({ users, challenge: true, realm: 'TeslaCamViewer' }));

// API endpoints... (rest of the file is the same)
app.get('/api/events', (req, res) => {
  const sortedEvents = Object.values(videoEvents).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json(sortedEvents);
});

app.get('/api/directory-status', (req, res) => {
  fs.stat(TESLACAM_DIR, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking directory status.' });
    }
    res.json({ isDirectory: stats.isDirectory(), hasAccess: true });
  });
});

app.get('/api/video/:eventId/:camera', (req, res) => {
    const { eventId, camera } = req.params;
    const [clipType, dirName] = eventId.split('__');
    if (!clipTypes.includes(clipType)) return res.status(404).send('Invalid clip type.');
    const eventDir = path.join(TESLACAM_DIR, clipType, dirName);
    let videoFile = '';
    try {
        const files = fs.readdirSync(eventDir);
        const targetFile = files.find(file => file.endsWith(`-${camera}.mp4`));
        if (targetFile) videoFile = path.join(eventDir, targetFile);
    } catch (error) { return res.status(404).send('Event directory not found.'); }

    if (!videoFile || !fs.existsSync(videoFile)) return res.status(404).send('Video file not found.');
    
    const stat = fs.statSync(videoFile);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoFile, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`, 'Accept-Ranges': 'bytes',
            'Content-Length': chunksize, 'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' };
        res.writeHead(200, head);
        fs.createReadStream(videoFile).pipe(res);
    }
});

app.post('/api/export', (req, res) => {
    const { eventId, startTime, endTime, cameras, mainCamera } = req.body;
    const duration = endTime - startTime;
    const outputFilename = `${eventId}-export-${Date.now()}.mp4`;
    const outputPath = path.join(EXPORT_DIR, outputFilename);
    const [clipType, dirName] = eventId.split('__');
    if (!clipTypes.includes(clipType)) return res.status(400).send('Invalid clip type.');
    const eventDir = path.join(TESLACAM_DIR, clipType, dirName);
    
    const ffmpegArgs = [];
    const complexFilter = [];
    const inputs = [];
    
    cameras.forEach((camera, index) => {
        const files = fs.readdirSync(eventDir);
        const file = files.find(f => f.endsWith(`-${camera}.mp4`));
        if (file) {
            const inputPath = path.join(eventDir, file);
            ffmpegArgs.push('-ss', startTime, '-t', duration, '-i', inputPath);
            inputs.push({ camera, index });
        }
    });

    const mainCamInput = inputs.find(i => i.camera === mainCamera);
    const otherCamInputs = inputs.filter(i => i.camera !== mainCamera);
    const positions = ['10:10', 'W-w-10:10', '10:H-h-10', 'W-w-10:H-h-10'];

    let currentOverlay = `[${mainCamInput.index}:v]`;
    otherCamInputs.forEach((camInput, i) => {
        complexFilter.push(`[${camInput.index}:v]scale=320:240[cam${i}]`);
        const nextOverlay = (i === otherCamInputs.length - 1) ? `[out]` : `[tmp${i}]`;
        complexFilter.push(`${currentOverlay}[cam${i}]overlay=${positions[i % 4]}${nextOverlay}`);
        currentOverlay = nextOverlay;
    });

    ffmpegArgs.push('-filter_complex', complexFilter.join(';'), '-map', '[out]', outputPath);

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stderr.on('data', (data) => console.error(`ffmpeg stderr: ${data}`));

    ffmpegProcess.on('close', (code) => {
        if (code === 0) {
            res.download(outputPath, outputFilename, (err) => {
                if (err) console.error("Error sending file:", err);
                fs.unlinkSync(outputPath);
            });
        } else {
            res.status(500).send('Error creating video export.');
        }
    });
});

app.listen(port, () => console.log(`Backend server listening at http://localhost:${port}`));
