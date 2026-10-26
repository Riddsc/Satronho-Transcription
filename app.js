const btnRecord = document.getElementById('btn-record');
const btnStop = document.getElementById('btn-stop');
const btnClear = document.getElementById('btn-clear');
const languageSelect = document.getElementById('language-select');
const statusIndicator = document.getElementById('status-indicator');
const finalTextEl = document.getElementById('final-text');
const interimTextEl = document.getElementById('interim-text');

// Verificamos si el navegador soporta la API nativa
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    statusIndicator.textContent = "❌ Error: Tu navegador no soporta el motor nativo de transcripción.";
    btnRecord.disabled = true;
} else {
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Permite escuchar de forma continua
    recognition.interimResults = true; // Muestra resultados mientras hablas

    let finalTranscript = '';
    let isUserStopped = true; // Variable de control para auto-reconectar

    // Configuración inicial del idioma
    recognition.lang = languageSelect.value;

    // Cambiar idioma dinámicamente
    languageSelect.addEventListener('change', (e) => {
        recognition.lang = e.target.value;
        if (!isUserStopped) {
            // Si está grabando, reiniciamos el motor para aplicar el nuevo idioma
            recognition.stop(); 
        }
    });

    recognition.onstart = () => {
        statusIndicator.textContent = `🟢 Escuchando con precisión en ${recognition.lang === 'es-ES' ? 'Español' : 'Inglés'}...`;
        btnRecord.disabled = true;
        btnStop.disabled = false;
        languageSelect.disabled = true; // Bloqueamos cambio de idioma mientras graba
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            // Si la frase terminó, la pasamos al texto final
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                // Si aún se está procesando, la mostramos temporalmente
                interimTranscript += transcript;
            }
        }

        finalTextEl.textContent = finalTranscript;
        interimTextEl.textContent = interimTranscript;
    };

    // MAGIA ARQUITECTÓNICA: Auto-reconexión si hay silencio largo
    recognition.onend = () => {
        if (!isUserStopped) {
            // Si el usuario no pulsó "Detener", el sistema se pausó por silencio. Lo reactivamos.
            console.log("Reiniciando motor por silencio...");
            recognition.start();
        } else {
            statusIndicator.textContent = "🔴 Inactivo";
            btnRecord.disabled = false;
            btnStop.disabled = true;
            languageSelect.disabled = false;
            interimTextEl.textContent = ''; // Limpiamos el texto temporal
        }
    };

    recognition.onerror = (event) => {
        console.error("Error del motor:", event.error);
        if (event.error === 'not-allowed') {
            statusIndicator.textContent = "❌ Error: Permisos de micrófono denegados.";
            isUserStopped = true;
        }
    };

    // Controles de usuario
    btnRecord.addEventListener('click', () => {
        isUserStopped = false;
        try {
            recognition.start();
        } catch (e) {
            console.log("El motor ya estaba intentando iniciar.");
        }
    });

    btnStop.addEventListener('click', () => {
        isUserStopped = true;
        recognition.stop();
    });

    btnClear.addEventListener('click', () => {
        finalTranscript = '';
        finalTextEl.textContent = '';
        interimTextEl.textContent = '';
    });
}
