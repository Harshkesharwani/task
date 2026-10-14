const BASE_URL = '/api';

// Initial sample data for static GitHub Pages demo mode
const INITIAL_DEMO_EVENTS = [
  {
    id: 1,
    title: "Sprint 1 Milestone Delivery",
    category: "MILESTONE",
    start_time: new Date(Date.now() - 86400000).toISOString(),
    end_time: new Date(Date.now() - 79200000).toISOString(),
    is_recurring: false,
    recurrence_pattern: "NONE",
    time_zone: "Asia/Kolkata",
    status: "COMPLETED",
    invoice_count: 1
  },
  {
    id: 2,
    title: "Weekly Architecture Review",
    category: "MEETING",
    start_time: new Date(Date.now() + 86400000).toISOString(),
    end_time: new Date(Date.now() + 90000000).toISOString(),
    is_recurring: true,
    recurrence_pattern: "WEEKLY",
    time_zone: "UTC",
    status: "SCHEDULED",
    invoice_count: 0
  },
  {
    id: 3,
    title: "Production Deployment",
    category: "DEPLOYMENT",
    start_time: new Date(Date.now() + 259200000).toISOString(),
    end_time: new Date(Date.now() + 266400000).toISOString(),
    is_recurring: false,
    recurrence_pattern: "NONE",
    time_zone: "America/New_York",
    status: "SCHEDULED",
    invoice_count: 0
  }
];

const INITIAL_DEMO_INVOICES = [
  {
    id: 1,
    invoice_number: "INV-2026-0001",
    event_title: "Sprint 1 Milestone Delivery",
    amount: "2500.00",
    status: "PAID",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { id: 1, description: "Core Engine Delivery", quantity: 1, unit_price: 2500 }
    ]
  },
  {
    id: 2,
    invoice_number: "INV-2026-0002",
    event_title: null,
    amount: "1800.00",
    status: "DRAFT",
    created_at: new Date(Date.now() - 43200000).toISOString(),
    items: [
      { id: 2, description: "Frontend Dashboard Integration", quantity: 1, unit_price: 1800 }
    ]
  }
];

function getLocalEvents() {
  const stored = localStorage.getItem('demo_events');
  if (!stored) {
    localStorage.setItem('demo_events', JSON.stringify(INITIAL_DEMO_EVENTS));
    return INITIAL_DEMO_EVENTS;
  }
  return JSON.parse(stored);
}

function setLocalEvents(events) {
  localStorage.setItem('demo_events', JSON.stringify(events));
}

function getLocalInvoices() {
  const stored = localStorage.getItem('demo_invoices');
  if (!stored) {
    localStorage.setItem('demo_invoices', JSON.stringify(INITIAL_DEMO_INVOICES));
    return INITIAL_DEMO_INVOICES;
  }
  return JSON.parse(stored);
}

function setLocalInvoices(invoices) {
  localStorage.setItem('demo_invoices', JSON.stringify(invoices));
}

export async function fetchApi(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorDetail = 'An error occurred';
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || JSON.stringify(errJson);
      } catch {
        errorDetail = await response.text();
      }
      throw new Error(typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (err) {
    // If backend is not running or on static GitHub Pages, use client-side demo storage
    return handleStaticDemoFallback(endpoint, options);
  }
}

// Client-side fallback handler for GitHub Pages demo hosting
function handleStaticDemoFallback(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  // Events endpoints
  if (endpoint.startsWith('/events')) {
    let events = getLocalEvents();

    if (method === 'GET') {
      const urlObj = new URL('http://dummy' + endpoint);
      const cat = urlObj.searchParams.get('category');
      if (cat && cat !== 'ALL') {
        events = events.filter((e) => e.category === cat.toUpperCase());
      }
      return events;
    }

    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newEvent = {
        id: Date.now(),
        ...body,
        created_at: new Date().toISOString(),
        invoice_count: 0,
      };
      events.push(newEvent);
      setLocalEvents(events);
      return newEvent;
    }

    if (method === 'DELETE') {
      const parts = endpoint.split('/');
      const id = parseInt(parts[parts.length - 1]);
      events = events.filter((e) => e.id !== id);
      setLocalEvents(events);
      return null;
    }
  }

  // Invoices endpoints
  if (endpoint.startsWith('/invoices')) {
    let invoices = getLocalInvoices();

    if (endpoint.includes('/search')) {
      const urlObj = new URL('http://dummy' + endpoint);
      const q = (urlObj.searchParams.get('search') || '').toLowerCase();
      const st = urlObj.searchParams.get('status');

      let filtered = invoices;
      if (st && st !== 'ALL') {
        filtered = filtered.filter((i) => i.status === st.toUpperCase());
      }
      if (q) {
        filtered = filtered.filter(
          (i) =>
            i.invoice_number.toLowerCase().includes(q) ||
            (i.event_title && i.event_title.toLowerCase().includes(q))
        );
      }

      return {
        items: filtered,
        total: filtered.length,
        page: 1,
        page_size: 20,
        total_pages: 1,
      };
    }

    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newInv = {
        id: Date.now(),
        invoice_number: `INV-2026-${String(invoices.length + 1).padStart(4, '0')}`,
        amount: body.items ? body.items.reduce((s, it) => s + it.quantity * it.unit_price, 0) : body.amount || 0,
        status: body.status || 'DRAFT',
        event_title: body.event ? `Event #${body.event}` : null,
        created_at: new Date().toISOString(),
        items: body.items || [],
      };
      invoices.unshift(newInv);
      setLocalInvoices(invoices);
      return newInv;
    }

    if (method === 'PATCH') {
      const parts = endpoint.split('/');
      const id = parseInt(parts[2]);
      const body = JSON.parse(options.body || '{}');
      invoices = invoices.map((inv) => (inv.id === id ? { ...inv, status: body.status } : inv));
      setLocalInvoices(invoices);
      return invoices.find((inv) => inv.id === id) || null;
    }

    if (method === 'DELETE') {
      const parts = endpoint.split('/');
      const id = parseInt(parts[parts.length - 1]);
      invoices = invoices.filter((i) => i.id !== id);
      setLocalInvoices(invoices);
      return null;
    }
  }

  return [];
}

// ==========================================
// Public Service Methods
// ==========================================
export async function getEvents(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.category && params.category !== 'ALL') query.append('category', params.category);
  if (params.timeZone) query.append('time_zone', params.timeZone);
  if (params.expandRecurring !== undefined) query.append('expand_recurring', params.expandRecurring);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchApi(`/events${queryString}`);
}

export async function createEvent(eventData) {
  return fetchApi('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

export async function deleteEvent(eventId) {
  return fetchApi(`/events/${eventId}`, {
    method: 'DELETE',
  });
}

export async function convertMilestoneToInvoice(eventId, payload) {
  return createInvoice({
    ...payload,
    event: eventId,
    status: 'DRAFT',
  });
}

export async function searchInvoices(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.eventId) query.append('event_id', params.eventId);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.page) query.append('page', params.page);
  if (params.pageSize) query.append('page_size', params.pageSize);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchApi(`/invoices/search${queryString}`);
}

export async function createInvoice(invoiceData) {
  const payload = {
    ...invoiceData,
    event: invoiceData.event !== undefined ? invoiceData.event : (invoiceData.event_id || null),
  };
  return fetchApi('/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateInvoiceStatus(invoiceId, newStatus) {
  return fetchApi(`/invoices/${invoiceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus }),
  });
}

export async function deleteInvoice(invoiceId) {
  return fetchApi(`/invoices/${invoiceId}`, {
    method: 'DELETE',
  });
}
