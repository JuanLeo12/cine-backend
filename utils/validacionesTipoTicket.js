// ✅ Tipos de ticket permitidos
const TIPOS_VALIDOS = ["Niño", "Adulto", "Adulto Mayor", "Conadis"];

// ✅ Normaliza el texto recibido: quita espacios y convierte a minúsculas
function normalizarTexto(texto) {
  return texto.trim().toLowerCase();
}

// ✅ Convierte el texto a formato capitalizado oficial
function capitalizar(nombreNormalizado) {
  const mapping = {
    "niño": "Niño",
    "adulto": "Adulto",
    "adulto mayor": "Adulto Mayor",
    "conadis": "Conadis",
  };
  return mapping[nombreNormalizado] || nombreNormalizado;
}

// 📌 Valida que el tipo de ticket esté permitido
function validarTipoTicket({ nombre }) {
  const errores = [];

  if (!nombre || typeof nombre !== "string") {
    errores.push("El nombre es obligatorio y debe ser un texto válido");
    return { errores, nombreNormalizado: null };
  }

  const nombreNormalizado = capitalizar(normalizarTexto(nombre));

  if (!TIPOS_VALIDOS.includes(nombreNormalizado)) {
    errores.push(
      `Tipo de ticket inválido. Solo se permiten: ${TIPOS_VALIDOS.join(", ")}`
    );
  }

  return { errores, nombreNormalizado };
}

module.exports = { validarTipoTicket, TIPOS_VALIDOS };
