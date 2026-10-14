import React, { useState } from 'react';
import { X, DollarSign, Plus, Trash2, Receipt, AlertCircle, Award } from 'lucide-react';

export default function ConvertMilestoneModal({
  isOpen,
  onClose,
  onSubmit,
  event,
}) {
  if (!isOpen || !event) return null;

  const [clientName, setClientName] = useState('Enterprise Client');
  const [clientEmail, setClientEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState([
    {
      description: `Delivery & Sign-off for Milestone: ${event.title}`,
      quantity: 1,
      unit_price: 3500,
    },
  ]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'description' ? value : parseFloat(value) || 0;
    setItems(updated);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    setSubmitting(true);
    try {
      await onSubmit(event.id, {
        client_name: clientName,
        client_email: clientEmail || null,
        due_date: dueDate ? `${dueDate}T23:59:59` : null,
        items: items.map((it) => ({
          description: it.description,
          quantity: parseFloat(it.quantity),
          unit_price: parseFloat(it.unit_price),
        })),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to convert milestone to invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Convert Milestone to Client Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Linked Milestone Highlight */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-amber-400 font-bold uppercase tracking-wider block text-[10px]">
                Milestone Deliverable
              </span>
              <span className="text-white font-semibold text-sm">{event.title}</span>
            </div>
            <span className="text-slate-400 text-xs">Event #{event.id}</span>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Client / Organization *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Client Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="accounts@client.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Payment Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Line items builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Milestone Billing Line Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800"
                >
                  <input
                    type="text"
                    required
                    placeholder="Deliverable description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-600"
                  />
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                  </div>
                  <div className="w-28 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-5 pr-2 py-1 text-xs text-white text-right"
                    />
                  </div>
                  <span className="w-24 text-right font-mono font-bold text-xs text-slate-300">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Total Calculated Amount */}
            <div className="flex items-center justify-between p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl">
              <span className="text-sm font-semibold text-amber-300">Total Billed for Milestone:</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition-all"
            >
              {submitting ? 'Converting...' : 'Generate & Issue Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
