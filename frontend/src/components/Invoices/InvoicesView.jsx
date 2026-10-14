import React from 'react';
import { Search, Filter, Plus, Eye, Trash2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';

const STATUS_BADGES = {
  PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  DRAFT: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  OVERDUE: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function InvoicesView({
  invoicesData,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  page,
  setPage,
  onOpenCreateInvoice,
  onSelectInvoice,
  onUpdateStatus,
  onDeleteInvoice,
}) {
  const { items = [], total = 0, total_pages = 1 } = invoicesData || {};

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search invoice #, description, or event..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Dropdown & Create Button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="DRAFT" className="bg-slate-900">Draft Only</option>
              <option value="PAID" className="bg-slate-900">Paid Only</option>
              <option value="OVERDUE" className="bg-slate-900">Overdue Only</option>
            </select>
          </div>

          <button
            onClick={onOpenCreateInvoice}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Linked Event</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-1 opacity-50" />
                    No invoices match your search filters.
                  </td>
                </tr>
              ) : (
                items.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectInvoice(inv)}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-white">
                      {inv.invoice_number}
                    </td>

                    <td className="px-4 py-3">
                      {inv.event_title ? (
                        <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                          {inv.event_title}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Standalone</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-bold text-white">
                      ${parseFloat(inv.amount).toFixed(2)}
                    </td>

                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inv.status}
                        onChange={(e) => onUpdateStatus(inv.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-0.5 rounded border cursor-pointer ${
                          STATUS_BADGES[inv.status] || STATUS_BADGES.DRAFT
                        } bg-slate-900`}
                      >
                        <option value="DRAFT" className="bg-slate-900 text-amber-400">DRAFT</option>
                        <option value="PAID" className="bg-slate-900 text-emerald-400">PAID</option>
                        <option value="OVERDUE" className="bg-slate-900 text-rose-400">OVERDUE</option>
                      </select>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total_pages > 1 && (
          <div className="border-t border-slate-800 bg-slate-950 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {total_pages} ({total} records)
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= total_pages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
