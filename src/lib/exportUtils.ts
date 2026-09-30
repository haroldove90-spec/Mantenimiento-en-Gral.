/**
 * Utilities for exporting data to Excel (CSV/XLS with UTF-8 BOM) and PDF (Professional formatted printable window).
 * Supports bulk export (All or Selected), single record exports, and official Notas de Venta (Sales Notes).
 */

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Converts a numeric monetary amount into Spanish words for Mexican Pesos.
 * Example: 1850.50 => "UN MIL OCHOCIENTOS CINCUENTA PESOS 50/100 M.N."
 */
export const numberToSpanishPesos = (amount: number): string => {
  const safeAmount = Math.max(0, isNaN(amount) ? 0 : amount);
  const integerPart = Math.floor(safeAmount);
  const cents = Math.round((safeAmount - integerPart) * 100);
  const centsStr = cents.toString().padStart(2, '0') + '/100 M.N.';

  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    let output = '';
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h > 0) output += hundreds[h] + ' ';
    if (r >= 10 && r <= 19) {
      output += teens[r - 10] + ' ';
    } else if (r >= 20 && r <= 29) {
      output += (r === 20 ? 'VEINTE' : 'VEINTI' + units[r - 20]) + ' ';
    } else {
      const t = Math.floor(r / 10);
      const u = r % 10;
      if (t > 0) output += tens[t] + (u > 0 ? ' Y ' : ' ');
      if (u > 0 && t !== 2) output += units[u] + ' ';
    }
    return output.trim();
  };

  if (integerPart === 0) return `CERO PESOS ${centsStr}`;

  let words = '';
  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (millions > 0) {
    words += (millions === 1 ? 'UN MILLÓN ' : `${convertGroup(millions)} MILLONES `);
  }
  if (thousands > 0) {
    words += (thousands === 1 ? 'UN MIL ' : `${convertGroup(thousands)} MIL `);
  }
  if (remainder > 0) {
    words += convertGroup(remainder) + ' ';
  }

  const pesoWord = integerPart === 1 ? 'PESO' : 'PESOS';
  return `${words.trim()} ${pesoWord} ${centsStr}`.trim();
};

/**
 * Universal printing helper that avoids popup blockers and works in sandboxed iframes.
 * Attempts window.open; if blocked or unavailable, falls back to a hidden iframe print.
 */
export const printHtmlContent = (htmlContent: string) => {
  let popupBlocked = false;
  let printWindow: Window | null = null;

  try {
    printWindow = window.open('', '_blank');
    if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
      popupBlocked = true;
    }
  } catch (e) {
    popupBlocked = true;
  }

  if (!popupBlocked && printWindow) {
    try {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      return;
    } catch (e) {
      popupBlocked = true;
    }
  }

  // Fallback: Invisible iframe printing (100% reliable inside iframes and sandboxes)
  try {
    let iframe = document.getElementById('sij-print-engine-frame') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'sij-print-engine-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1024px';
      iframe.style.height = '1024px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch (err) {
          console.error('Error executing print in iframe:', err);
        }
      }, 400);
    }
  } catch (err) {
    console.error('Print iframe creation error:', err);
  }
};

/**
 * Exports tabular data to a CSV/Excel file with UTF-8 BOM so Excel opens it with proper Spanish characters.
 */
