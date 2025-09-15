const webhookURL = 'https://discord.com/api/webhooks/1416876487428149258/d3kFGL8F8gbPreEsv4Kcq7ECuqrkumr6r5vV5W5drudOSUgWaSDXjTQ16XBX78etSgeA';

/* WEBHOOK */
document.getElementById('sendMsg').addEventListener('click', () => {
    const sendBtn = document.getElementById('sendMsg');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Espera 30s...';

    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `shinga tu mais`,
            username: 'la momoneta',
            avatar_url: 'https://cdn.discordapp.com/attachments/1408999982564114472/1416996283268333689/La_Momoneta.jpg?ex=68c8e020&is=68c78ea0&hm=432a13157134d7b4bfaca0ad8239e4cd6697d937043c0969485af5c9ae629eaa&'
        })
    })
    .finally(() => {
        setTimeout(() => {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Enviar mensaje al Servidor.';    
        }, 30000);
    });
}); 