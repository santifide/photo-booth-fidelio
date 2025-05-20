// --- ELEMENTOS DOM ---
const btnComenzar = document.getElementById("btn-comenzar");
const btnFinalizar = document.getElementById("btn-finalizar");
const pantallaInicial = document.getElementById("pantalla-inicial");
const pantallaCuenta = document.getElementById("pantalla-cuenta-regresiva");
const pantallaCaptura = document.getElementById("pantalla-captura");
const pantallaEdicion = document.getElementById("pantalla-edicion");
const cuenta = document.getElementById("cuenta");
const video = document.getElementById("video");
const canvasEdicion = document.getElementById("canvas-edicion");
const inputColorLapiz = document.getElementById("color-lapiz");
const inputGrosorLapiz = document.getElementById("grosor-lapiz");
const btnFoto = document.getElementById("btn-foto");
const btnAudio = document.getElementById("btn-audio");
const btnVideo = document.getElementById("btn-video");
const modulosDiv = document.getElementById("modulos");
const grabacionControls = document.getElementById("grabacion-controls");
const btnPausa = document.getElementById("btn-pausa");
const btnStop = document.getElementById("btn-stop");
const contador = document.getElementById("contador");
const previewContainer = document.getElementById("preview-container");
const audioPreview = document.getElementById("audio-preview");
const videoPreview = document.getElementById("video-preview");
const btnGuardarMedia = document.getElementById("btn-guardar-media");
const btnBorrarMedia = document.getElementById("btn-borrar-media");

// --- VARIABLES GLOBALES ---
let stream;
let fabricCanvas;
let mediaRecorder;
let recordedChunks = [];
let tipoMedioActual = null; // 'foto', 'audio' o 'video'
let contadorInterval;
let tiempoTranscurrido = 0;
let mediaBlob = null;
let estadoPausa = false;

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  // Mostrar la pantalla inicial
  mostrarPantalla(pantallaInicial);
  
  // Configurar checkboxes para módulos
  toggleModulo("chk-foto", "btn-foto");
  toggleModulo("chk-audio", "btn-audio");
  toggleModulo("chk-video", "btn-video");
  
  // Evento para botón comenzar (botón principal)
  btnComenzar.addEventListener("click", () => {
    mostrarPantalla(modulosDiv);
  });
  
  // Configurar botones de módulos
  btnFoto.addEventListener("click", iniciarProcesoFoto);
  btnAudio.addEventListener("click", iniciarProcesoAudio);
  btnVideo.addEventListener("click", iniciarProcesoVideo);
  
  // Configurar botones de control de grabación
  btnPausa.addEventListener("click", pausarReanudarGrabacion);
  btnStop.addEventListener("click", detenerGrabacion);
  
  // Configurar botones de preview
  btnGuardarMedia.addEventListener("click", guardarMedia);
  btnBorrarMedia.addEventListener("click", borrarMediaYReiniciar);
  
  // Configurar botón finalizar edición
  btnFinalizar.addEventListener("click", finalizarEdicion);
  
  // Configurar WordPress si está habilitado
  const wpEnable = document.getElementById("wp-enable");
  const wpSettings = document.getElementById("wp-settings");
  
  if (wpEnable) {
    wpEnable.addEventListener("change", () => {
      wpSettings.style.display = wpEnable.checked ? "block" : "none";
    });
    
    // Cargar configuración guardada
    if (localStorage.getItem("wp-url")) {
      document.getElementById("wp-url").value = localStorage.getItem("wp-url");
      document.getElementById("wp-user").value = localStorage.getItem("wp-user");
      wpEnable.checked = localStorage.getItem("wp-enabled") === "true";
      wpSettings.style.display = wpEnable.checked ? "block" : "none";
    }
    
    // Guardar configuración
    document.getElementById("btn-guardar-wp-config").addEventListener("click", () => {
      localStorage.setItem("wp-url", document.getElementById("wp-url").value);
      localStorage.setItem("wp-user", document.getElementById("wp-user").value);
      localStorage.setItem("wp-enabled", wpEnable.checked);
      alert("Configuración de WordPress guardada");
    });
  }
});

// --- FUNCIONES DE UTILIDAD ---
function mostrarPantalla(pantalla) {
  // Ocultar todas las pantallas
  pantallaInicial.style.display = "none";
  pantallaCuenta.style.display = "none";
  pantallaCaptura.style.display = "none";
  pantallaEdicion.style.display = "none";
  modulosDiv.style.display = "none";
  grabacionControls.style.display = "none";
  previewContainer.style.display = "none";
  
  // Mostrar la pantalla indicada
  if (pantalla) {
    pantalla.style.display = "block";
  }
}