export const exportToExcel = (
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  sheetTitle: string = 'Reporte SIJ'
) => {
  const sanitizeCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(sanitizeCell).join(',');
  const rowLines = rows.map(r => r.map(sanitizeCell).join(','));
  const csvContent = [headerLine, ...rowLines].join('\r\n');

  // \uFEFF is UTF-8 Byte Order Mark for Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const cleanFilename = filename.endsWith('.csv') || filename.endsWith('.xlsx') ? filename : `${filename}.csv`;
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Opens a formatted, printable window styled for PDF saving/printing with SIJ branding.
 */
export const exportToPDF = ({
  title,
  subtitle,
  headers,
  rows,
  summaryCards,
  metadata,
  orientation
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  summaryCards?: { label: string; value: string | number }[];
  metadata?: Record<string, string>;
  orientation?: 'portrait' | 'landscape';
}) => {
  const nowStr = new Date().toLocaleString('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  // Default to portrait for compact tables (<=5 columns), landscape for wider tables
  const resolvedOrientation = orientation || (headers.length > 5 ? 'landscape' : 'portrait');

  const metadataHtml = metadata
    ? Object.entries(metadata)
        .map(
          ([k, v]) => `
          <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px dashed #cbd5e1;">
            <strong style="color: #475569;">${k}:</strong>
            <span style="color: #0f172a; font-weight: 600;">${v}</span>
          </div>
        `
        )
        .join('')
    : '';

  const summaryHtml = summaryCards
    ? `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 14px 0;">
        ${summaryCards
          .map(
            card => `
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 14px;">
            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${card.label}</div>
            <div style="font-size: 17px; font-weight: 800; color: #0284c7; margin-top: 2px;">${card.value}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `
    : '';

  const tableHeadersHtml = headers
    .map(
      h => `
      <th style="padding: 8px 10px; background: #0f172a; color: #ffffff; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-right: 1px solid #334155;">
        ${h}
      </th>
    `
    )
    .join('');

  const tableRowsHtml = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = row
        .map(
          cell => `
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; color: #1e293b; border-right: 1px solid #f1f5f9; vertical-align: middle;">
          ${cell !== null && cell !== undefined ? String(cell) : ''}
        </td>
      `
        )
        .join('');
      return `<tr style="background: ${bg}; page-break-inside: avoid; break-inside: avoid;">${cells}</tr>`;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${title} - SIJ Servicios (Tamaño Carta)</title>
      <style>
        /* CONFIGURACIÓN ESTRICTA TAMAÑO CARTA (LETTER 8.5in x 11in) */
        @page {
          size: letter ${resolvedOrientation};
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 16px;
          color: #0f172a;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-box img {
          height: 42px;
          width: auto;
        }
        .logo-title {
          font-size: 17px;
          font-weight: 900;
          color: #0b192c;
          letter-spacing: 0.3px;
        }
        .logo-sub {
          font-size: 10px;
          font-weight: 600;
          color: #0284c7;
        }
        .report-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1px;
        }
        .report-subtitle {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          border: 1px solid #cbd5e1;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .footer {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #94a3b8;
        }
        .btn-print-bar {
          position: fixed;
          top: 14px;
          right: 14px;
          display: flex;
          gap: 8px;
          z-index: 9999;
        }
        .btn-print {
          background: #0284c7;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-weight: bold;
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .btn-print:hover {
          background: #0369a1;
        }
        @media print {
          .btn-print-bar { display: none !important; }
          body { padding: 0 !important; }
        }
      </style>
    </head>
    <body>
      <div class="btn-print-bar">
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF (Tamaño Carta)</button>
      </div>

      <div class="header-bar">
        <div class="logo-box">
          <img src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png" alt="SIJ Logo" onerror="this.style.display='none'">
          <div>
            <div class="logo-title">SIJ MANTENIMIENTO Y SERVICIOS</div>
            <div class="logo-sub">Reporte y Control de Operaciones • Formato Carta</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="report-title">${title}</div>
          <div class="report-subtitle">${subtitle || ''}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 3px;">Generado: ${nowStr}</div>
        </div>
      </div>

      ${metadataHtml ? `<div style="background: #f1f5f9; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0;">${metadataHtml}</div>` : ''}

      ${summaryHtml}

      <table>
        <thead>
          <tr>${tableHeadersHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml || '<tr><td colspan="100" style="padding: 16px; text-align: center; color: #94a3b8;">No se encontraron registros</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <span>Sistema de Gestión de Servicios SIJ • Total Registros: ${rows.length}</span>
        <span>Documento Oficial emitido en Formato Carta (Letter)</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  printHtmlContent(htmlContent);
};

/**
 * Generates official HTML string for a Nota de Venta (Sales Note) or Cotización (Quote)
 * Styled in strict Letter portrait with corporate branding, detailed line items, and totals in words.
 */
export const generateNotaDeVentaHtml = (
  order: any,
  options?: {
    documentType?: 'nota_venta' | 'cotizacion';
    clientData?: { address?: string; phone?: string; email?: string; taxId?: string };
  }
): string => {
  const isQuote = options?.documentType === 'cotizacion';
  const docTitle = isQuote ? 'COTIZACIÓN Y PRESUPUESTO' : 'NOTA DE VENTA / REMISIÓN';
  const folioDisplay = isQuote ? order.folio : `NV-${order.folio}`;

  const budget = order.budget;
  const partsSubtotal = budget
    ? (budget.parts || []).reduce((s: number, p: any) => s + (p.quantity || 1) * (p.estimatedUnitPrice || 0), 0)
    : 0;

  const laborCost = budget?.laborCost !== undefined ? budget.laborCost : (order.collectedAmount || 850);
  const subtotal = laborCost + partsSubtotal;
  const taxRate = budget?.taxRate !== undefined ? budget.taxRate : 0;
  const hasTax = taxRate > 0;
  const taxAmount = budget ? subtotal * taxRate : 0;
  const total = budget?.grandTotal !== undefined && budget.grandTotal > 0
    ? budget.grandTotal
    : (budget ? subtotal + taxAmount : (order.collectedAmount || subtotal));

  const totalInWords = numberToSpanishPesos(total);
  const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });

  const paymentStatus = order.status === 'Cobrado/Cerrado'
    ? `PAGADO (${order.paymentMethod || 'Efectivo / Transferencia'})`
    : budget?.status === 'Aprobado'
    ? 'AUTORIZADO (Pendiente de Cobro)'
    : 'PENDIENTE DE PAGO';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${docTitle} ${folioDisplay} - SIJ (Tamaño Carta)</title>
      <style>
        /* CONFIGURACIÓN ESTRICTA TAMAÑO CARTA VERTICAL (LETTER PORTRAIT) */
        @page {
          size: letter portrait;
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #0f172a;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-size: 11px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #0284c7;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-box img {
          height: 48px;
          width: auto;
        }
        .company-name {
          font-size: 18px;
          font-weight: 900;
          color: #0b192c;
          letter-spacing: 0.3px;
        }
        .company-sub {
          font-size: 10px;
          font-weight: 700;
          color: #0284c7;
          text-transform: uppercase;
        }
        .company-meta {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 2px;
        }
        .folio-badge-box {
          text-align: right;
        }
        .badge-type {
          background: #0284c7;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 6px;
          display: inline-block;
          letter-spacing: 0.5px;
        }
        .badge-folio {
          font-size: 16px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .card-label {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 3px;
          margin-bottom: 6px;
        }
        .item-row {
          margin-bottom: 3px;
          font-size: 10.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          border: 1px solid #cbd5e1;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          padding: 7px 10px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: left;
        }
        td {
          padding: 7px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10.5px;
          color: #1e293b;
        }
        .totals-box {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .totals-table {
          width: 320px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 4px 8px;
          border: none;
        }
        .total-highlight {
          background: #0f172a !important;
          color: #ffffff !important;
          font-weight: 800;
          font-size: 13px;
        }
        .total-highlight td {
          color: #ffffff !important;
          padding: 7px 8px;
        }
        .words-box {
          background: #f1f5f9;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 700;
          color: #334155;
          margin-top: 8px;
          text-transform: uppercase;
        }
        .terms-box {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 6px;
          padding: 8px 12px;
          margin-top: 12px;
          font-size: 9.5px;
          color: #475569;
          page-break-inside: avoid;
        }
        .signatures {
          margin-top: 32px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .sig-block {
          width: 44%;
          border-top: 1.5px solid #64748b;
          text-align: center;
          padding-top: 6px;
          font-size: 10px;
          color: #475569;
        }
        .btn-bar {
          position: fixed;
          top: 14px;
          right: 14px;
          display: flex;
          gap: 8px;
          z-index: 9999;
        }
        .btn-print {
          background: #0284c7;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-weight: bold;
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .btn-print:hover { background: #0369a1; }
        .btn-close {
          background: #334155;
          color: #fff;
          border: none;
          padding: 8px 14px;
          font-weight: bold;
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        @media print {
          .btn-bar { display: none !important; }
          body { padding: 0 !important; }
        }
      </style>
    </head>
    <body>
      <div class="btn-bar">
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF (Tamaño Carta)</button>
        <button class="btn-close" onclick="window.close()">✕ Cerrar</button>
      </div>

      <!-- HEADER -->
      <div class="header">
        <div class="logo-box">
          <img src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png" alt="SIJ Logo" onerror="this.style.display='none'">
          <div>
            <div class="company-name">SIJ MANTENIMIENTO Y SERVICIOS</div>
            <div class="company-sub">Climatización, Refrigeración y Mantenimiento Técnico Industrial</div>
            <div class="company-meta">RFC: SMT8801019A1 • Tel: 800-555-SERVICIOS / 55-8942-1200</div>
            <div class="company-meta">Dirección: Blvd. Manuel Ávila Camacho #1970 • Correo: contacto@sijservicios.com</div>
          </div>
        </div>

        <div class="folio-badge-box">
          <div class="badge-type">${docTitle}</div>
          <div class="badge-folio">${folioDisplay}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Folio Orden: <strong>${order.folio}</strong></div>
          <div style="font-size: 9.5px; color: #64748b;">Fecha Emisión: ${nowStr}</div>
        </div>
      </div>

      <!-- CLIENT & SERVICE INFO CARDS -->
      <div class="info-grid">
        <div class="info-card">
          <div class="card-label">Datos del Cliente y Ubicación:</div>
          <div class="item-row"><strong>Cliente:</strong> <span style="font-size: 12px; font-weight: 800; color: #0284c7;">${order.clientName}</span></div>
          <div class="item-row"><strong>Sucursal / Departamento:</strong> ${order.departmentName || 'Matriz Principal'}</div>
          <div class="item-row"><strong>Contacto:</strong> ${order.clientContact || 'Atención en Sitio'} • Tel: ${order.clientPhone || options?.clientData?.phone || 'S/N'}</div>
          <div class="item-row"><strong>Correo:</strong> ${order.clientEmail || options?.clientData?.email || 'N/A'}</div>
          ${options?.clientData?.address ? `<div class="item-row"><strong>Dirección:</strong> ${options.clientData.address}</div>` : ''}
        </div>

        <div class="info-card">
          <div class="card-label">Datos del Servicio & Equipo Técnico:</div>
          <div class="item-row"><strong>Equipo Atendido:</strong> <span style="font-weight: 700; color: #0f172a;">${order.equipmentType || 'Equipo General'}</span></div>
          <div class="item-row"><strong>Técnico Asignado:</strong> <strong>${order.technicianName || 'Técnico Especialista SIJ'}</strong></div>
          <div class="item-row"><strong>Prioridad de Atención:</strong> ${order.priority}</div>
          <div class="item-row"><strong>Estado de Pago:</strong> <strong style="color: ${order.status === 'Cobrado/Cerrado' ? '#166534' : '#b45309'};">${paymentStatus}</strong></div>
          <div class="item-row"><strong>Fecha de Servicio:</strong> ${order.scheduledDate || order.createdAt}</div>
        </div>
      </div>

      <!-- DESCRIPTION & WORKS -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px;">
        <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">
          Descripción de la Falla y Trabajos Ejecutados:
        </div>
        <div style="font-size: 11px; color: #1e293b;">
          <strong>Reporte:</strong> ${order.description || 'Mantenimiento preventivo / correctivo programado.'}
        </div>
        ${order.solutionNotes ? `
          <div style="font-size: 11px; color: #1e3a8a; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
            <strong>Solución Aplicada:</strong> ${order.solutionNotes}
          </div>
        ` : ''}
      </div>

      <!-- ITEM DETAIL TABLE -->
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Concepto / Descripción del Trabajo</th>
            <th style="width: 14%; text-align: center;">Cantidad</th>
            <th style="width: 18%; text-align: right;">P. Unitario</th>
            <th style="width: 18%; text-align: right;">Importe</th>
          </tr>
        </thead>
        <tbody>
          <!-- Mano de obra -->
          <tr>
            <td>
              <strong>Mano de Obra y Servicio Técnico Especializado</strong>
              <div style="font-size: 9.5px; color: #64748b;">Inspección técnica, pruebas de operación, diagnóstico y puesta a punto.</div>
            </td>
            <td style="text-align: center;">1</td>
            <td style="text-align: right;">$${laborCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            <td style="text-align: right; font-weight: 700;">$${laborCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
          </tr>

          <!-- Refacciones si existen -->
          ${budget && budget.parts && budget.parts.length > 0 ? budget.parts.map((p: any) => {
            const lineTotal = (p.quantity || 1) * (p.estimatedUnitPrice || 0);
            return `
              <tr>
                <td>
                  <strong>${p.name}</strong>
                  ${p.notes ? `<div style="font-size: 9px; color: #64748b;">${p.notes}</div>` : ''}
                </td>
                <td style="text-align: center;">${p.quantity || 1}</td>
                <td style="text-align: right;">$${(p.estimatedUnitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: 700;">$${lineTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              </tr>
            `;
          }).join('') : ''}
        </tbody>
      </table>

      <!-- TOTALS BREAKDOWN -->
      <div class="totals-box">
        <table class="totals-table">
          <tr>
            <td style="text-align: right; color: #64748b;">Subtotal Neto:</td>
            <td style="text-align: right; font-weight: 700;">$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
          </tr>
          ${hasTax ? `
            <tr>
              <td style="text-align: right; color: #64748b;">IVA (${Math.round(taxRate * 100)}%):</td>
              <td style="text-align: right; font-weight: 700;">$${taxAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
            </tr>
          ` : `
            <tr>
              <td style="text-align: right; color: #64748b;">Impuesto (IVA):</td>
              <td style="text-align: right; color: #64748b; font-style: italic;">Sin IVA (Precio Neto)</td>
            </tr>
          `}
          <tr class="total-highlight">
            <td style="text-align: right;">TOTAL A PAGAR:</td>
            <td style="text-align: right; color: #4ade80;">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
          </tr>
        </table>
      </div>

      <!-- AMOUNT IN WORDS -->
      <div class="words-box">
        (SON: ${totalInWords})
      </div>

      <!-- TERMS & GUARANTEE -->
      <div class="terms-box">
        <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">PÓLIZA DE GARANTÍA & CONDICIONES COMERCIALES:</div>
        <div>• <strong>Garantía de Servicio:</strong> Todos nuestros trabajos cuentan con garantía de 90 días naturales sobre mano de obra y refacciones suministradas.</div>
        <div>• La presente nota ampara el servicio técnico efectuado en el equipo indicado. No cubre variaciones de voltaje, negligencia o intervención de terceros ajenos a SIJ.</div>
        ${budget?.notes ? `<div>• <strong>Observaciones especiales:</strong> ${budget.notes}</div>` : ''}
      </div>

      <!-- SIGNATURES -->
      <div class="signatures">
        <div class="sig-block">
          <div style="font-weight: 800; color: #0f172a;">${order.technicianName || 'Técnico Especialista SIJ'}</div>
          <div>Firma del Técnico Responsable</div>
          <div style="font-size: 8.5px; color: #94a3b8; margin-top: 2px;">SIJ Mantenimiento y Servicios</div>
        </div>

        <div class="sig-block">
          <div style="font-weight: 800; color: #0f172a;">${order.clientName}</div>
          <div>Firma de Conformidad y Recibido del Cliente</div>
          <div style="font-size: 8.5px; color: #94a3b8; margin-top: 2px;">Nombre, Firma y Sello</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;
};

/**
 * Triggers official Nota de Venta PDF export / print dialog.
 */
export const exportNotaDeVentaPDF = (
  order: any,
  options?: {
    documentType?: 'nota_venta' | 'cotizacion';
    clientData?: { address?: string; phone?: string; email?: string; taxId?: string };
  }
) => {
  const html = generateNotaDeVentaHtml(order, options);
  printHtmlContent(html);
};

/**
 * Single Order Detailed Technical PDF Report with Photos, Timeline, and Financial breakdown in Letter size.
 */
export const exportSingleOrderPDF = (order: any) => {
  const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
  const budget = order.budget;
  const partsSubtotal = budget
    ? (budget.parts || []).reduce((s: number, p: any) => s + (p.quantity || 1) * (p.estimatedUnitPrice || 0), 0)
    : 0;
  const laborCost = budget?.laborCost || (order.collectedAmount || 0);
  const subtotal = laborCost + partsSubtotal;
  const taxRate = budget?.taxRate !== undefined ? budget.taxRate : 0;
  const hasTax = taxRate > 0;
  const tax = budget ? subtotal * taxRate : 0;
  const total = budget?.grandTotal !== undefined && budget.grandTotal > 0 ? budget.grandTotal : (budget ? subtotal + tax : order.collectedAmount || 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Orden de Servicio ${order.folio} - SIJ (Tamaño Carta)</title>
      <style>
        /* CONFIGURACIÓN ESTRICTA TAMAÑO CARTA VERTICAL (LETTER PORTRAIT) */
        @page {
          size: letter portrait;
          margin: 10mm 12mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 16px;
          color: #0f172a;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2.5px solid #0284c7;
          padding-bottom: 10px;
        }
        .folio-badge {
          background: #0284c7;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          padding: 5px 12px;
          border-radius: 6px;
          display: inline-block;
        }
        .section-box {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 10px;
          background: #f8fafc;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .btn-print {
          position: fixed;
          top: 14px;
          right: 14px;
          background: #0284c7;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 9999;
        }
        @media print { 
          .btn-print { display: none !important; }
          body { padding: 0 !important; }
        }
      </style>
    </head>
    <body>
      <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF (Tamaño Carta)</button>

      <div class="header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png" alt="SIJ Logo" style="height: 42px; width: auto;" onerror="this.style.display='none'">
          <div>
            <div style="font-size: 17px; font-weight: 900; color: #0f172a;">SIJ MANTENIMIENTO Y SERVICIOS</div>
            <div style="font-size: 11px; color: #0284c7; font-weight: 600;">FICHA TÉCNICA Y REPORTE DE SERVICIO • TAMAÑO CARTA</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">Generado: ${nowStr}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="folio-badge">${order.folio}</div>
          <div style="font-size: 11px; font-weight: 700; color: #334155; margin-top: 3px;">Estado: ${order.status}</div>
        </div>
      </div>

      <div class="section-box grid-2">
        <div>
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">Cliente / Ubicación:</strong>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 1px;">${order.clientName}</div>
          <div style="font-size: 11px; color: #475569;">Sucursal: ${order.departmentName || 'Matriz Principal'}</div>
          <div style="font-size: 11px; color: #475569;">Fecha Programada: ${order.scheduledDate || order.createdAt}</div>
        </div>
        <div>
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">Datos Técnicos:</strong>
          <div style="font-size: 12px; font-weight: 700; color: #0284c7; margin-top: 1px;">${order.equipmentType || 'Equipo General'}</div>
          <div style="font-size: 11px; color: #475569;">Técnico Asignado: <strong>${order.technicianName || 'Sin Asignar'}</strong></div>
          <div style="font-size: 11px; color: #475569;">Prioridad: <strong>${order.priority}</strong></div>
        </div>
      </div>

      <div class="section-box">
        <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">Descripción de la Falla / Solicitud:</strong>
        <div style="font-size: 11.5px; color: #1e293b; margin-top: 3px; line-height: 1.4;">${order.description || 'Sin descripción'}</div>
      </div>

      ${order.diagnosticNotes ? `
        <div class="section-box" style="background: #f0fdf4; border-color: #bbf7d0;">
          <strong style="color: #166534; font-size: 10px; text-transform: uppercase;">Diagnóstico e Inspección en Sitio:</strong>
          <div style="font-size: 11.5px; color: #14532d; margin-top: 3px;">${order.diagnosticNotes}</div>
        </div>
      ` : ''}

      ${order.solutionNotes ? `
        <div class="section-box" style="background: #eff6ff; border-color: #bfdbfe;">
          <strong style="color: #1e40af; font-size: 10px; text-transform: uppercase;">Solución y Trabajos Ejecutados:</strong>
          <div style="font-size: 11.5px; color: #1e3a8a; margin-top: 3px;">${order.solutionNotes}</div>
        </div>
      ` : ''}

      ${budget || order.collectedAmount ? `
        <div class="section-box">
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">Presupuesto y Desglose Financiero:</strong>
          <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px;">
            <tr style="background: #e2e8f0; font-weight: bold;">
              <td style="padding: 5px 8px;">Concepto</td>
              <td style="padding: 5px 8px; text-align: center;">Cantidad</td>
              <td style="padding: 5px 8px; text-align: right;">Unitario</td>
              <td style="padding: 5px 8px; text-align: right;">Total</td>
            </tr>
            <tr>
              <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0;">Mano de Obra y Servicio Técnico Especializado</td>
              <td style="padding: 5px 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">1</td>
              <td style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">$${laborCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              <td style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">$${laborCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            </tr>
            ${(budget?.parts || []).map((p: any) => `
              <tr>
                <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0;">${p.name}</td>
                <td style="padding: 5px 8px; text-align: center; border-bottom: 1px solid #e2e8f0;">${p.quantity}</td>
                <td style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">$${p.estimatedUnitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">$${(p.quantity * p.estimatedUnitPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
            ${hasTax ? `
            <tr>
              <td colspan="3" style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #64748b;">Subtotal Neto:</td>
              <td style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 600;">$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #64748b;">IVA (${Math.round(taxRate * 100)}%):</td>
              <td style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 600;">$${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
            </tr>
            ` : `
            <tr>
              <td colspan="3" style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #64748b;">Condición Fiscal (IVA):</td>
              <td style="padding: 5px 8px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">Sin IVA / Precio Neto</td>
            </tr>
            `}
            <tr style="font-weight: 800; font-size: 13px; background: #0f172a; color: #fff;">
              <td colspan="3" style="padding: 7px 8px;">${hasTax ? 'TOTAL AUTORIZADO (IVA 16% Incluido):' : 'TOTAL AUTORIZADO NETO (Sin IVA):'}</td>
              <td style="padding: 7px 8px; text-align: right; color: #4ade80;">$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
            </tr>
          </table>
        </div>
      ` : ''}

      <div style="margin-top: 28px; display: flex; justify-content: space-between; font-size: 10.5px; color: #64748b; page-break-inside: avoid; break-inside: avoid;">
        <div style="border-top: 1px solid #94a3b8; width: 42%; text-align: center; padding-top: 5px;">
          Firma Técnico Responsable
        </div>
        <div style="border-top: 1px solid #94a3b8; width: 42%; text-align: center; padding-top: 5px;">
          Firma / Conformidad del Cliente
        </div>
      </div>
    </body>
    </html>
  `;

  printHtmlContent(htmlContent);
};

/**
 * Bulk exports the services catalog into a formatted PDF document in Letter size.
 */
export const exportCatalogToPDF = (services: any[]) => {
  const headers = ['Código', 'Nombre del Servicio', 'Categoría', 'Precio Base', 'Duración', 'Garantía', 'Estado'];
  const rows = services.map(s => [
    s.code,
    s.name,
    s.category,
    `$${(Number(s.basePrice) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    `${s.estimatedDurationHours || 2} hrs`,
    `${s.warrantyDays || 30} días`,
    s.status || 'Activo'
  ]);

  const activeCount = services.filter(s => s.status === 'Activo').length;
  const avgPrice = services.length > 0
    ? services.reduce((sum, s) => sum + (Number(s.basePrice) || 0), 0) / services.length
    : 0;

  exportToPDF({
    title: 'Catálogo Oficial de Servicios Técnicos',
    subtitle: `Tarifario, Categorías y Políticas de Garantía (${services.length} servicios)`,
    headers,
    rows,
    summaryCards: [
      { label: 'Total Servicios', value: services.length },
      { label: 'Servicios Activos', value: activeCount },
      { label: 'Tarifa Promedio', value: `$${avgPrice.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN` }
    ],
    orientation: 'landscape'
  });
};

/**
 * Bulk exports the spare parts inventory into a formatted PDF document in Letter size.
 */
export const exportSparePartsToPDF = (parts: any[]) => {
  const headers = ['Código', 'Descripción de la Refacción', 'Categoría', 'Stock Disponible', 'P. Unitario'];
  const rows = parts.map(p => [
    p.code,
    p.name,
    p.category || 'General',
    `${p.stock ?? 0} pzas`,
    `$${(Number(p.price) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
  ]);

  const totalValue = parts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);
  const totalStock = parts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

  exportToPDF({
    title: 'Inventario y Catálogo de Refacciones',
    subtitle: `Control de Existencias y Precios de Piezas (${parts.length} refacciones)`,
    headers,
    rows,
    summaryCards: [
      { label: 'Total Refacciones', value: parts.length },
      { label: 'Piezas en Stock', value: totalStock },
      { label: 'Valor Estimado Inventario', value: `$${totalValue.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN` }
    ],
    orientation: 'portrait'
  });
};

/**
 * Bulk exports operational metrics and technician performance into a formatted PDF document.
 */
export const exportMetricsToPDF = (data: {
  technicians: any[];
  orders: any[];
  clients: any[];
}) => {
  const headers = ['Técnico', 'Especialidad', 'Órdenes Concluidas', 'En Proceso', 'Total Cobrado ($)'];
  const rows = data.technicians.map(t => {
    const techOrders = data.orders.filter(o => o.technicianId === t.id || o.technicianName?.toLowerCase() === t.name.toLowerCase());
    const closed = techOrders.filter(o => o.status === 'Cobrado/Cerrado').length;
    const inProgress = techOrders.filter(o => o.status === 'En Reparación' || o.status === 'En Diagnóstico').length;
    const collected = techOrders
      .filter(o => o.status === 'Cobrado/Cerrado')
      .reduce((sum, o) => sum + (o.collectedAmount || 0), 0);

    return [
      t.name,
      t.specialty || 'General',
      closed,
      inProgress,
      `$${collected.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
    ];
  });

  const totalCollectedAll = data.orders
    .filter(o => o.status === 'Cobrado/Cerrado')
    .reduce((sum, o) => sum + (o.collectedAmount || 0), 0);

  exportToPDF({
    title: 'Reporte Ejecutivo de Métricas y Desempeño Operativo',
    subtitle: `Evaluación de Rendimiento por Técnico y Volumen de Atención (${data.technicians.length} técnicos)`,
    headers,
    rows,
    summaryCards: [
      { label: 'Total Técnicos', value: data.technicians.length },
      { label: 'Total Órdenes Concluidas', value: data.orders.filter(o => o.status === 'Cobrado/Cerrado').length },
      { label: 'Cobranza Total Realizada', value: `$${totalCollectedAll.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN` }
    ],
    orientation: 'portrait'
  });
};
