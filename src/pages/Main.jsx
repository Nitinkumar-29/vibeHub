import React, { useContext, useEffect } from "react";
import { FaBell, FaHome, FaPlusCircle, FaUser } from "react-icons/fa";
import {
  Link,
  Outlet,
  redirect,
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
      className={`flex justify-center w-screen ${
        theme === "dark" ? "bg-black text-zinc-200" : "bg-zinc-100 text-black"
      }`}
    >
      <div
        className={`relative flex flex-col xs:flex-row-reverse md:justify-center w-full lg:w-fit h-screen ${
          theme === "dark" ? "bg-black text-zinc-200" : "bg-zinc-100 text-black"
        }`}
      >
        <div
          className={`w-full md:w-[490px] lg:w-[500px] h-[100vh] overflow-y-auto hideScrollbar pb-12 xs:pb-0 xs:border-l-[1px] lg:border-r-[1px] xs:border-zinc-600
        `}
        >
          <Outlet />
        </div>
        <div className="flex justify-between xs:flex-col xs:items-start xs:justify-center w-full xs:w-fit">
          <div className="hidden xs:flex space-x-3 items-center text-2xl mt-10 px-6">
            <img
              src={`/images/logo.png`}
              className="h-8 w-8 rounded-md"
              alt=""
            />
            <span
              style={{ fontFamily: "sans-serif" }}
              className={`hidden sm:flex font-bold bg-clip-text text-transparent bg-gradient-to-tr from-red-600 via-blue-600 to-indigo-600`}
            >
              Vibehub
            </span>
          </div>
          <div
            className={`flex xs:flex-col ${
              location.pathname === `/chat/${userId}/messages`
                ? "hidden xs:flex"
                : ""
            } z-10 fixed xs:static bottom-0 xs:bottom-auto ${
              location.pathname === "/userChats/" ||
              location.pathname === "/userChats" ||
              location.pathname === `/userChats/${userId}/messages`
                ? "hidden"
                : "flex"
            } justify-between xs:m-auto items-center sm:items-start py-4 xs:p-4 w-full xs:w-fit sm:w-56 lg:w-60 xs:h-96 ${
              theme === "dark" ? "bg-black" : "bg-zinc-100"
            } bg-opacity-70 backdrop-blur-3xl ${
              theme === "dark" ? "border-gray-900" : "border-zinc-400"
            } border-t-[.5px] xs:border-t-0 text-zinc-400`}
          >
            <Link
              className={`flex w-full flex-col sm:flex-row sm:justify-start p-2 sm:space-x-2 items-center ${
                location.pathname === "/"
                  ? "text-zinc-100 xs:bg-zinc-900 rounded-md"
                  : ""
              }`}
              to="/"
            >
              <FaHome
                onClick={() => {
                  if (location.pathname === "/") {
                    window.scrollTo(0, 0);
                  }
                }}
                size={25}
              />
              <span className="hidden sm:flex">Home</span>
            </Link>
            <Link
              className={`flex w-full flex-col sm:flex-row sm:justify-start p-2 sm:space-x-2 items-center ${
                location.pathname === "/explore"
                  ? "text-zinc-100 xs:bg-zinc-900 rounded-md"
                  : ""
              }`}
              to="/explore"
              onClick={() => {
                window.scrollTo(0, 0);
              }}
            >
              <MdOutlineExplore size={28} />
              <span className="hidden sm:flex">Explore</span>
            </Link>
            <Link
              className={`flex w-full flex-col sm:flex-row sm:justify-start p-2 sm:space-x-2 items-center ${
                location.pathname === "/createPost"
                  ? "text-zinc-100 xs:bg-zinc-900 rounded-md"
                  : ""
              }`}
              to="/createPost"
              onClick={() => {
                window.scrollTo(0, 0);
              }}
            >
              <FaPlusCircle size={25} />
              <span className="hidden sm:flex">Post</span>
            </Link>
            <Link
              className={`flex w-full flex-col sm:flex-row sm:justify-start p-2 sm:space-x-2 items-center ${
                location.pathname === "/chats"
                  ? "text-zinc-100 xs:bg-zinc-900 rounded-md"
                  : ""
              }`}
              to={`/chats`}
              onClick={() => {
                window.scrollTo(0, 0);
              }}
            >
              <div className="relative">
                <AiFillMessage size={25} />
                {messageRequestChats.length > 0 && (
                  <span className="text-red-600 absolute -top-1 left-4 font-medium">
                    <BsDot size={20} />
                  </span>
                )}
              </div>
              <span className="hidden sm:flex">Chats</span>
            </Link>
            <Link
              className={`hidden xs:flex w-full flex-col sm:flex-row sm:justify-start p-2 sm:space-x-2 items-center ${
                location.pathname === "/notifications"
                  ? "text-zinc-100 xs:bg-zinc-900 rounded-md"
                  : ""
              }`}
              to={`/notifications`}
            >
              <FaBell
                onClick={() => {
                  if (location.pathname === `/notifications`) {
                    window.scrollTo(0, 0);
                  }
                }}
                size={25}
              />
              <span className="hidden sm:flex">Notifications</span>
            </Link>
            <Link
              className={`flex w-full flex-col sm:flex-row sm:justify-start p-2 sm:space-x-2 items-center ${
                location.pathname === "/userProfile/yourPosts"
                  ? "text-zinc-100 xs:bg-zinc-900 rounded-md"
                  : ""
              }`}
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
              <span className="hidden sm:flex">
                {currentUserData.user_name}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
