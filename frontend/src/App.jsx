import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Common/Navbar';
import CalendarView from './components/Calendar/CalendarView';
import InvoicesView from './components/Invoices/InvoicesView';
import ToastContainer from './components/Common/ToastContainer';

// Modals
import CreateEventModal from './components/Modals/CreateEventModal';
import EventDetailsModal from './components/Modals/EventDetailsModal';
import CreateInvoiceModal from './components/Modals/CreateInvoiceModal';
import InvoiceDetailsModal from './components/Modals/InvoiceDetailsModal';
import ConvertMilestoneModal from './components/Modals/ConvertMilestoneModal';

// Services
import * as api from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentTimezone, setCurrentTimezone] = useState('Asia/Kolkata');
  const [toasts, setToasts] = useState([]);

  // Data states
  const [events, setEvents] = useState([]);
  const [invoicesData, setInvoicesData] = useState({ items: [], total: 0, summary: {} });

  // Calendar controls
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandRecurring, setExpandRecurring] = useState(true);

  // Invoices controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [invoicePage, setInvoicePage] = useState(1);

  // Modals
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [createEventDefaultDate, setCreateEventDefaultDate] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);

  const [convertMilestoneEvent, setConvertMilestoneEvent] = useState(null);
  const [isConvertMilestoneOpen, setIsConvertMilestoneOpen] = useState(false);

  // Toast notifications
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Events
  const loadEvents = useCallback(async () => {
    try {
      const data = await api.getEvents({
        category: selectedCategory,
        timeZone: currentTimezone,
        expandRecurring: expandRecurring,
      });
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, [selectedCategory, currentTimezone, expandRecurring]);

  // Fetch Invoices
  const loadInvoices = useCallback(async () => {
    try {
      const data = await api.searchInvoices({
        search: searchQuery,
        status: statusFilter,
        page: invoicePage,
        pageSize: 15,
      });
      setInvoicesData(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  }, [searchQuery, statusFilter, invoicePage]);

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Seamless real-time sync without page reloads
  useEffect(() => {
    const syncTimer = setInterval(() => {
      loadEvents();
      loadInvoices();
    }, 4000);
    return () => clearInterval(syncTimer);
  }, [loadEvents, loadInvoices]);

  // Event Handlers
  const handleCreateEvent = async (eventData) => {
    const created = await api.createEvent(eventData);
    addToast({
      type: 'success',
      title: 'Event Scheduled',
      message: `"${created.title}" scheduled successfully.`,
    });
    loadEvents();
    return created;
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.deleteEvent(eventId);
      addToast({
        type: 'info',
        title: 'Event Deleted',
        message: 'Event was removed.',
      });
      loadEvents();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error Deleting Event',
        message: err.message,
      });
    }
  };

  const handleCreateInvoice = async (invoiceData) => {
    const created = await api.createInvoice(invoiceData);
    addToast({
      type: 'success',
      title: 'Invoice Created',
      message: `Invoice ${created.invoice_number} generated for $${parseFloat(created.amount).toFixed(2)}.`,
    });
    loadInvoices();
    loadEvents();
    return created;
  };

  const handleConvertMilestone = async (eventId, payload) => {
    const created = await api.convertMilestoneToInvoice(eventId, payload);
    addToast({
      type: 'success',
      title: 'Milestone Invoiced',
      message: `Generated invoice ${created.invoice_number}.`,
    });
    loadInvoices();
    loadEvents();
    return created;
  };

  const handleUpdateInvoiceStatus = async (invoiceId, newStatus) => {
    try {
      const updated = await api.updateInvoiceStatus(invoiceId, newStatus);
      addToast({
        type: 'info',
        title: 'Status Updated',
        message: `Invoice ${updated.invoice_number} is now ${newStatus}.`,
      });
      loadInvoices();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message,
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await api.deleteInvoice(invoiceId);
      addToast({
        type: 'info',
        title: 'Invoice Deleted',
        message: 'Invoice removed.',
      });
      loadInvoices();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Simple Clean Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTimezone={currentTimezone}
        setCurrentTimezone={setCurrentTimezone}
        onOpenCreateEvent={() => {
          setCreateEventDefaultDate(new Date());
          setIsCreateEventOpen(true);
        }}
        onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            expandRecurring={expandRecurring}
            setExpandRecurring={setExpandRecurring}
            onOpenCreateEvent={(date) => {
              setCreateEventDefaultDate(date || new Date());
              setIsCreateEventOpen(true);
            }}
            onSelectEvent={(ev) => {
              setSelectedEvent(ev);
              setIsEventDetailsOpen(true);
            }}
            onDateClick={(date) => {
              setCreateEventDefaultDate(date);
              setIsCreateEventOpen(true);
            }}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView
            invoicesData={invoicesData}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            page={invoicePage}
            setPage={setInvoicePage}
            onOpenCreateInvoice={() => setIsCreateInvoiceOpen(true)}
            onSelectInvoice={(inv) => {
              setSelectedInvoice(inv);
              setIsInvoiceDetailsOpen(true);
            }}
            onUpdateStatus={handleUpdateInvoiceStatus}
            onDeleteInvoice={handleDeleteInvoice}
          />
        )}
      </main>

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onSubmit={handleCreateEvent}
        defaultDate={createEventDefaultDate}
        currentTimezone={currentTimezone}
      />

      <EventDetailsModal
        isOpen={isEventDetailsOpen}
        onClose={() => setIsEventDetailsOpen(false)}
        event={selectedEvent}
        onDelete={handleDeleteEvent}
        onConvertToInvoice={(ev) => {
          setConvertMilestoneEvent(ev);
          setIsConvertMilestoneOpen(true);
        }}
        currentTimezone={currentTimezone}
      />

      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSubmit={handleCreateInvoice}
        events={events}
      />

      <InvoiceDetailsModal
        isOpen={isInvoiceDetailsOpen}
        onClose={() => setIsInvoiceDetailsOpen(false)}
        invoice={selectedInvoice}
        onUpdateStatus={handleUpdateInvoiceStatus}
        onDelete={handleDeleteInvoice}
      />

      <ConvertMilestoneModal
        isOpen={isConvertMilestoneOpen}
        onClose={() => setIsConvertMilestoneOpen(false)}
        onSubmit={handleConvertMilestone}
        event={convertMilestoneEvent}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
