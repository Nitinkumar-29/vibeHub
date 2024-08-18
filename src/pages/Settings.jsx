import React, { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import ThemeContext from "../context/Theme/ThemeContext";
import { MdArrowBackIos } from "react-icons/md";

const Settings = () => {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [settingsActiveTab, setSettingsActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("settingsActiveTab");
    return savedTab || "edit";
  });

  useEffect(() => {
    if (location.pathname === "/userProfile/settings/edit") {
      setSettingsActiveTab("edit");
    }
  }, [location.pathname]);
  
  useEffect(() => {
    localStorage.setItem("settingsActiveTab", settingsActiveTab);
  }, [settingsActiveTab]);

  return (
    <div className={`min-h-[91.5vh] bg-inherit w-full`}>
      <div className="flex flex-col space-y-6 w-full items-center p-2">
        <div className="flex space-x-3 items-center w-full p-2">
          <MdArrowBackIos
            size={20}
            className="cursor-pointer"
            onClick={() => {
              navigate(-1);
              window.scrollTo(0, 0);
            }}
          />
          <span>Settings</span>
        </div>
        <div className={`flex flex-col space-y-2 w-full rounded-md `}>
          <div className="flex w-full items-center justify-between space-x-2">
            <Link
              to="/userProfile/settings/edit"
              onClick={() => {
                setSettingsActiveTab("edit");
              }}
              className={`${
                theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
              } rounded-md px-4 py-1 space-x-2 w-full ${
                settingsActiveTab === "edit"
                  ? "text-red-600"
                  : `${theme === "dark" ? "text-zinc-400" : "text-zinc-900"}`
              }`}
            >
              Edit Profile
            </Link>
            <Link
              to="/userProfile/settings/account"
              onClick={() => {
                setSettingsActiveTab("account");
              }}
              className={`${
                theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
              } rounded-md px-4 py-1 space-x-2 w-full ${
                settingsActiveTab === "account"
                  ? "text-red-600"
                  : `${theme === "dark" ? "text-zinc-400" : "text-zinc-900"}`
              }`}
            >
              Account
            </Link>
            <Link
              to="/userProfile/settings/accessibility"
              onClick={() => {
                setSettingsActiveTab("more");
              }}
              className={`${
                theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
              } rounded-md px-4 py-1 space-x-2 w-full ${
                settingsActiveTab === "more"
                  ? "text-red-600"
                  : `${theme === "dark" ? "text-zinc-400" : "text-zinc-900"}`
              }`}
            >
              Accessibility
            </Link>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default Settings;
