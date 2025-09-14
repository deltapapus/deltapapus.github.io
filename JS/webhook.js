const webhookURL = 'https://discord.com/api/webhooks/1416448432662642698/r5pkc6VcPbAkD4KfyjKsIEYLm4rKE1iH8v4KlWT8Q4zoWiRvxKrvUPRuhRPxMZCEmXPv';

/* WEBHOOK */
document.getElementById('sendMsg').addEventListener('click', () => {
    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `mensaje random`,
            username: 'DELTAPAPUS Web (Anonimo) [WEBHOOK]',
            avatar_url: 'https://cdn.discordapp.com/icons/1408971645569335420/a_ac331567216651740e961cb9efb7a2e5.gif?size=2048'
        })
    })
});