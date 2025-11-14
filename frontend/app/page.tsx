"use client";

import { useState } from "react";

export default function HomePage() {
  const [files, setFiles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [manualClass, setManualClass] = useState("");
  const [predictions, setPredictions] = useState([]);

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    const res = await fetch("http://localhost:8000/upload/", { method: "POST", body: formData });
    console.log(await res.json());
  };

  const addClass = () => {
    if (manualClass && !classes.includes(manualClass)) {
      setClasses([...classes, manualClass]);
      setManualClass("");
    }
  };

  const manualLabel = async (filename, userClass) => {
    const formData = new FormData();
    formData.append("filename", filename);
    formData.append("user_class", userClass);
    await fetch("http://localhost:8000/label/", { method: "POST", body: formData });
  };

  const predictAll = async () => {
    const res = await fetch("http://localhost:8000/predict/");
    const data = await res.json();
    setPredictions(data.predictions || []);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Next-Level Image Labeling</h1>
      <input
        type="file"
        multiple
        onChange={(e) => setFiles([...e.target.files])}
        className="mb-2"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Upload
      </button>

      <div className="mb-4">
        <input
          value={manualClass}
          onChange={(e) => setManualClass(e.target.value)}
          placeholder="Add class"
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={addClass}
          className="ml-2 px-2 py-1 bg-green-500 text-white rounded"
        >
          Add
        </button>
        <div className="mt-2">
          {classes.map((c) => (
            <span
              key={c}
              className="mr-2 px-2 py-1 bg-gray-200 rounded inline-block"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Manual Labeling</h2>
        {files.map((f) => (
          <div key={f.name} className="mb-2">
            <span>{f.name}</span>
            {classes.map((c) => (
              <button
                key={c}
                onClick={() => manualLabel(f.name, c)}
                className="ml-2 px-2 py-1 bg-yellow-400 rounded"
              >
                {c}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={predictAll}
        className="bg-purple-600 text-white px-4 py-2 rounded mb-4"
      >
        Predict All
      </button>

      <div>
        {predictions.map((p) => (
          <div key={p.filename} className="mb-2 p-2 border rounded">
            <p>
              {p.filename} → {p.predicted_class}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
