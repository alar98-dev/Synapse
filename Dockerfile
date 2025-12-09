FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev gcc curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
COPY dev-requirements.txt /app/
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# dev deps are installed only when the BUILD_TESTS env var is set to '1'
ARG BUILD_TESTS=0
RUN if [ "$BUILD_TESTS" = "1" ]; then pip install --no-cache-dir -r dev-requirements.txt; fi

COPY . /app/

ENV DJANGO_SETTINGS_MODULE=synapse_project.settings

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["gunicorn", "synapse_project.wsgi:application", "--bind", "0.0.0.0:8000"]
