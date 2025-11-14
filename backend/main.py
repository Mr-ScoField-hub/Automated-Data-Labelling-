from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import os
import torch
import numpy as np
from torchvision import models, transforms
from sklearn.neighbors import KNeighborsClassifier

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


device = "cuda" if torch.cuda.is_available() else "cpu"
from torchvision.models import resnet50, ResNet50_Weights
weights = ResNet50_Weights.DEFAULT
resnet = resnet50(weights=weights).to(device)
resnet.eval()

feature_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225])
])

# Few-shot classifier storage
knn = None
labeled_features = []
labeled_classes = []

class Prediction(BaseModel):
    filename: str
    predicted_class: str

def extract_features(img: Image.Image):
    x = feature_transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        feat = resnet(x)
    return feat.cpu().numpy().flatten()

@app.post("/upload/")
async def upload_images(files: list[UploadFile] = File(...)):
    saved_files = []
    for file in files:
        path = os.path.join(UPLOAD_DIR, file.filename)
        with open(path, "wb") as f:
            f.write(await file.read())
        saved_files.append(file.filename)
    return {"status": "success", "files": saved_files}

@app.post("/label/")
async def label_image(
    filename: str = Form(...),
    user_class: str = Form(...),
    x1: int = Form(...),
    y1: int = Form(...),
    x2: int = Form(...),
    y2: int = Form(...)
):
    global labeled_features, labeled_classes, knn
    path = os.path.join(UPLOAD_DIR, filename)
    img = Image.open(path).convert("RGB")
    cropped = img.crop((x1, y1, x2, y2))
    feat = extract_features(cropped)
    labeled_features.append(feat)
    labeled_classes.append(user_class)
    # Train KNN if more than one class
    if len(set(labeled_classes)) > 1:
        knn = KNeighborsClassifier(n_neighbors=3)
        knn.fit(np.array(labeled_features), labeled_classes)
    return {"status": "success", "class": user_class}

@app.get("/predict/")
async def predict():
    predictions = []
    if knn is None:
        return {"status": "waiting for labeled examples"}
    for file in os.listdir(UPLOAD_DIR):
        path = os.path.join(UPLOAD_DIR, file)
        img = Image.open(path).convert("RGB")
        feat = extract_features(img)
        pred_class = knn.predict([feat])[0]
        predictions.append(Prediction(filename=file, predicted_class=pred_class))
    return {"predictions": predictions}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
