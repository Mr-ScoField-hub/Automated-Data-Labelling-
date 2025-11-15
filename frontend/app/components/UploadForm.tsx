"use client";

import { useState, useRef, useEffect } from "react";
import "./UploadForm.css";
import { FiUpload } from "react-icons/fi";

export default function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [matrix, setMatrix] = useState<number[] | null>(null);
    const [loading, setLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !caption) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("http://localhost:8000/upload/", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.status !== "success") {
            setLoading(false);
            return;
        }

        const embedForm = new FormData();
        embedForm.append("filename", file.name);
        embedForm.append("caption", caption);

        const embedRes = await fetch("http://localhost:8000/embed/", { method: "POST", body: embedForm });
        const embedData = await embedRes.json();
        setMatrix(embedData.matrix);

        setLoading(false);
    };

    useEffect(() => {
        if (!matrix || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const flat = matrix;
        const side = Math.ceil(Math.sqrt(flat.length));
        const padded = new Array(side * side).fill(0);
        for (let i = 0; i < flat.length; i++) padded[i] = flat[i];

        canvas.width = side;
        canvas.height = side;

        const imageData = ctx.createImageData(side, side);

        // Compute min and max for normalization
        const min = Math.min(...padded);
        const max = Math.max(...padded);

        for (let y = 0; y < side; y++) {
            for (let x = 0; x < side; x++) {
                const val = padded[y * side + x];
                const norm = (val - min) / (max - min + 1e-8); // normalized 0-1

                // Gradient: blue (low) → white (mid) → red (high)
                let r = 0, g = 0, b = 0;
                if (norm < 0.5) {
                    r = Math.floor(norm * 2 * 255);
                    g = Math.floor(norm * 2 * 255);
                    b = 255;
                } else {
                    r = 255;
                    g = Math.floor((1 - (norm - 0.5) * 2) * 255);
                    b = Math.floor((1 - (norm - 0.5) * 2) * 255);
                }

                const idx = (y * side + x) * 4;
                imageData.data[idx] = r;
                imageData.data[idx + 1] = g;
                imageData.data[idx + 2] = b;
                imageData.data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        ctx.imageSmoothingEnabled = true; // smooth gradient
    }, [matrix]);

    const handleCopy = () => {
        if (!matrix) return;
        navigator.clipboard.writeText(JSON.stringify(matrix, null, 2));
        alert("Matrix copied to clipboard!");
    };

    const handleDownload = () => {
        if (!matrix) return;
        const blob = new Blob([JSON.stringify(matrix, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "embedding_matrix.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="upload-container">
            <form onSubmit={handleSubmit} className="upload-form">
                <label className="file-label">
                    <FiUpload size={36} />
                    <span className="file-text">Drag image here or click to select</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>
                <input
                    type="text"
                    placeholder="Describe the image content"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="caption-input"
                />
                <button type="submit" disabled={loading} className="submit-button">
                    {loading ? <span className="spinner"></span> : "Process"}
                </button>
            </form>

            {matrix && (
                <div className="result-area">
                    <h2>Step 1 – Embedding Output</h2>
                    <div className="matrix-display">
                        <canvas ref={canvasRef} className="matrix-canvas"></canvas>
                        <pre className="matrix-values">{JSON.stringify(matrix, null, 2)}</pre>
                    </div>
                    <div className="result-actions">
                        <button onClick={handleCopy} className="action-button">Copy Matrix</button>
                        <button onClick={handleDownload} className="action-button">Download Matrix</button>
                    </div>
                </div>
            )}
        </div>
    );
}
