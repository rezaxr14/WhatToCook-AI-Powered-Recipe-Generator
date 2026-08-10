FROM python:3.11-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY . .

RUN chmod +x entrypoint.sh || true

EXPOSE 8000

CMD ["sh", "-c", "pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py seed_recipes && python manage.py runserver 0.0.0.0:8000"]
