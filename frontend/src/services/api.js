const BASE_URL = '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
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

  return response.json();
}

// ==========================================
// Events API
// ==========================================
export async function getEvents(params = {}) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.category && params.category !== 'ALL') query.append('category', params.category);
  if (params.userId) query.append('user_id', params.userId);
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

// ==========================================
// Invoices API
// ==========================================
export async function searchInvoices(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.eventId) query.append('event_id', params.eventId);
  if (params.startDate) query.append('start_date', params.startDate);
  if (params.endDate) query.append('end_date', params.endDate);
  if (params.minAmount) query.append('min_amount', params.minAmount);
  if (params.maxAmount) query.append('max_amount', params.maxAmount);
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

// ==========================================
// Dashboard & Users
// ==========================================
export async function getDashboardStats() {
  return fetchApi('/dashboard/stats');
}

export async function getUsers() {
  return fetchApi('/users');
}

export async function getTimezones() {
  return fetchApi('/users/timezones');
}
