
# Ollama Service Deployment on Kubernetes

## Prerequisites

- Docker installed and running
- Minikube or a Kubernetes cluster set up
- kubectl installed and configured

## Steps

### 1. Dockerize the Ollama Service

Create a Dockerfile to containerize your Ollama service.

**Dockerfile:**

```Dockerfile
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
```

**app.py:**

```python
from ollama_python.endpoints import GenerateAPI

api = GenerateAPI(base_url="http://0.0.0.0:8000", model="mistral")

def generate_text_stream(prompt, options):
    for res in api.generate(prompt=prompt, options=options, format="json", stream=True):
        yield res.response

if __name__ == "__main__":
    prompt = "Hello World"
    options = {"num_tokens": 10}
    for generated_text in generate_text_stream(prompt, options):
        print(generated_text)
```

### 2. Build and Push Docker Image

Build the Docker image and push it to your Docker registry.

```bash
docker build -t ollama-api-i:latest .
docker tag ollama-api-i:latest <your-docker-registry>/ollama-api-i:latest
docker push <your-docker-registry>/ollama-api-i:latest
```

![Screenshot from 2024-07-21 18-28-05](https://github.com/user-attachments/assets/319937fa-84ef-4be5-b18e-38a151d6b9ad)


### 3. Create Kubernetes Deployment

**ollama-deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      containers:
      - name: ollama
        image: <your-docker-registry>/ollama-api-i:latest
        ports:
        - containerPort: 11434
```

Apply the deployment configuration:

```bash
kubectl apply -f ollama-deployment.yaml
```

### 4. Create Kubernetes Service

**ollama-service.yaml:**

For LoadBalancer:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ollama-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 11434
  selector:
    app: ollama
```

For NodePort:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ollama-service
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 11434
    nodePort: 30007  # Ensure this is within the NodePort range (30000-32767)
  selector:
    app: ollama
```

Apply the service configuration:

```bash
kubectl apply -f ollama-service.yaml
```

### 5. Expose the Service

#### If Using Minikube:

Run the Minikube tunnel to expose the LoadBalancer service externally:

```bash
minikube tunnel
```

### 6. Verify the Service

Check the status of the service and get the external IP:

```bash
kubectl get services
```

You should see something like this:

```plaintext
NAME             TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)        AGE
ollama-service   LoadBalancer   10.107.249.83   <pending>        80:31415/TCP   5m
```
![Screenshot from 2024-07-21 18-32-09](https://github.com/user-attachments/assets/aa2d614f-dda4-4960-8dd0-ad65b867767c)



For NodePort, access the service using the node's IP and the `nodePort`:

```http
http://<node-ip>:30007
```

![Screenshot from 2024-07-21 18-33-04](https://github.com/user-attachments/assets/47077cd0-ba91-4687-9a72-f50d8a1d12e2)


### 7. Set Up Horizontal Pod Autoscaler (HPA)

**ollama-hpa.yaml:**

```yaml
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: ollama-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ollama-deployment
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
```

Apply the HPA configuration:

```bash
kubectl apply -f ollama-hpa.yaml
```

### 8. Verify HPA

Check the status of the HPA:

```bash
kubectl get hpa
```

You should see something like this:






