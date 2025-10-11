const webhookURL = 'https://discord.com/api/webhooks/1416876487428149258/d3kFGL8F8gbPreEsv4Kcq7ECuqrkumr6r5vV5W5drudOSUgWaSDXjTQ16XBX78etSgeA';

const sendBtn = document.getElementById('sendMsg');
const TIMEOUT = 30000; // 30 segundos

// Función para actualizar el botón con el tiempo restante
function updateButton() {
    const startTime = localStorage.getItem('timeoutStart');
    if (!startTime) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Enviar mensaje al Servidor.';
        return;
    }
    
    const elapsed = Date.now() - startTime;
    const remaining = TIMEOUT - elapsed;

    if (remaining > 0) {
        sendBtn.disabled = true;
        sendBtn.textContent = `Espera ${Math.ceil(remaining / 1000)}s...`;
        setTimeout(updateButton, 1000);
    } else {
        // Timeout terminado, limpiar localStorage y resetear botón
        localStorage.removeItem('timeoutStart');
        sendBtn.disabled = false;
        sendBtn.textContent = 'Enviar mensaje al Servidor.';
    }
}

// Al cargar la página actualizamos el estado del botón
updateButton();

sendBtn.addEventListener('click', () => {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Espera 30s...';

    // Guardar el momento de inicio en localStorage
    localStorage.setItem('timeoutStart', Date.now());

    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `el primero que comente en: https://x.com/imtassingg/status/1976656851141099764 se lleva 100 dólares.`,
            username: 'anuncio de imtassingg-twitter',
            avatar_url: 'https://cdn.discordapp.com/attachments/1408999982564114472/1416996283268333689/La_Momoneta.jpg?ex=68c8e020&is=68c78ea0&hm=432a13157134d7b4bfaca0ad8239e4cd6697d937043c0969485af5c9ae629eaa&'
        })
    });

    // Empezamos la actualización del botón para mostrar el timer
    updateButton();
});
