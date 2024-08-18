import { collection, getDocs } from "firebase/firestore";
import React, { useContext, useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { FaUserAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import PostContext from "../context/PostContext/PostContext";
import { GiSpinningSword } from "react-icons/gi";
import ThemeContext from "../context/Theme/ThemeContext";
import "../styles/overflow_scroll.css";
import { CgClose, CgSpinner } from "react-icons/cg";

const Explore = () => {
  const [allUsers, setAllUsers] = useState([]);
  const { explorePosts, fetchExploreAllPosts } = useContext(PostContext);
  const currentUser = localStorage.getItem("currentUser");
  const { theme } = useContext(ThemeContext);
  const [query, setQuery] = useState(" ");
  const searchInputRef = useRef(null);

  const keys = ["name", "user_name"];
  const handleFetchUsersData = async () => {
    try {
      const queryUsersData = await getDocs(collection(db, "users"));
      const allUsersData = [];

      queryUsersData.forEach((dataDoc) => {
        const userData = dataDoc.data();
        const userId = dataDoc.id;
        allUsersData.push({ id: userId, ...userData });
      });

      setAllUsers(allUsersData);
      return allUsersData;
    } catch (error) {
      console.error("Error fetching users data: ", error);
      return [];
    }
  };

  const focusSearchInput = () => {
    searchInputRef.current.focus();
  };

  // Event listener to trigger focus on "/" key press
  const handleKeyPress = (e) => {
    if (e.key === "/" || (e.ctrlKey && e.key === "k")) {
      e.preventDefault();
      focusSearchInput();
    }
  };

  const componentRef = useRef(null);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    handleFetchUsersData();
  }, []);

  useEffect(() => {
    fetchExploreAllPosts();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      {allUsers && explorePosts.length > 0 ? (
        <div
          className={`relative w-full bg-inherit pb-6 min-h-[92vh] overflow-y-auto hideScrollbar`}
        >
          <div
            ref={componentRef}
            className={`${
              theme === "dark" ? "bg-zinc-900" : "bg-zinc-200"
            } flex justify-between items-center w-[95%] rounded-md max-w-[430px] my-4 p-2 mx-2`}
          >
            <input
              onClickCapture={() => {}}
              type="text"
              ref={searchInputRef}
              className={`bg-inherit w-[95%] p-1 outline-none rounded-md ${
                theme === "dark"
                  ? "focus:placeholder:text-zinc-300"
                  : "focus:placeholder:text-zinc-900"
              }`}
              placeholder="Search @username, name.... with '/ '"
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
            {query.trim().length > 0 && (
              <CgClose
                className="cursor-pointer"
                onClick={() => {
                  searchInputRef.current.value = "";
                  setQuery("");
                }}
              />
            )}
          </div>
          {query.trim(" ").length > 0 && (
            <div className="flex flex-col px-4 space-y-3">
              {query.trim().length > 0 &&
                allUsers.filter((user) =>
                  keys?.some((key) =>
                    user[key]
                      ?.toLowerCase()
                      ?.includes(query.trim().toLowerCase())
                  )
                ).length > 0 ? <span>Users</span>:<span>No user found with search query "{query}"</span>}
              {query.length > 0 &&
                allUsers
                  ?.filter((user) =>
                    keys?.some((key) =>
                      user[key]
                        ?.toLowerCase()
                        ?.includes(query.trim().toLowerCase())
                    )
                  )
                  .sort((a, b) => b.timeStamp - a.timeStamp)
                  ?.map((user) => {
                    return (
                      <Link
                        key={user.id}
                        onClick={() => {
                          window.scrollTo(0, 0);
                        }}
                        to={
                          currentUser && currentUser !== user?.id
                            ? `/users/${user?.id}/profile`
                            : `/userProfile/yourPosts`
                        }
                      >
                        <div className="flex w-fit items-center space-x-2">
                          {user.img ? (
                            <img
                              src={user.img}
                              className="w-12 h-12 border-[1px] border-black object-cover rounded-full"
                              alt=""
                            />
                          ) : (
                            <FaUserAlt
                              size={50}
                              className="border-[1px] border-black rounded-full object-cover"
                            />
                          )}
                          <div className="flex flex-col -space-y-1 h-fit items-start justify-center">
                            <span className="w-full">{user?.user_name}</span>
                            <span className=" text-gray-500 w-full">
                              {user?.name}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
            </div>
          )}
          {query.trim(" ").length < 1 && (
            <div className="grid grid-cols-3 gap-[.125rem]">
              {explorePosts
                ?.filter(
                  (post) =>
                    post.fileURLs.length > 0 &&
                    post.userData.accountType !== "private"
                )
                .sort((a, b) => b.timeStamp - a.timeStamp)
                .map((post) => {
                  return (
                    <Link
                      className="flex flex-col w-full space-y-2"
                      key={post.id}
                      to={`/posts/${post.id}`}
                    >
                      {post?.fileURLs && post?.fileURLs.length > 0 && (
                        <div key={post.id}>
                          {post?.fileURLs[0].includes(".mp4") ? (
                            <video className="h-40 w-40 object-cover rounded-[1px]">
                              <source src={post.fileURLs[0]} type="video/mp4" />
                            </video>
                          ) : (
                            <img
                              src={post?.fileURLs[0] || "/images/logo.png"}
                              alt="post media"
                              className={`h-36 w-40 object-cover rounded-sm transform duration-200 ${
                                post?.fileURLs[0] ? "opacity-100" : "opacity-0"
                              }`}
                            />
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })
                .slice(0, 50)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-screen">
          <CgSpinner size={40} className="animate-spin" />
        </div>
      )}
    </>
  );
};

export default Explore;
