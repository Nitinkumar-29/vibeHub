import React, { useContext, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { TfiLayoutListPost } from "react-icons/tfi";
import PostContext from "../context/PostContext/PostContext";
import ThemeContext from "../context/Theme/ThemeContext";
import {
  IoArchive,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoSaveSharp,
} from "react-icons/io5";
import { BsHeartFill, BsPencilFill } from "react-icons/bs";
import { FiSettings } from "react-icons/fi";
import { MdArrowBackIos } from "react-icons/md";
import { AuthContext } from "../context/AuthContext";
import { HighLightLinks } from "../utils/HighlightLinks";
import { FaUser } from "react-icons/fa";

const UserProfile = () => {
  const currentUser = localStorage.getItem("currentUser");
  const { currentUserData } = useContext(AuthContext);

  const navigate = useNavigate();
  const {
    handleFetchUserPosts,
    handleFetchLikedPosts,
    handleFetchSavedPosts,
    userPosts,
  } = useContext(PostContext);
  const location = useLocation();
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    handleFetchUserPosts();
    handleFetchLikedPosts();
    handleFetchSavedPosts();
    // eslint-disable-next-line
  }, [currentUser]);

  return (
    <div
      className={`flex flex-col items-center space-y-6 h-full overflow-auto hideScrollbar w-full`}
    >
      <div
        className={`z-20 sticky top-0 right-0 flex items-center py-2 justify-between w-full px-4 bg-inherit ${
          theme === "dark"
            ? "bg-zinc-black text-zinc-100"
            : "bg-zinc-100 text-black"
        } bg-opacity-50 backdrop-blur-3xl`}
      >
        <div className="flex space-x-2 items-center">
          <MdArrowBackIos
            onClick={() => {
              navigate(-1);
            }}
            size={20}
            className="cursor-pointer"
          />
          <div className={` `}>
            {currentUserData?.user_name && (
              <div className="flex items-center space-x-1">
                <span className={`text-xl font-semibold`}>
                  {currentUserData?.user_name}
                </span>
                {currentUserData?.accountType === "private" ? (
                  <IoLockClosedOutline />
                ) : (
                  <IoLockOpenOutline />
                )}
              </div>
            )}
          </div>
        </div>
        <Link
          to={`/userProfile/settings/edit`}
          onClick={() => {
            window.scrollTo(0, 0);
          }}
        >
          <FiSettings size={20} />
        </Link>
      </div>
      {currentUserData && (
        <div className="relative flex flex-col items-center justify-center h-fit space-y-1 w-full">
          <div className="flex items-start justify-between px-4 w-full">
            <div className="flex flex-col items-start space-y-1">
              {currentUserData?.img ? (
                <img
                  src={currentUserData?.img}
                  className="h-16 w-16 object-cover rounded-full duration-300"
                  alt=""
                />
              ) : (
                <FaUser size={64} className="rounded-full" />
              )}
            </div>
            <div className="flex justify-between">
              <div className="flex flex-col items-center">
                <span className="text-3xl">{userPosts?.length || 0}</span>
                <Link
                  to="/userProfile/yourPosts"
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Posts
                </Link>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl">
                  {currentUserData?.followers?.length || 0}
                </span>
                <Link
                  onClick={() => {}}
                  to={`/userProfile/${currentUser}/followers`}
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Followers
                </Link>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl">
                  {currentUserData?.following?.length || 0}
                </span>
                <Link
                  to={`/userProfile/${currentUser}/following`}
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Following
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start w-full space-y-2 px-4">
            <span>{currentUserData?.name}</span>

            <div
              className={`${
                theme === "dark" ? "text-zinc-400" : "text-zinc-600"
              }`}
              dangerouslySetInnerHTML={{
                __html: HighLightLinks(currentUserData?.bio || ""),
              }}
            ></div>
            <button
              className={`flex text-sm items-center space-x-2 border-[1px] w-fit px-3 py-2 rounded-md ${
                theme === "dark" ? "border-zinc-700" : "border-zinc-700"
              }`}
            >
              <BsPencilFill />
              <Link to="/userProfile/settings/edit">Edit Profile</Link>
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center w-full">
        {location.pathname === `/userProfile/yourPosts` ||
        location.pathname === `/userProfile/likedPosts` ||
        location.pathname === `/userProfile/archivedPosts` ||
        location.pathname === `/userProfile/savedPosts` ? (
          <div className="w-full flex justify-evenly border-y-[1px] border-gray-400">
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/yourPosts`}
                className={`${
                  location.pathname === "/userProfile/yourPosts"
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2  text-center`}
              >
                <TfiLayoutListPost size={25} />
              </Link>
            </span>
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/savedPosts`}
                className={`${
                  location.pathname === "/userProfile/savedPosts"
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2 text-center`}
              >
                <IoSaveSharp size={23} />
              </Link>
            </span>
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/likedPosts`}
                className={`${
                  location.pathname === "/userProfile/likedPosts"
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2 text-center`}
              >
                <BsHeartFill size={22} />
              </Link>
            </span>
            {userPosts?.filter((post) => post.archived === true).length > 0 && (
              <span className="w-full flex justify-center">
                <Link
                  to={`/userProfile/archivedPosts`}
                  className={`${
                    location.pathname === "/userProfile/archivedPosts"
                      ? `${theme === "dark" ? "text-white" : "text-black"}`
                      : "text-gray-400"
                  } p-2 text-center`}
                >
                  <IoArchive size={23} />
                </Link>
              </span>
            )}
          </div>
        ) : (
          <div className="w-full flex justify-evenly border-y-[1px] border-gray-400">
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/${currentUser}/followers`}
                className={`${
                  location.pathname === `/userProfile/${currentUser}/followers`
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2  text-center`}
              >
                Followers
              </Link>
            </span>
            <span className="w-full flex justify-center">
              <Link
                to={`/userProfile/${currentUser}/following`}
                className={`${
                  location.pathname === `/userProfile/${currentUser}/following`
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } p-2  text-center`}
              >
                Following
              </Link>
            </span>
          </div>
        )}
        <div className="w-full h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
