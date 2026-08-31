import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setBackendStatus(data.status);
      })
      .catch(() => {
        setBackendStatus("Disconnected");
      });
  }, []);

  return (
    <div>
      <h1>SIH26101</h1>
      <h2>AI Skill Intelligence Platform</h2>

      <p>
        Backend Status:{" "}
        <strong>
          {backendStatus === "healthy"
            ? "Connected"
            : backendStatus}
        </strong>
      </p>
    </div>
  );
}

export default App;