@echo off
echo =======================================================
echo Starting Django REST Framework (DRF) Backend
echo URL: http://localhost:8000/api/
echo =======================================================
cd backend
python manage.py runserver 8000
pause
