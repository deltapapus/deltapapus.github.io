<script>
  const API_BASE = "https://temmie-bot.agmpatatamail.repl.co"; // tu URL de Replit

  document.querySelectorAll(".staff-card").forEach(async card => {
    // Extrae la URL actual para sacar el Discord ID del staff
    // Asumimos que el Discord ID ya está en la src de la img actual
    const imgEl = card.querySelector(".staff-avatar");
    if (!imgEl) return;

    // Extraemos el ID de Discord de la URL actual
    const match = imgEl.src.match(/avatars\/(\d+)\//);
    if (!match) return;
    const discordId = match[1];

    try {
      const res = await fetch(`${API_BASE}/avatar/${discordId}`);
      const data = await res.json();
      // Actualizamos solo la foto
      imgEl.src = data.avatar_url;
    } catch (err) {
      console.error("No se pudo actualizar avatar:", err);
    }
  });
</script>
