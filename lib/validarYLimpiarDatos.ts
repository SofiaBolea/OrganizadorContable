// --- UTILIDADES DE VALIDACIÓN Y LIMPIEZA ---
export function validarYLimpiarDatos(data: any) {
  const errores: string[] = [];
  const nombreLimpio = data.nombreCompleto?.trim() || "";
  const cuitLimpio = data.cuit?.replace(/\D/g, "") || null;
  const emailLimpio = data.email?.trim().toLowerCase() || null;
  const telefonoLimpio = data.telefono?.trim() || null;

  if (nombreLimpio.length === 0) {
    errores.push("El nombre completo es obligatorio.");
  } else if (nombreLimpio.length > 255) {
    errores.push("El nombre no puede superar los 255 caracteres.");
  }
  if (cuitLimpio && cuitLimpio.length !== 11) {
    errores.push("El CUIT debe tener exactamente 11 dígitos numéricos.");
  }
  if (emailLimpio) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLimpio)) {
      errores.push("El formato del correo electrónico es inválido.");
    }
  }
  return {
    esValido: errores.length === 0,
    errorMsg: errores.join(" "),
    datos: {
      nombreCompleto: nombreLimpio,
      cuit: cuitLimpio,
      email: emailLimpio,
      telefono: telefonoLimpio,
      asistentesIds: data.asistentesIds,
      organizacionId: data.organizacionId
    }
  };
}