/**
 * Utilities for exporting data to Excel (CSV/XLS with UTF-8 BOM) and PDF (Professional formatted printable window).
 * Supports bulk export (All or Selected) and single record exports.
 */

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

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

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes en tu navegador para generar el PDF en Tamaño Carta.');
    return;
  }

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
        .btn-print {
          position: fixed;
          top: 14px;
          right: 14px;
          background: #0284c7;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-weight: bold;
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 9999;
        }
        .btn-print:hover {
          background: #0369a1;
        }
        @media print {
          .btn-print { display: none !important; }
          body { padding: 0 !important; }
        }
      </style>
    </head>
    <body>
      <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF (Tamaño Carta)</button>

      <div class="header-bar">
        <div class="logo-box">
          <img src="https://battwitnhrezwotkcvbc.supabase.co/storage/v1/object/public/logo/sij.png" alt="SIJ Logo" onerror="this.style.display='none'">
          <div>
            <div class="logo-title">SIJ MANTENIMIENTO Y SERVICIOS</div>
            <div class="logo-sub">Reporte y Control de Operaciones • Tamaño Carta</div>
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

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

/**
 * Single Order Detailed PDF Report with Photos, Timeline, and Financial breakdown in Letter size.
 */
export const exportSingleOrderPDF = (order: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite las ventanas emergentes para generar el PDF de la orden en Tamaño Carta.');
    return;
  }

  const nowStr = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
  const budget = order.budget;
  const partsSubtotal = budget
    ? (budget.parts || []).reduce((s: number, p: any) => s + (p.quantity || 1) * (p.estimatedUnitPrice || 0), 0)
    : 0;
  const laborCost = budget?.laborCost || 0;
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

      ${budget ? `
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
            ${(budget.parts || []).map((p: any) => `
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

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
