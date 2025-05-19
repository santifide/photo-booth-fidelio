const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' })); // para imágenes en base64

app.post('/save-photo', (req, res) => {
  const { imageData } = req.body;
  const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `foto-${timestamp}.png`;

  fs.writeFile(`./fotos/${filename}`, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Error al guardar imagen:', err);
      return res.status(500).json({ error: 'No se pudo guardar la imagen' });
    }
    res.json({ success: true, filename });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
