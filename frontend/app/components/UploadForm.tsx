"use client";

import { useState } from "react";
import { FiUpload } from "react-icons/fi";
import "./UploadForm.css";

export default function UploadForm() {
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [matrix, setMatrix] = useState<number[][] | null>(null);
    const [loading, setLoading] = useState(false);
    const [hoverVal, setHoverVal] = useState<number | null>(null);

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

        const flat = embedData.matrix[0];
        const size = Math.ceil(Math.sqrt(flat.length));
        const reshaped: number[][] = [];
        for (let i = 0; i < size; i++) {
            const row = flat.slice(i * size, (i + 1) * size);
            while (row.length < size) row.push(0);
            reshaped.push(row);
        }

        setMatrix(reshaped);
        setLoading(false);
    };

    const handleCopy = () => {
        if (!matrix) return;
        navigator.clipboard.writeText(JSON.stringify(matrix, null, 2));
        alert("Matrix copied!");
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

    const getColor = (val: number) => {
        const r = Math.floor((val + 1) / 2 * 255);
        const g = Math.floor((1 - Math.abs(val)) * 255);
        const b = Math.floor((1 - val) / 2 * 255);
        return `rgb(${r},${g},${b})`;
    };

    return (
        <div className="upload-form">
            <form onSubmit={handleSubmit}>
                <label className="file-label">
                    <FiUpload size={40} className="mb-2 text-gray-500" />
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
                    {loading ? "Processing..." : "Run Embedding"}
                </button>
            </form>

            {matrix && (
                <div className="result-area">
                    <h2>Embedding Visualization</h2>
                    <div className="matrix-display">
                        <div className="matrix-grid">
                            {matrix.map((row, i) => (
                                <div key={i} className="matrix-row">
                                    {row.map((val, j) => (
                                        <div
                                            key={j}
                                            className="matrix-cell"
                                            style={{ backgroundColor: getColor(val) }}
                                            onMouseEnter={() => setHoverVal(val)}
                                            onMouseLeave={() => setHoverVal(null)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="matrix-info">
                            {hoverVal !== null && <p>Value: {hoverVal.toFixed(4)}</p>}
                            <div className="matrix-actions">
                                <button onClick={handleCopy} className="action-button">Copy Matrix</button>
                                <button onClick={handleDownload} className="action-button">Download Matrix</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
