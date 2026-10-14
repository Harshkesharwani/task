import React from 'react';
import { X, Receipt, CheckCircle, Clock, AlertTriangle, Printer, Trash2, Calendar } from 'lucide-react';

const STATUS_BADGES = {
  PAID: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  DRAFT: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  OVERDUE: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
};

export default function InvoiceDetailsModal({
  isOpen,
  onClose,
  invoice,
  onUpdateStatus,
  onDelete,
}) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-white font-mono">{invoice.invoice_number}</h3>
              <p className="text-xs text-slate-400">Enterprise Billing Record</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Print / Save PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top Info Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-xl border border-slate-800 gap-3">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Billed To</span>
              <h4 className="text-base font-bold text-white mt-0.5">{invoice.client_name || 'Standard Client'}</h4>
              {invoice.client_email && (
                <p className="text-xs text-slate-400">{invoice.client_email}</p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Status</span>
              <div className="mt-1">
                <span
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full border uppercase ${
                    STATUS_BADGES[invoice.status] || STATUS_BADGES.DRAFT
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Event association */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Issue Date:</span>
              <span className="font-semibold text-slate-200">
                {new Date(invoice.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">Due Date:</span>
              <span className="font-semibold text-slate-200">
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
              <span className="text-slate-500 block mb-1">Linked Project Event:</span>
              <span className="font-semibold text-indigo-400 truncate block">
                {invoice.event_title || 'None (Standalone)'}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Itemized Breakdown</h5>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(!invoice.items || invoice.items.length === 0) ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-slate-500">
                        Milestone Service Delivery
                      </td>
                    </tr>
                  ) : (
                    invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-medium text-white">{item.description}</td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Total Summary Row */}
              <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Grand Total Amount:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Status Quick Changer Buttons */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400">Quick Status Transition:</span>
            <div className="flex items-center space-x-2">
              {invoice.status !== 'PAID' && (
                <button
                  onClick={() => onUpdateStatus(invoice.id, 'PAID')}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-semibold transition-all"
                >
                  Mark as Paid
                </button>
              )}
              {invoice.status !== 'OVERDUE' && (
                <button
                  onClick={() => onUpdateStatus(invoice.id, 'OVERDUE')}
                  className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg font-semibold transition-all"
                >
                  Mark Overdue
                </button>
              )}
              {invoice.status !== 'DRAFT' && (
                <button
                  onClick={() => onUpdateStatus(invoice.id, 'DRAFT')}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold transition-all"
                >
                  Move to Draft
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
                onDelete(invoice.id);
                onClose();
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Invoice</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
