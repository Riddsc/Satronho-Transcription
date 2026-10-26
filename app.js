// Referencias al DOM
const btnLoad = document.getElementById('btn-load');
const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const statusIndicator = document.getElementById('status-indicator');
const transcriptBox = document.getElementById('transcript-box');

let mediaRecorder;
let audioChunks = [];

// 1. Inicializamos el Web Worker (El cerebro IA en otro hilo)
const worker = new Worker('worker.js', { type: 'module' });

// 2. Escuchamos los mensajes que nos manda el Worker
worker.addEventListener('message', (event) => {
    const data = event.data;

    if (data.status === 'loading') {
        statusIndicator.textContent = "⏳ Descargando modelo IA (Esto toma un rato la primera vez)...";
    } 
    else if (data.status === 'ready') {
        statusIndicator.textContent = "🟢 IA Lista para escuchar";
        btnLoad.style.display = 'none';
        btnRecord.disabled = false;
    } 
    else if (data.status === 'processing') {
        statusIndicator.textContent = "⚙️ Procesando audio...";
    } 
    else if (data.status === 'done') {
        statusIndicator.textContent = "✅ Transcripción completada";
        transcriptBox.textContent = data.text; // Mostramos el resultado
        btnRecord.disabled = false;
    }
    else if (data.status === 'error') {
        statusIndicator.textContent = `❌ Error: ${data.message}`;
        btnRecord.disabled = false;
    }
});

// 3. Botón para cargar el modelo
btnLoad.addEventListener('click', () => {
    btnLoad.disabled = true;
    worker.postMessage({ type: 'load' });
});

// 4. Configurar el micrófono
async function setupMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            btnRecord.disabled = true;
            // Unimos los pedazos de audio grabados
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = []; // Limpiamos para la próxima vez
            
            // Magia: Convertimos el audio al formato matemático que pide Whisper (16kHz)
            await prepareAudioForAI(audioBlob);
        };
    } catch (error) {
        statusIndicator.textContent = "❌ Error: Necesitas dar permisos de micrófono.";
        console.error(error);
    }
}

// 5. Traductor de Audio Web a Audio para IA
async function prepareAudioForAI(blob) {
    try {
        statusIndicator.textContent = "🔄 Convirtiendo formato de audio...";
        
        const arrayBuffer = await blob.arrayBuffer();
        // Usamos AudioContext nativo para forzar la frecuencia a 16000 Hz
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Extraemos el canal de audio en formato Float32Array
        const audioData = audioBuffer.getChannelData(0);
        
        // Enviamos la matriz matemática al Worker
        worker.postMessage({ type: 'transcribe', audio: audioData });
    } catch (error) {
        console.error("Error procesando audio:", error);
        statusIndicator.textContent = "❌ Error al procesar el audio internamente.";
        btnRecord.disabled = false;
    }
}

// 6. Botones de Grabación
btnRecord.addEventListener('click', () => {
    if (!mediaRecorder) {
        setupMicrophone().then(() => {
            mediaRecorder.start();
            btnRecord.disabled = true;
            btnStop.disabled = false;
            statusIndicator.textContent = "🎙️ Grabando... Habla ahora.";
        });
    } else {
        mediaRecorder.start();
        btnRecord.disabled = true;
        btnStop.disabled = false;
        statusIndicator.textContent = "🎙️ Grabando... Habla ahora.";
    }
});

btnStop.addEventListener('click', () => {
    mediaRecorder.stop();
    btnStop.disabled = true;
});