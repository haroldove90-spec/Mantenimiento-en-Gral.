/**
 * WhatsApp integration & credential sharing utilities for SIJ Mantenimiento & Servicios
 */

export function cleanWhatsAppPhone(phoneStr?: string): string {
  if (!phoneStr) return '';
  // Remove all non-digits
  let digits = phoneStr.replace(/\D/g, '');

  // If empty, return empty
  if (!digits) return '';

  // If 10 digits (Standard Mexican phone number), prepend Mexican country code '52'
  if (digits.length === 10) {
    digits = `52${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = `52${digits.slice(1)}`;
  } else if (digits.length === 12 && digits.startsWith('52') && !digits.startsWith('521')) {
    // Standard format
    digits = digits;
  }

  return digits;
}

export function getBaseAppUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // In production on Vercel or custom domain
    if (origin.includes('vercel.app') || origin.includes('sij') || origin.includes('mantenimiento')) {
      return origin;
    }
    // If running in development/preview but user uses maintenance domain
    return 'https://mantenimiento-en-gral.vercel.app';
  }
  return 'https://mantenimiento-en-gral.vercel.app';
}

export function getClientPortalUrl(folio?: string, email?: string): string {
  const base = getBaseAppUrl();
  const url = new URL('/clientes', base);
  if (folio) {
    url.searchParams.set('folio', folio);
  }
  if (email) {
    url.searchParams.set('user', email);
  }
  return url.toString();
}

export function getTechPortalUrl(email?: string): string {
  const base = getBaseAppUrl();
  const url = new URL('/tecnicos', base);
  if (email) {
    url.searchParams.set('user', email);
  }
  return url.toString();
}

export function buildClientCredentialsWhatsAppMessage(params: {
  clientName: string;
  email?: string;
  password?: string;
  phone?: string;
  folio?: string;
}): string {
  const portalUrl = getClientPortalUrl(params.folio, params.email);
  const name = params.clientName || 'Estimado Cliente';
  const user = params.email || params.phone || 'Tu número de teléfono';
  const pass = params.password || '1234 (o tu contraseña habitual)';

  let msg = `🛠️ *MANTENIMIENTO Y SERVICIOS SIJ*\n`;
  msg += `─────────────────────────\n`;
  msg += `¡Hola *${name}*! Te damos la más cordial bienvenida a nuestra plataforma de servicio técnico y atención especializada.\n\n`;
  msg += `📲 *TUS CREDENCIALES DE ACCESO:*\n`;
  msg += `👤 *Usuario / Correo:* ${user}\n`;
  msg += `🔑 *Contraseña:* ${pass}\n\n`;
  msg += `🔗 *LINK DE ACCESO DIRECTO AL PORTAL:*\n`;
  msg += `${portalUrl}\n\n`;
  
  if (params.folio) {
    msg += `📋 *Folio de tu Orden:* ${params.folio}\n\n`;
  }

  msg += `Desde este link podrás:\n`;
  msg += `✅ Consultar el estado de tus órdenes en tiempo real\n`;
  msg += `✅ Revisar y autorizar cotizaciones al instante\n`;
  msg += `✅ Ver evidencia fotográfica de diagnósticos\n`;
  msg += `✅ Validar pólizas y periodos de garantía\n\n`;
  msg += `Quedamos a tus órdenes para cualquier duda o consulta. ¡Gracias por tu preferencia! 🤝✨`;

  return msg;
}

export function buildTechCredentialsWhatsAppMessage(params: {
  techName: string;
  username?: string;
  email?: string;
  password?: string;
  phone?: string;
  specialty?: string;
}): string {
  const techUrl = getTechPortalUrl(params.email);
  const name = params.techName || 'Técnico de Campo';
  const user = params.username ? `@${params.username}` : params.email || params.phone || 'Tu correo';
  const pass = params.password || 'Temp1234!';
  const specialty = params.specialty || 'Técnico de Campo';

  let msg = `🔧 *MANTENIMIENTO Y SERVICIOS SIJ - MÓDULO TÉCNICO*\n`;
  msg += `─────────────────────────\n`;
  msg += `¡Hola *${name}*! Se ha generado tu cuenta de acceso operativo para el equipo de *${specialty}*.\n\n`;
  msg += `📱 *DATOS DE ACCESO A TU PLATAFORMA:*\n`;
  msg += `👤 *Usuario:* ${user}\n`;
  if (params.email) msg += `📧 *Correo:* ${params.email}\n`;
  msg += `🔑 *Contraseña:* ${pass}\n\n`;
  msg += `🔗 *LINK DIRECTO DE APLICACIÓN MÓVIL:*\n`;
  msg += `${techUrl}\n\n`;
  msg += `📌 *FUNCIONES DISPONIBLES:*\n`;
  msg += `• Agenda de visitas y ruta diaria asignada\n`;
  msg += `• Captura de diagnósticos y fotos de evidencia\n`;
  msg += `• Solicitud de refacciones a bodega\n`;
  msg += `• Firma digital del cliente y cobros en sitio\n\n`;
  msg += `*Recomendación:* Guarda este enlace en tu pantalla de inicio como acceso rápido. ¡Éxito en tus servicios de hoy! 🚀`;

  return msg;
}

export function buildOrderTrackingWhatsAppMessage(params: {
  clientName: string;
  folio: string;
  equipmentType?: string;
  status: string;
  scheduledDate?: string;
  technicianName?: string;
}): string {
  const portalUrl = getClientPortalUrl(params.folio);
  let msg = `📋 *ESTATUS DE ORDEN DE SERVICIO SIJ*\n`;
  msg += `─────────────────────────\n`;
  msg += `Estimado(a) *${params.clientName}*, le informamos sobre el avance de su servicio técnico:\n\n`;
  msg += `🏷️ *Folio de Servicio:* ${params.folio}\n`;
  if (params.equipmentType) msg += `⚙️ *Equipo:* ${params.equipmentType}\n`;
  msg += `📊 *Estatus Actual:* ${params.status}\n`;
  if (params.scheduledDate) msg += `📅 *Fecha Programada:* ${params.scheduledDate}\n`;
  if (params.technicianName) msg += `👨‍🔧 *Técnico Asignado:* ${params.technicianName}\n`;
  msg += `\n🔗 *CONSULTA DETALLES Y FOTOS EN VIVO:*\n`;
  msg += `${portalUrl}\n\n`;
  msg += `Estamos trabajando para brindarle el mejor servicio. Mantenimiento y Servicios SIJ.`;

  return msg;
}

export function openWhatsAppWebOrApp(phone: string, message: string): void {
  const cleanPhone = cleanWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  
  let url = '';
  if (cleanPhone) {
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  } else {
    // If no phone provided, opens WhatsApp share dialog where user selects contact
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  // Open in new tab/window
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
