document.addEventListener("DOMContentLoaded", () => {
  const telefono = "573001234567"; // Reemplazar por el numero real.
  const mensajeBase = "Hola, quiero agendar una cita en FH Dermatologia.";
  const enlace = `https://wa.me/${telefono}?text=${encodeURIComponent(mensajeBase)}`;

  const boton = document.createElement("a");
  boton.href = enlace;
  boton.target = "_blank";
  boton.rel = "noopener noreferrer";
  boton.className = "whatsapp-float";
  boton.setAttribute("aria-label", "Escribir por WhatsApp");
  boton.textContent = "WhatsApp";

  document.body.appendChild(boton);
});
