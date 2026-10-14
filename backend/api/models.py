from django.db import models
from django.utils import timezone


class User(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50, default="MANAGER")  # MANAGER, MEMBER, CLIENT, ADMIN
    time_zone = models.CharField(max_length=100, default="UTC")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.role})"


class ProjectEvent(models.Model):
    CATEGORY_CHOICES = [
        ('MILESTONE', 'Milestone'),
        ('MEETING', 'Meeting'),
        ('DEPLOYMENT', 'Deployment'),
        ('REVIEW', 'Review'),
        ('TASK', 'Task'),
    ]

    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    RECURRENCE_CHOICES = [
        ('NONE', 'None'),
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
    ]

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='MILESTONE')
    start_time = models.DateTimeField(db_index=True)  # stored in UTC
    end_time = models.DateTimeField(db_index=True)    # stored in UTC
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, choices=RECURRENCE_CHOICES, default='NONE')
    recurrence_end_date = models.DateTimeField(null=True, blank=True)
    time_zone = models.CharField(max_length=100, default='UTC')  # source timezone
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='SCHEDULED')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} ({self.start_time.strftime('%Y-%m-%d %H:%M')} UTC)"


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'DRAFT'),
        ('PAID', 'PAID'),
        ('OVERDUE', 'OVERDUE'),
    ]

    event = models.ForeignKey(ProjectEvent, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    invoice_number = models.CharField(max_length=100, unique=True, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} - ${self.amount} ({self.status})"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    @property
    def total_price(self):
        return round(float(self.quantity) * float(self.unit_price), 2)

    def __str__(self):
        return f"{self.description} ({self.quantity} x {self.unit_price})"
