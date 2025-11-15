import UploadForm from "./components/UploadForm";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", padding: "2rem", gap: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "600", textAlign: "center" }}>Interpretable multimodal embeddings</h1>
      <p style={{ fontSize: "1rem", color: "#555", textAlign: "center", maxWidth: "600px" }}>
        Connecting pixels and words through multimodal embeddings
      </p>
      <UploadForm />
    </div>
  );
}
