FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY main.py rag_pipeline.py knowledge_base.py knowledge_builder.py vector_store.py memory_store.py /app/
RUN mkdir -p /app/knowledge_base /app/vector_store /app/memory_store

EXPOSE 11434

CMD ["python", "main.py"]
