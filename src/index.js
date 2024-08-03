import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthContextProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/Theme/ThemeContext";
import { ChatProvider } from "./context/ChatContext/ChatContext";
import { PostProvider } from "./context/PostContext/PostContext";
import { Router } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