function iniciarCuentaRegresiva(segundos, accionAlFinalizar) {
  mostrarPantalla(pantallaCuenta);
  cuenta.textContent = segundos;
  let tiempo = segundos;
  const intervalo = setInterval(() => {
    tiempo--;
    cuenta.textContent = tiempo;
    if (tiempo <= 0) {
      clearInterval(intervalo);
      accionAlFinalizar();
    }
  }, 1000);
}

function toggleModulo(checkboxId, botonId) {
  const chk = document.getElementById(checkboxId);
  const btn = document.getElementById(botonId);
  chk.addEventListener("change", () => {
    btn.style.display = chk.checked ? "inline-block" : "none";
  });
  btn.style.display = chk.checked ? "inline-block" : "none";
}

// --- PROCESO DE FOTO ---
function iniciarProcesoFoto() {
  tipoMedioActual = "foto";
  iniciarCuentaRegresiva(5, iniciarCamaraParaFoto);
}

function iniciarCamaraParaFoto() {
  mostrarPantalla(pantallaCaptura);
  
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    })
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;
      
      // Tomar foto después de un pequeño retraso para que la cámara esté lista
      setTimeout(capturarFoto, 1000);
    })
    .catch((err) => {
      alert("Error accediendo a la cámara");
      console.error("Error de cámara:", err);
      mostrarPantalla(pantallaInicial);
    });
}

function capturarFoto() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/png");

  // Detener la cámara
  detenerStream();

  // Modo edición
  mostrarPantalla(pantallaEdicion);

  // Configurar canvas de edición con fabric.js
  fabricCanvas = new fabric.Canvas("canvas-edicion", {
    isDrawingMode: true,
  });

  fabricCanvas.freeDrawingBrush.color = inputColorLapiz.value;
  fabricCanvas.freeDrawingBrush.width = parseInt(inputGrosorLapiz.value);

  inputColorLapiz.addEventListener("change", () => {
    fabricCanvas.freeDrawingBrush.color = inputColorLapiz.value;
  });
  
  inputGrosorLapiz.addEventListener("change", () => {
    fabricCanvas.freeDrawingBrush.width = parseInt(inputGrosorLapiz.value);
  });

  fabric.Image.fromURL(dataUrl, (img) => {
    fabricCanvas.setWidth(img.width);
    fabricCanvas.setHeight(img.height);
    fabricCanvas.setBackgroundImage(
      img,
      fabricCanvas.renderAll.bind(fabricCanvas)
    );
  });
}

// --- PROCESO DE AUDIO ---
function iniciarProcesoAudio() {
  tipoMedioActual = "audio";
  iniciarCuentaRegresiva(3, iniciarGrabacionAudio);
}

function iniciarGrabacionAudio() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((mediaStream) => {
      stream = mediaStream;
      
      iniciarGrabacion(mediaStream, "audio");
      mostrarPantalla(grabacionControls);
      
      // Iniciar contador
      iniciarContador();
    })
    .catch((err) => {
      alert("Error accediendo al micrófono");
      console.error("Error de micrófono:", err);
      mostrarPantalla(pantallaInicial);
    });
}

// --- PROCESO DE VIDEO ---
function iniciarProcesoVideo() {
  tipoMedioActual = "video";
  iniciarCuentaRegresiva(3, iniciarGrabacionVideo);
}

function iniciarGrabacionVideo() {
  mostrarPantalla(pantallaCaptura);
  
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: true,
    })
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;
      video.play();
      
      iniciarGrabacion(mediaStream, "video");
      mostrarPantalla(grabacionControls);
      
      // Iniciar contador
      iniciarContador();
    })
    .catch((err) => {
      alert("Error accediendo a la cámara y micrófono");
      console.error("Error de cámara/micrófono:", err);
      mostrarPantalla(pantallaInicial);
    });
}

// --- FUNCIONES DE GRABACIÓN COMPARTIDAS ---
function iniciarGrabacion(mediaStream, tipo) {
  recordedChunks = [];
  estadoPausa = false;
  
  const mimeType = tipo === "audio" 
    ? { mimeType: "audio/webm" }
    : { mimeType: "video/webm;codecs=vp8,opus" };
  
  mediaRecorder = new MediaRecorder(mediaStream, mimeType);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blobType = tipo === "audio" ? "audio/webm" : "video/webm";
    mediaBlob = new Blob(recordedChunks, { type: blobType });
    mostrarPreview();
  };

  mediaRecorder.start();
  console.log(`Grabando ${tipo}...`);
  
  // Establecer límite de tiempo (opcional)
  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      detenerGrabacion();
    }
  }, 60000); // 60 segundos máximo
}

