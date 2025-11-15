import UploadForm from "./components/UploadForm";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", padding: "2rem" }}>
      <UploadForm />
    </div>
  );
}
