import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    toast.success(newTheme === "light" ? "Light mode" : "Dark Mode");
  };

  const setLightTheme = () => {
    setTheme("light");
    localStorage.setItem("theme", "light");
    toast.success("Light mode");
  };

  const setDarkTheme = () => {
    setTheme("dark");
    localStorage.setItem("theme", "dark");
    toast.success("Dark mode");
  };

  const setSystemTheme = () => {
    localStorage.removeItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    setTheme(systemTheme);
    toast.success(systemTheme === "light" ? "Light mode" : "Dark Mode");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setLightTheme,
        setDarkTheme,
        setSystemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