function iniciarContador() {
  tiempoTranscurrido = 0;
  contadorInterval = setInterval(() => {
    tiempoTranscurrido++;
    
    const minutos = Math.floor(tiempoTranscurrido / 60);
    const segundos = tiempoTranscurrido % 60;
    
    contador.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }, 1000);
}

function pausarReanudarGrabacion() {
  if (!mediaRecorder) return;
  
  if (mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    btnPausa.textContent = "Reanudar";
    clearInterval(contadorInterval);
    estadoPausa = true;
  } else if (mediaRecorder.state === "paused") {
    mediaRecorder.resume();
    btnPausa.textContent = "Pausar";
    iniciarContador();
    estadoPausa = false;
  }
}

function detenerGrabacion() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    clearInterval(contadorInterval);
    detenerStream();
  }
}

function mostrarPreview() {
  // Ocultar la captura y controles
  if (tipoMedioActual === "video") {
    pantallaCaptura.style.display = "none";
  }
  grabacionControls.style.display = "none";
  
  // Mostrar el contenedor de previsualización
  previewContainer.style.display = "block";
  
  // Configurar el preview según el tipo de medio
  if (tipoMedioActual === "audio") {
    audioPreview.style.display = "block";
    videoPreview.style.display = "none";
    audioPreview.src = URL.createObjectURL(mediaBlob);
  } else if (tipoMedioActual === "video") {
    audioPreview.style.display = "none";
    videoPreview.style.display = "block";
    videoPreview.src = URL.createObjectURL(mediaBlob);
  }
}

// --- FINALIZACIÓN Y GUARDADO ---
function guardarMedia() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (tipoMedioActual === "audio") {
    const filename = `mensaje-audio-${timestamp}.webm`;
    guardarArchivoLocal(mediaBlob, filename);
  } 
  else if (tipoMedioActual === "video") {
    const filename = `mensaje-video-${timestamp}.webm`;
    guardarArchivoLocal(mediaBlob, filename);
  }
}

function finalizarEdicion() {
  if (tipoMedioActual === "foto" && fabricCanvas) {
    const imageData = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
    });
    
    // Convertir base64 a blob para guardar
    const byteString = atob(imageData.split(',')[1]);
    const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], {type: mimeString});
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `foto-${timestamp}.png`;
    
    // Guardar localmente
    guardarArchivoLocal(blob, filename);
    
    // Mostrar opción para publicar en WordPress
    mostrarOpcionWordPress(imageData);
  }
}

// Función para guardar archivos localmente
function guardarArchivoLocal(blob, filename) {
  // Crear un enlace de descarga
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  
  // Guardar en la carpeta de descargas del navegador
  document.body.appendChild(a);
  a.click();
  
  // Limpiar
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    alert(`Archivo guardado como ${filename}`);
    reiniciar();
  }, 100);
}

