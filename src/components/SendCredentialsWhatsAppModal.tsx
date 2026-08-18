import React, { useState } from 'react';
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  X,
  Share2,
  Phone,
  Lock,
  User,
  ShieldCheck,
  Sparkles,
  Smartphone
} from 'lucide-react';
import {
  cleanWhatsAppPhone,
  getClientPortalUrl,
  getTechPortalUrl,
  openWhatsAppWebOrApp,
  buildClientCredentialsWhatsAppMessage,
  buildTechCredentialsWhatsAppMessage
} from '../lib/whatsappUtils';

export interface SendCredentialsWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'client' | 'tech' | 'custom';
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientUsername?: string;
  recipientPassword?: string;
  specialty?: string;
  folio?: string;
  customMessage?: string;
  title?: string;
}

export const SendCredentialsWhatsAppModal: React.FC<SendCredentialsWhatsAppModalProps> = ({
  isOpen,
  onClose,
  type,
  recipientName,
  recipientPhone = '',
  recipientEmail = '',
  recipientUsername = '',
  recipientPassword = '',
  specialty = 'Técnico de Campo',
  folio = '',
  customMessage,
  title
}) => {
  const [phone, setPhone] = useState(recipientPhone);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Calculate default direct link
  const directLink =
    type === 'client'
      ? getClientPortalUrl(folio, recipientEmail)
      : getTechPortalUrl(recipientEmail);

  // Generate initial message
  const initialMessage =
    customMessage ||
    (type === 'client'
      ? buildClientCredentialsWhatsAppMessage({
          clientName: recipientName,
          email: recipientEmail,
          password: recipientPassword || '1234 (o tu contraseña)',
          phone: phone,
          folio: folio
        })
      : buildTechCredentialsWhatsAppMessage({
          techName: recipientName,
          username: recipientUsername,
          email: recipientEmail,
          password: recipientPassword || 'Temp1234!',
          phone: phone,
          specialty: specialty
        }));

  const [message, setMessage] = useState(initialMessage);

  if (!isOpen) return null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendWhatsApp = () => {
    openWhatsAppWebOrApp(phone, message);
  };

  const modalTitle =
    title ||
    (type === 'client'
      ? 'Enviar Acceso y Credenciales al Cliente por WhatsApp'
      : 'Enviar Credenciales de Acceso al Técnico por WhatsApp');

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative space-y-4 max-h-[94vh] flex flex-col border border-slate-100 my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                {modalTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Envía credenciales de acceso y el link directo con un solo clic.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 space-y-4 text-xs pr-1">
          
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {type === 'client' ? 'Cliente' : 'Técnico'}
              </span>
              <p className="font-extrabold text-slate-900 text-sm truncate flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{recipientName}</span>
              </p>
              {recipientEmail && (
                <p className="text-slate-500 text-[11px] truncate font-medium">{recipientEmail}</p>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Número de WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. 8112345678 o 528112345678"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Direct Link Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 flex items-center space-x-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Link Personalizado de Acceso Directo:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white/80 px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-[11px] text-emerald-800 bg-white/90 p-2 rounded-xl border border-emerald-200 select-all break-all">
              {directLink}
            </p>
          </div>

          {/* Live Message Preview & Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-xs flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mensaje Formateado para WhatsApp:</span>
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">¡Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Texto Completo</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={7}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-slate-900 text-emerald-300 font-mono text-xs rounded-2xl p-3.5 border border-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden leading-relaxed shadow-inner"
            />
            <p className="text-[11px] text-slate-400">
              💡 Puedes editar el mensaje aquí antes de enviar si deseas agregar algún dato extra.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedText ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
