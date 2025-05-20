const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const app = express();

// Ruta base del proyecto
const BASE_DIR = __dirname;

app.use(express.static('public'));
// Aumentamos el límite para archivos más grandes como videos
app.use(express.json({ limit: '50mb' }));

// Endpoint para guardar fotos
app.post('/save-photo', (req, res) => {
  const { imageData } = req.body;
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `foto-${timestamp}.png`;
  const photoPath = path.join(BASE_DIR, 'fotos', filename);
  
  fs.writeFile(photoPath, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Error al guardar imagen:', err);
      return res.status(500).json({ error: 'No se pudo guardar la imagen' });
    }
    res.json({ success: true, filename, path: `/fotos/${filename}` });
  });
});

// Endpoint para guardar videos
app.post('/save-video', (req, res) => {
  const { videoData } = req.body;
  const base64Data = videoData.replace(/^data:video\/\w+;base64,/, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `video-${timestamp}.webm`;
  const videoPath = path.join(BASE_DIR, 'videos', filename);
  
  fs.writeFile(videoPath, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Error al guardar video:', err);
      return res.status(500).json({ error: 'No se pudo guardar el video' });
    }
    res.json({ success: true, filename, path: `/videos/${filename}` });
  });
});

// Endpoint para guardar audios
app.post('/save-audio', (req, res) => {
  const { audioData } = req.body;
  const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `audio-${timestamp}.webm`;
  const audioPath = path.join(BASE_DIR, 'audios', filename);
  
  fs.writeFile(audioPath, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Error al guardar audio:', err);
      return res.status(500).json({ error: 'No se pudo guardar el audio' });
    }
    res.json({ success: true, filename, path: `/audios/${filename}` });
  });
});

// Ruta para servir los archivos multimedia
app.use('/fotos', express.static(path.join(BASE_DIR, 'fotos')));
app.use('/videos', express.static(path.join(BASE_DIR, 'videos')));
app.use('/audios', express.static(path.join(BASE_DIR, 'audios')));

// Ruta principal
app.get('/', (req, res) => {
  res.send('¡Hola desde HTTPS con mkcert!');
});

// Configuración de HTTPS con certificados generados por mkcert
const opciones = {
  key: fs.readFileSync(path.join(BASE_DIR, 'ssl', 'key.pem')),
  cert: fs.readFileSync(path.join(BASE_DIR, 'ssl', 'cert.pem'))
};

// Crear servidor HTTPS
const puerto = 3000;
https.createServer(opciones, app).listen(puerto, () => {
  console.log(`Servidor seguro ejecutándose en https://localhost:${puerto}`);
});