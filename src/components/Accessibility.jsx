import React, { useContext } from "react";
import { CgDarkMode, CgLogOut } from "react-icons/cg";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import ThemeContext from "../context/Theme/ThemeContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const Accessibility = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  return (
    <div className="flex space-x-3 justify-start w-full">
      <button
        className="border-[1px] border-zinc-600 rounded-md p-2"
        onClick={() => toggleTheme()}
      >
        {theme === "dark" ? (
          <MdLightMode size={20} />
        ) : (
          <MdDarkMode size={20} />
        )}
      </button>
      <button
        className="border-[1px] border-zinc-600 rounded-md p-2"
        onClick={() => {
          signOut(auth)
            .then(() => {
              localStorage.removeItem("currentUser");
              navigate("/login");
            })
            .catch((error) => {
              console.log(error);
            });
        }}
      >
        <CgLogOut size={20} />
      </button>
    </div>
  );
};

export default Accessibility;