// Función para mostrar opción de publicar en WordPress
function mostrarOpcionWordPress(imageData) {
  // Crear un modal o diálogo
  const wordpressModal = document.createElement('div');
  wordpressModal.id = 'wordpress-modal';
  wordpressModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    z-index: 1000;
    max-width: 500px;
    width: 90%;
  `;
  
  wordpressModal.innerHTML = `
    <h3>¿Quieres publicar esta foto en WordPress?</h3>
    <div style="margin: 20px 0;">
      <button id="btn-publicar-wp" style="background-color: #0073aa;">Publicar en WordPress</button>
      <button id="btn-cerrar-wp" style="background-color: #666;">No publicar</button>
    </div>
  `;
  
  document.body.appendChild(wordpressModal);
  
  // Evento para cerrar sin publicar
  document.getElementById('btn-cerrar-wp').addEventListener('click', () => {
    document.body.removeChild(wordpressModal);
  });
  
  // Evento para publicar en WordPress
  document.getElementById('btn-publicar-wp').addEventListener('click', () => {
    publicarEnWordPress(imageData);
    document.body.removeChild(wordpressModal);
  });
}

// Función para publicar en WordPress
function publicarEnWordPress(imageData) {
  // Mostrar diálogo de configuración
  const configModal = document.createElement('div');
  configModal.id = 'config-modal';
  configModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    z-index: 1000;
    max-width: 500px;
    width: 90%;
  `;
  
  configModal.innerHTML = `
    <h3>Configuración de WordPress</h3>
    <form id="wordpress-form">
      <div style="margin: 10px 0;">
        <label for="wp-url">URL del sitio WordPress:</label>
        <input type="url" id="wp-url" required style="width: 100%; padding: 8px; margin-top: 5px;" 
               placeholder="https://tusitio.com" value="${localStorage.getItem('wp-url') || ''}">
      </div>
      <div style="margin: 10px 0;">
        <label for="wp-user">Usuario:</label>
        <input type="text" id="wp-user" required style="width: 100%; padding: 8px; margin-top: 5px;" 
               placeholder="usuario" value="${localStorage.getItem('wp-user') || ''}">
      </div>
      <div style="margin: 10px 0;">
        <label for="wp-app-password">Contraseña de aplicación:</label>
        <input type="password" id="wp-app-password" required 
               style="width: 100%; padding: 8px; margin-top: 5px;" placeholder="xxxx xxxx xxxx xxxx">
      </div>
      <div style="margin: 10px 0;">
        <label for="wp-title">Título de la publicación:</label>
        <input type="text" id="wp-title" required style="width: 100%; padding: 8px; margin-top: 5px;" 
               placeholder="Foto de cumpleaños" value="Foto de Photobooth - ${new Date().toLocaleDateString()}">
      </div>
      <div style="margin: 20px 0;">
        <button type="submit" style="background-color: #0073aa;">Publicar</button>
        <button type="button" id="btn-cancelar-wp" style="background-color: #666;">Cancelar</button>
      </div>
    </form>
  `;
  
  document.body.appendChild(configModal);
  
  // Evento para cancelar
  document.getElementById('btn-cancelar-wp').addEventListener('click', () => {
    document.body.removeChild(configModal);
  });
  
  // Evento para enviar formulario
  document.getElementById('wordpress-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Obtener valores del formulario
    const wpUrl = document.getElementById('wp-url').value;
    const wpUser = document.getElementById('wp-user').value;
    const wpAppPassword = document.getElementById('wp-app-password').value;
    const wpTitle = document.getElementById('wp-title').value;
    
    // Guardar para usos futuros (excepto contraseña)
    localStorage.setItem('wp-url', wpUrl);
    localStorage.setItem('wp-user', wpUser);
    
    // Mostrar indicador de carga
    configModal.innerHTML = '<h3>Publicando...</h3><p>Esto puede tardar unos segundos.</p>';
    
    // Llamar a la API REST de WordPress
    enviarAWordPress(wpUrl, wpUser, wpAppPassword, wpTitle, imageData)
      .then(response => {
        console.log("Publicación exitosa:", response);
        document.body.removeChild(configModal);
        alert("¡Foto publicada exitosamente en WordPress!");
      })
      .catch(error => {
        console.error("Error al publicar:", error);
        alert("Error al publicar en WordPress: " + error.message);
        document.body.removeChild(configModal);
      });
  });
}

// Función para enviar a WordPress usando la API REST
async function enviarAWordPress(wpUrl, wpUser, wpAppPassword, wpTitle, imageData) {
  try {
    // 1. Primero subir la imagen
    const mediaResponse = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${wpUser}:${wpAppPassword}`),
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename=photobooth-image.png'
      },
      body: dataURItoBlob(imageData)
    });
    
    if (!mediaResponse.ok) {
      throw new Error(`Error al subir imagen: ${mediaResponse.status}`);
    }
    
    const mediaData = await mediaResponse.json();
    const mediaId = mediaData.id;
    
    // 2. Luego crear la publicación con la imagen
    const postResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${wpUser}:${wpAppPassword}`),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: wpTitle,
        content: `<!-- wp:image {"id":${mediaId}} -->
<figure class="wp-block-image"><img src="${mediaData.source_url}" alt="Foto de Photobooth" class="wp-image-${mediaId}"/></figure>
<!-- /wp:image -->`,
        status: 'publish',
        featured_media: mediaId
      })
    });
    
    if (!postResponse.ok) {
      throw new Error(`Error al crear publicación: ${postResponse.status}`);
    }
    
    return await postResponse.json();
  } catch (error) {
    console.error("Error en enviarAWordPress:", error);
    throw error;
  }
}

// Utilidad para convertir dataURI a Blob
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], {type: mimeString});
}

function borrarMediaYReiniciar() {
  reiniciar();
}

function detenerStream() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

function reiniciar() {
  // Limpiar variables
  if (fabricCanvas) {
    fabricCanvas.dispose();
  }
  
  // Limpiar previews
  audioPreview.src = "";
  videoPreview.src = "";
  
  // Resetear tiempo y contador
  clearInterval(contadorInterval);
  tiempoTranscurrido = 0;
  contador.textContent = "";
  
  // Mostrar pantalla inicial
  mostrarPantalla(pantallaInicial);
}