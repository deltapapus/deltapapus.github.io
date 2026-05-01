// Webhook handler para mensajes anónimos
const sendMsgBtn = document.getElementById('sendMsg');
const anonMessage = document.getElementById('anonMessage');
const webhookMessage = document.getElementById('webhookMessage');

if (sendMsgBtn) {
  sendMsgBtn.addEventListener('click', async () => {
    const message = anonMessage.value.trim();

    if (!message) {
      showMessage('Por favor escribe un mensaje.', 'error');
      return;
    }

    if (message.length > 500) {
      showMessage('El mensaje es muy largo (máximo 500 caracteres).', 'error');
      return;
    }

    // Reemplaza con tu webhook URL de Discord
    const webhookUrl = 'https://discord.com/api/webhooks/1494238441225846804/lRTXmmoPa9FMGtc8OpD6Bak_PxdLygkXkK2VS56-JRsEz7wYE5JYtUNYGvqVRWat-6SF
      ';

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `📨 **Mensaje Anónimo**\n\n${message}\n\n_Enviado desde la página web_`
        })
      });

      if (response.ok) {
        showMessage('✅ Mensaje enviado correctamente. ¡Gracias!', 'success');
        anonMessage.value = '';
        document.getElementById('charCount').textContent = '0';
      } else {
        showMessage('❌ Error al enviar el mensaje. Intenta más tarde.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('❌ Error de conexión. Intenta más tarde.', 'error');
    }
  });
}

function showMessage(message, type) {
  if (!webhookMessage) return;

  webhookMessage.textContent = message;
  webhookMessage.className = `webhook-feedback ${type}`;

  // Limpiar mensaje después de 5 segundos
  setTimeout(() => {
    webhookMessage.className = 'webhook-feedback';
  }, 5000);
}
