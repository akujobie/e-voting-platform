import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Import Bootstrap & your custom styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css"; // adjust path if needed

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
