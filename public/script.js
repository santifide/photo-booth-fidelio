// --- ELEMENTOS ---
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

let stream;
let fabricCanvas;

// --- COMIENZO ---
btnComenzar.addEventListener("click", () => {
  pantallaInicial.style.display = "none";
  pantallaCuenta.style.display = "block";
  iniciarCuentaRegresiva(5);
});

// --- CUENTA REGRESIVA ---
function iniciarCuentaRegresiva(segundos) {
  cuenta.textContent = segundos;
  let tiempo = segundos;
  const intervalo = setInterval(() => {
    tiempo--;
    cuenta.textContent = tiempo;
    if (tiempo <= 0) {
      clearInterval(intervalo);
      pantallaCuenta.style.display = "none";
      iniciarCamaraYCapturar();
    }
  }, 1000);
}

// --- CAPTURA ---
function iniciarCamaraYCapturar() {
  pantallaCaptura.style.display = "block";

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Tu navegador no soporta acceso a la cámara.");
    return;
  }

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
      video.onloadedmetadata = () => {
        video.play();
        // Esperar a que el video esté listo
        setTimeout(() => {
          capturarFoto();
        }, 1500);
      };
    })
    .catch((err) => {
      alert("Error accediendo a la cámara");
      console.error("Error de cámara:", err);
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
  stream.getTracks().forEach((track) => track.stop());

  // Modo edición
  pantallaCaptura.style.display = "none";
  pantallaEdicion.style.display = "block";

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

// --- FINALIZAR Y GUARDAR ---
btnFinalizar.addEventListener("click", () => {
  const imageData = fabricCanvas.toDataURL({
    format: "png",
    quality: 1,
  });

  fetch("/save-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert("Foto guardada como " + data.filename);
      reiniciar();
    })
    .catch((err) => {
      alert("Error al guardar la foto");
      console.error("Error al guardar:", err);
      reiniciar();
    });
});

function reiniciar() {
  pantallaEdicion.style.display = "none";
  fabricCanvas.dispose();
  pantallaInicial.style.display = "block";
}

// --- MENSAJE ---
const mensaje = document.createElement("h2");
mensaje.textContent = "Ahora podés escribir algo con el dedo";
pantallaEdicion.insertBefore(mensaje, btnFinalizar);

// --- CHECKBOX MODULOS ---
function toggleModulo(checkboxId, botonId) {
  const chk = document.getElementById(checkboxId);
  const btn = document.getElementById(botonId);
  chk.addEventListener("change", () => {
    btn.style.display = chk.checked ? "inline-block" : "none";
  });
  btn.style.display = chk.checked ? "inline-block" : "none";
}

toggleModulo("chk-foto", "btn-foto");
toggleModulo("chk-audio", "btn-audio");
toggleModulo("chk-video", "btn-video");
