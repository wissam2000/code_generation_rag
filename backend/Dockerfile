# /backend/Dockerfile
FROM python:3.10
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy your application code
COPY app/ ./

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8888", "--reload"]
