// Importamos Transformers.js desde la red (CDN)
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Permitimos descargar modelos externos
env.allowLocalModels = false;

let transcriber = null;

// Escuchamos las órdenes que nos manda app.js
self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'load') {
        try {
            self.postMessage({ status: 'loading' });
            
            // Descargamos el modelo whisper-tiny. 
            // Esto almacena el modelo en la memoria caché del navegador automáticamente.
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
            
            self.postMessage({ status: 'ready' });
        } catch (error) {
            self.postMessage({ status: 'error', message: error.message });
        }
    } 
    
    else if (type === 'transcribe') {
        try {
            self.postMessage({ status: 'processing' });
            
            // Ejecutamos la IA sobre los datos matemáticos de audio
            const result = await transcriber(audio, {
                chunk_length_s: 30, // Procesa en bloques de 30 segundos
                stride_length_s: 5,
                language: 'spanish', // Por defecto forzamos español para mayor precisión, pero el modelo sabe inglés
                task: 'transcribe'
            });

            self.postMessage({ status: 'done', text: result.text });
        } catch (error) {
            self.postMessage({ status: 'error', message: error.message });
        }
    }
});