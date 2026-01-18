FROM python:3.12-slim

WORKDIR /workspace

RUN apt-get update && apt-get install -y \
    gdal-bin libgdal-dev build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY . backend/

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
