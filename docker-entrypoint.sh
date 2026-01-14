#!/bin/sh
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  echo "Creating superuser if not exists..."
  python manage.py createsuperuser --no-input || echo "Superuser might already exist or failed."
fi

echo "Collecting static files..."
python manage.py collectstatic --noinput

exec "$@"
