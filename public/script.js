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
const mensaje = document.createElement("h2");

let stream;
let fabricCanvas;

btnComenzar.addEventListener("click", () => {
  pantallaInicial.style.display = "none";
  pantallaCuenta.style.display = "block";
  iniciarCuentaRegresiva(5);
});

function iniciarCuentaRegresiva(segundos) {
  cuenta.textContent = segundos;
  let tiempo = segundos;

  const intervalo = setInterval(() => {
    tiempo--;
    cuenta.textContent = tiempo;
    if (tiempo === 0) {
      clearInterval(intervalo);
      pantallaCuenta.style.display = "none";
      mostrarCamaraYCapturar();
    }
  }, 1000);
}

function mostrarCamaraYCapturar() {
  pantallaCaptura.style.display = "block";
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = stream;

      // Espera un momento y toma la foto
      setTimeout(() => {
        capturarFoto();
      }, 1500);
    })
    .catch((err) => {
      alert("Error accediendo a la cámara");
      console.error(err);
    });
}

function capturarFoto() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/png");

  // Detener cámara
  stream.getTracks().forEach((track) => track.stop());

  // Pasar a edición
  pantallaCaptura.style.display = "none";
  pantallaEdicion.style.display = "block";

  // Mostrar imagen en fabric.js
  fabricCanvas = new fabric.Canvas("canvas-edicion", {
    isDrawingMode: true,
  });

  fabricCanvas.freeDrawingBrush.color = inputColorLapiz.value;
  fabricCanvas.freeDrawingBrush.width = parseInt(inputGrosorLapiz.value);

  // Si el usuario cambia los valores
  inputColorLapiz.addEventListener("change", () => {
    fabricCanvas.freeDrawingBrush.color = inputColorLapiz.value;
  });
  inputGrosorLapiz.addEventListener("change", () => {
    fabricCanvas.freeDrawingBrush.width = parseInt(inputGrosorLapiz.value);
  });

  fabric.Image.fromURL(dataUrl, function (img) {
    fabricCanvas.setWidth(img.width);
    fabricCanvas.setHeight(img.height);
    fabricCanvas.setBackgroundImage(
      img,
      fabricCanvas.renderAll.bind(fabricCanvas)
    );
  });
}

btnFinalizar.addEventListener("click", () => {
  const imageData = fabricCanvas.toDataURL({
    format: "png",
    quality: 1,
  });

  fetch("/save-photo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageData }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert("Foto guardada como " + data.filename);
      reiniciar();
    })
    .catch((err) => {
      alert("Error al guardar la foto");
      console.error(err);
      reiniciar();
    });
});

function reiniciar() {
  pantallaEdicion.style.display = "none";
  fabricCanvas.dispose();
  pantallaInicial.style.display = "block";
}

mensaje.textContent = "ahora podés escribir algo con el dedo";
pantallaEdicion.insertBefore(mensaje, btnFinalizar);
