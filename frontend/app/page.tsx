"use client";

import { useState, useRef } from "react";
import axios from "axios";
import Image from "next/image";

type Rect = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type Label = {
  label: string;
  rect: Rect;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [rect, setRect] = useState<Rect | null>(null);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
      setSelectedFile(URL.createObjectURL(fileArray[0]));
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    try {
      const res = await axios.post("http://localhost:8000/upload/", formData);
      setUploadedFiles(res.data.files); // store filenames returned by backend
      alert("Uploaded successfully!");
    } catch (err: any) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Upload failed. Check console for details.");
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!canvasRef.current) return;
    const rectBox = canvasRef.current.getBoundingClientRect();
    setRect({ x1: e.clientX - rectBox.left, y1: e.clientY - rectBox.top, x2: 0, y2: 0 });
    setDrawing(true);
  };

  const endDrawing = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!drawing || !rect || !canvasRef.current) return;
    const rectBox = canvasRef.current.getBoundingClientRect();
    setRect((prev) =>
      prev ? { ...prev, x2: e.clientX - rectBox.left, y2: e.clientY - rectBox.top } : null
    );
    setDrawing(false);
  };

  const handleLabelSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rect || files.length === 0 || uploadedFiles.length === 0) {
      alert("Please upload the image first.");
      return;
    }

    const form = e.currentTarget;
    const input = form.querySelector<HTMLInputElement>("input[name='label']");
    if (!input) return;

    const labelText = input.value;
    const filename = uploadedFiles[0]; // use the uploaded filename

    const formData = new FormData();
    formData.append("filename", filename);
    formData.append("user_class", labelText);
    formData.append("x1", Math.round(rect.x1).toString());
    formData.append("y1", Math.round(rect.y1).toString());
    formData.append("x2", Math.round(rect.x2).toString());
    formData.append("y2", Math.round(rect.y2).toString());

    try {
      const res = await axios.post("http://localhost:8000/label/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Label response:", res.data);

      setLabels([...labels, { label: labelText, rect }]);
      setRect(null);
      input.value = "";
    } catch (err: any) {
      console.error("Label submission failed:", err.response?.data || err.message);
      alert("Label submission failed. Check console for details.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Image Labeling Dashboard</h1>

      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={uploadFiles} style={{ marginLeft: "10px" }}>
        Upload
      </button>

      {selectedFile && (
        <div
          ref={canvasRef}
          style={{ position: "relative", display: "inline-block", marginTop: "20px" }}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
        >
          <Image
            src={selectedFile}
            alt="to label"
            width={600}
            height={400}
            style={{ objectFit: "contain" }}
          />
          {rect && (
            <div
              style={{
                position: "absolute",
                border: "2px solid red",
                left: rect.x1,
                top: rect.y1,
                width: rect.x2 - rect.x1,
                height: rect.y2 - rect.y1,
              }}
            />
          )}
          {labels.map((l, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                border: "2px solid green",
                left: l.rect.x1,
                top: l.rect.y1,
                width: l.rect.x2 - l.rect.x1,
                height: l.rect.y2 - l.rect.y1,
              }}
            >
              <span
                style={{
                  backgroundColor: "green",
                  color: "white",
                  fontSize: "12px",
                  position: "absolute",
                  top: -20,
                  left: 0,
                  padding: "1px 4px",
                }}
              >
                {l.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {rect && uploadedFiles.length > 0 && (
        <form onSubmit={handleLabelSubmit} style={{ marginTop: "10px" }}>
          <input type="text" name="label" placeholder="Enter label" required />
          <button type="submit">Save Label</button>
        </form>
      )}

      <h2>Labels:</h2>
      <ul>
        {labels.map((l, i) => (
          <li key={i}>
            {l.label} - {JSON.stringify(l.rect)}
          </li>
        ))}
      </ul>
    </div>
  );
}
