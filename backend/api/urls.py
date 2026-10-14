from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    InvoiceListCreateView,
    InvoiceSearchView,
    InvoiceDetailView,
    dashboard_stats,
    seed_data
)

urlpatterns = [
    # Core Backend & REST APIs required by PDF
    path('events', EventListCreateView.as_view(), name='event-list-create'),
    path('events/<int:pk>', EventDetailView.as_view(), name='event-detail'),
    path('invoices', InvoiceListCreateView.as_view(), name='invoice-list-create'),
    path('invoices/search', InvoiceSearchView.as_view(), name='invoice-search'),
    path('invoices/<int:pk>', InvoiceDetailView.as_view(), name='invoice-detail'),
    
    # Dashboard stats & seeder
    path('dashboard/stats', dashboard_stats, name='dashboard-stats'),
    path('dashboard/seed', seed_data, name='dashboard-seed'),
]
