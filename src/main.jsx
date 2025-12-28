import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Import API test utility for development

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
