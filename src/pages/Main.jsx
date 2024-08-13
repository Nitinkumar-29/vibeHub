import React, { useContext, useEffect } from "react";
import { FaHome, FaPlusCircle, FaUser } from "react-icons/fa";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { MdOutlineExplore } from "react-icons/md";
import ThemeContext from "../context/Theme/ThemeContext";
import "../styles/overflow_scroll.css";
import { AiFillMessage } from "react-icons/ai";
import { AuthContext } from "../context/AuthContext";
import ChatContext from "../context/ChatContext/ChatContext";
import { BsDot } from "react-icons/bs";

const Main = () => {
  const location = useLocation();
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { userId } = useParams();
  const currentUser = localStorage.getItem("currentUser");
  const { currentUserData } = useContext(AuthContext);
  const { messageRequestChats } = useContext(ChatContext);

  useEffect(() => {
    if (
      location.pathname === "/userProfile" ||
      location.pathname === "/userProfile/"
    ) {
      navigate("/userProfile/yourPosts");
    }
    // eslint-disable-next-line
  }, [location.pathname === "/userProfile"]);

  return (
    <div
      className={`relative w-full max-w-[430px] h-screen ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      } backdrop-blur-3xl `}
    >
      <div
        className={`w-full h-full overflow-y-auto hideScrollbar
        `}
      >
        <Outlet />
      </div>
      {!(
        location.pathname === "/userChats/" ||
        location.pathname === "/userChats" ||
        location.pathname === `/chat/${userId}/messages`
      ) && (
        <div
          className={`flex z-10 fixed bottom-0 ${
            location.pathname === "/userChats/" ||
            location.pathname === "/userChats" ||
            location.pathname === `/userChats/${userId}/messages`
              ? "hidden"
              : "flex"
          } justify-between items-center p-4 w-full max-w-[430px] ${
            theme === "dark" ? "bg-black" : "bg-white"
          } bg-opacity-80 backdrop-blur-3xl border-gray-900 border-t-[.5px]`}
        >
          <Link className="flex flex-col items-center" to="/">
            <FaHome
              onClick={() => {
                if (location.pathname === "/") {
                  window.scrollTo(0, 0);
                }
              }}
              size={25}
            />
          </Link>
          <Link
            to="/explore"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <MdOutlineExplore size={28} />
          </Link>
          <Link
            to="/createPost"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <FaPlusCircle size={25} />
          </Link>
          <Link
            className="relative"
            to={`/user/${currentUser}/chats`}
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <AiFillMessage size={25} />
            {messageRequestChats.length > 0 && (
              <span className="text-red-600 absolute -top-1 left-4 font-medium">
                <BsDot size={20} />
              </span>
            )}
          </Link>
          <Link
            to="/userProfile/yourPosts"
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            {currentUserData?.img ? (
              <img
                src={currentUserData?.img}
                className="h-7 w-7 rounded-full object-cover"
                alt=""
              />
            ) : (
              <FaUser size={25} />
            )}
          </Link>
        </div>
      )}
    </div>
  );
};

export default Main;
