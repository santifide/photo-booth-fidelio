# Photo Booth Fidelio

Una aplicación web de fotomatón que permite capturar, guardar y gestionar fotos, videos y audios utilizando Node.js y HTTPS local.

## Índice
1. [Requisitos previos](#requisitos-previos)
2. [Configuración HTTPS con mkcert](#configuración-https-con-mkcert)
3. [Instalación y configuración](#instalación-y-configuración)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Instrucciones de uso](#instrucciones-de-uso)
6. [Conexión con WordPress](#conexión-con-wordpress)
7. [Solución de problemas](#solución-de-problemas)

## Requisitos previos

- Node.js (v14 o superior)
- npm (viene con Node.js)
- Ubuntu o distribución Linux similar
- Acceso a un sitio WordPress (para la integración con WordPress)

## Configuración HTTPS con mkcert

Para un entorno de desarrollo local seguro, configuraremos HTTPS utilizando mkcert:

### 1. Instalar mkcert y dependencias

```bash
sudo apt update
sudo apt install libnss3-tools -y
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
```

### 2. Configurar la Autoridad Certificadora (CA) local y generar certificados

```bash
# Inicializar mkcert como CA local
mkcert -install

# Crear directorio para los certificados
mkdir -p ssl

# Generar certificados para localhost
mkcert -key-file ssl/key.pem -cert-file ssl/cert.pem localhost 127.0.0.1 ::1
```

Los certificados generados con mkcert son reconocidos por tu navegador como válidos, por lo que no verás advertencias de seguridad.

## Instalación y configuración

### 1. Clonar/crear el proyecto

```bash
# Si estás creando un nuevo proyecto
mkdir photo-booth-fidelio
cd photo-booth-fidelio

# Inicializar proyecto npm
npm init -y
```

### 2. Instalar dependencias

```bash
npm install express
```

### 3. Crear directorios para almacenar archivos multimedia

```bash
mkdir -p public
mkdir -p fotos
mkdir -p videos
mkdir -p audios
```

### 4. Crear archivo server.js

Crea un archivo `server.js` con el siguiente contenido:

```javascript
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
  res.sendFile(path.join(BASE_DIR, 'public', 'index.html'));
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
```

### 5. Crear archivo HTML de la interfaz

Crea un archivo `public/index.html` con el código HTML/JavaScript para la interfaz de usuario (el código completo está disponible en el repositorio).

### 6. Iniciar el servidor

```bash
node server.js
```

Ahora puedes acceder a la aplicación en: https://localhost:3000

## Estructura del proyecto

```
photo-booth-fidelio/
├── server.js             # Servidor Node.js
├── package.json          # Configuración del proyecto
├── ssl/                  # Certificados SSL
│   ├── key.pem
│   └── cert.pem
├── public/               # Archivos estáticos
│   └── index.html        # Interfaz de usuario
├── fotos/                # Almacenamiento de fotos
├── videos/               # Almacenamiento de videos
└── audios/               # Almacenamiento de audios
```

## Instrucciones de uso

1. **Iniciar la aplicación**:
   - Ejecuta `node server.js` desde la terminal
   - Accede a https://localhost:3000 en tu navegador

2. **Usar la aplicación**:
   - Haz clic en "Iniciar Cámara" para activar la cámara web
   - Utiliza los botones correspondientes para:
     - Tomar una foto
     - Grabar un video
     - Grabar audio
   - Los archivos se guardan automáticamente en sus respectivas carpetas
   - Todos los archivos capturados aparecen en la galería al final de la página

3. **Acceder a los archivos**:
   - Las fotos se guardan en la carpeta `fotos/`
   - Los videos se guardan en la carpeta `videos/`
   - Los audios se guardan en la carpeta `audios/`

## Conexión con WordPress

Para integrar esta aplicación con WordPress, puedes utilizar el siguiente enfoque:

### 1. Configurar un endpoint en WordPress para recibir archivos

Instala y activa el plugin "WP REST API" si aún no está activado, y luego añade este código a tu archivo `functions.php` del tema o a un plugin personalizado:

```php
// Registrar endpoint personalizado para recibir archivos multimedia
add_action('rest_api_init', function () {
  register_rest_route('photobooth/v1', '/upload', array(
    'methods' => 'POST',
    'callback' => 'process_photobooth_upload',
    'permission_callback' => function () {
      return current_user_can('upload_files');
    }
  ));
});

// Función para procesar archivos subidos
function process_photobooth_upload($request) {
  // Verificar nonce para seguridad
  if (!wp_verify_nonce($request->get_header('X-WP-Nonce'), 'wp_rest')) {
    return new WP_Error('no_nonce', 'Verificación de seguridad fallida', array('status' => 403));
  }
  
  // Obtener parámetros
  $params = $request->get_params();
  $file_data = isset($params['file_data']) ? $params['file_data'] : '';
  $file_type = isset($params['file_type']) ? $params['file_type'] : '';
  $file_name = isset($params['file_name']) ? $params['file_name'] : '';
  
  if (empty($file_data) || empty($file_type) || empty($file_name)) {
    return new WP_Error('missing_data', 'Faltan datos requeridos', array('status' => 400));
  }
  
  // Decodificar la data base64
  $decoded_data = base64_decode(preg_replace('#^data:' . $file_type . ';base64,#i', '', $file_data));
  
  // Crear archivo temporal
  $upload_dir = wp_upload_dir();
  $temp_file = $upload_dir['path'] . '/' . $file_name;
  file_put_contents($temp_file, $decoded_data);
  
  // Preparar datos para la biblioteca de medios
  $file_path_parts = pathinfo($file_name);
  $wp_filetype = wp_check_filetype($file_name);
  
  $attachment = array(
    'post_mime_type' => $wp_filetype['type'],
    'post_title' => sanitize_file_name($file_path_parts['filename']),
    'post_content' => '',
    'post_status' => 'inherit'
  );
  
  // Insertar en la biblioteca de medios
  $attach_id = wp_insert_attachment($attachment, $temp_file);
  
  if (!is_wp_error($attach_id)) {
    // Generar metadatos
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    $attach_data = wp_generate_attachment_metadata($attach_id, $temp_file);
    wp_update_attachment_metadata($attach_id, $attach_data);
    
    return array(
      'success' => true,
      'attachment_id' => $attach_id,
      'url' => wp_get_attachment_url($attach_id)
    );
  } else {
    return new WP_Error('upload_error', 'Error al subir archivo', array('status' => 500));
  }
}
```

### 2. Modificar el código del cliente para enviar archivos a WordPress

Añade esta función a tu archivo `public/index.html`:

```javascript
// Función para enviar archivos a WordPress
async function sendToWordPress(filePath, fileType, fileName) {
  // Primero obtener el archivo del servidor local
  const response = await fetch(filePath);
  const blob = await response.blob();
  
  // Convertir a base64
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  
  reader.onloadend = async () => {
    const base64data = reader.result;
    
    try {
      // URL de tu sitio WordPress
      const wpEndpoint = 'https://tu-sitio-wordpress.com/wp-json/photobooth/v1/upload';
      
      // Obtener nonce (necesitarás implementar esto)
      const wpNonce = await getWordPressNonce();
      
      const wpResponse = await fetch(wpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': wpNonce
        },
        body: JSON.stringify({
          file_data: base64data,
          file_type: fileType,
          file_name: fileName
        })
      });
      
      const result = await wpResponse.json();
      
      if (result.success) {
        showStatus(`Archivo subido a WordPress correctamente: ${result.url}`, 'success');
      } else {
        throw new Error(result.message || 'Error al subir a WordPress');
      }
    } catch (error) {
      console.error('Error al enviar a WordPress:', error);
      showStatus(`Error al enviar a WordPress: ${error.message}`, 'error');
    }
  };
}

// Función para obtener nonce de WordPress (implementar según tu configuración)
async function getWordPressNonce() {
  // Esto depende de cómo manejes la autenticación
  // Podrías tener un endpoint específico o usar cookies
  try {
    const response = await fetch('https://tu-sitio-wordpress.com/wp-json/photobooth/v1/get-nonce');
    const data = await response.json();
    return data.nonce;
  } catch (error) {
    console.error('Error al obtener nonce:', error);
    throw new Error('No se pudo obtener autorización de WordPress');
  }
}
```

### 3. Modificar la función addToGallery para incluir botón de subir a WordPress

```javascript
function addToGallery(path, type, filename) {
  const mediaItem = document.createElement('div');
  mediaItem.className = 'media-item';
  
  // Crear elemento multimedia (como antes)
  // ...
  
  // Añadir botón para subir a WordPress
  const wpButton = document.createElement('button');
  wpButton.textContent = 'Subir a WordPress';
  wpButton.className = 'wp-upload-btn';
  wpButton.onclick = () => {
    let mimeType;
    if (type === 'foto') mimeType = 'image/png';
    else if (type === 'video') mimeType = 'video/webm';
    else if (type === 'audio') mimeType = 'audio/webm';
    
    sendToWordPress(path, mimeType, filename);
  };
  
  mediaItem.appendChild(mediaElement);
  mediaItem.appendChild(mediaInfo);
  mediaItem.appendChild(wpButton);
  
  gallery.insertBefore(mediaItem, gallery.firstChild);
}
```

## Solución de problemas

### Problemas con certificados SSL

Si encuentras problemas con los certificados SSL:

1. Verifica que mkcert está correctamente instalado:
   ```bash
   mkcert -version
   ```

2. Reinstala la Autoridad Certificadora local:
   ```bash
   mkcert -uninstall
   mkcert -install
   ```

3. Regenera los certificados:
   ```bash
   rm -f ssl/key.pem ssl/cert.pem
   mkcert -key-file ssl/key.pem -cert-file ssl/cert.pem localhost 127.0.0.1 ::1
   ```

### Error: ENOENT: no such file or directory, open 'ssl/key.pem'

Este error ocurre cuando los certificados no se encuentran en la ubicación especificada:

1. Asegúrate de que el directorio `ssl` existe:
   ```bash
   mkdir -p ssl
   ```

2. Verifica que los certificados se crearon correctamente:
   ```bash
   ls -la ssl/
   ```

3. Si los certificados no existen, genera nuevos certificados como se indica arriba.

### Los archivos multimedia no se guardan

1. Verifica que los directorios de destino existen y tienen permisos de escritura:
   ```bash
   mkdir -p fotos videos audios
   chmod 755 fotos videos audios
   ```

2. Comprueba los logs del servidor para ver errores específicos.

### Problemas de conexión con WordPress

1. Verifica que tu sitio WordPress tenga habilitada la API REST
2. Comprueba que la autenticación (nonce) esté configurada correctamente
3. Verifica los permisos CORS si WordPress está en un dominio diferente