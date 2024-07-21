
FROM python:3.9-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y python3-pip && rm -rf /var/lib/apt/lists/*
RUN pip3 install ollama-python

FROM ollama/ollama:latest
WORKDIR /app

COPY --from=base /usr/local /usr/local
COPY --from=base /etc /etc
COPY --from=base /app .

COPY app.py .

EXPOSE 11434



