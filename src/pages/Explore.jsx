import { collection, getDocs } from "firebase/firestore";
import React, { useContext, useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { FaUser, FaUserAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import PostContext from "../context/PostContext/PostContext";
import { GiSpinningSword } from "react-icons/gi";
import ThemeContext from "../context/Theme/ThemeContext";

const Explore = () => {
  const [allUsers, setAllUsers] = useState([]);
  const { posts, fetchAllPosts } = useContext(PostContext);
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

      console.log(allUsersData);
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

  const [isSticky, setIsSticky] = useState(false);
  const componentRef = useRef(null);

  const handleScroll = () => {
    if (componentRef.current) {
      // Get the position of the component relative to the viewport
      const rect = componentRef.current.getBoundingClientRect();
      // Check if the component is at the top of the viewport
      if (rect.top <= 0) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // const highlightText = (text, highlight) => {
  //   if (!highlight) return text;
  //   const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  //   return (
  //     <span>
  //       {parts.map((part, index) =>
  //         part.toLowerCase() === highlight.toLowerCase() ? (
  //           <span key={index} className="bg-gray-600 ">
  //             {part}
  //           </span>
  //         ) : (
  //           part
  //         )
  //       )}
  //     </span>
  //   );
  // };
  useEffect(() => {
    handleFetchUsersData();
  }, []);

  return (
    <>
      {allUsers && posts ? (
        <div
          className={`relative w-full bg-inherit  space-y-2 pb-20 min-h-[95vh]`}
        >
          <div
            ref={componentRef}
            className={`${
              isSticky ? "sticky top-0 " : "static"
            }  flex justify-between items-center w-full max-w-[430px] h-12 border-y-[1px] border-gray-400`}
          >
            <input
              onClickCapture={() => {}}
              type="text"
              ref={searchInputRef}
              className="bg-inherit w-full focus:outline-none placeholder:text-zinc-500 focus:placeholder:text-zinc-300 px-4 py-2"
              placeholder="Search @username, name...."
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
            <div
              className={`text-base absolute right-4 space-x-1 flex items-center w-fit`}
            >
              <span
                className={`${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                } px-3 py-1 rounded-md`}
              >
                Ctrl
              </span>{" "}
              <span
                className={`${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                } px-3 py-1 rounded-md`}
              >
                K
              </span>
            </div>
          </div>
          {query.length > 1 && (
            <div className="flex flex-col px-2 space-y-3 pb-2">
              {query.length > 0 &&
                allUsers
                  ?.filter((user) =>
                    keys?.some((key) =>
                      user[key]
                        ?.toLowerCase()
                        ?.includes(query.trim().toLowerCase())
                    )
                  )
                  ?.map((user) => {
                    return (
                      <Link
                        key={user.id}
                        to={`/users/${user?.user_name}/profile`}
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
                            <span className="w-full">
                              {/* {highlightText(user?.user_name, query)} */}
                              {user?.user_name}
                            </span>
                            <span className=" text-gray-500 w-full">
                              {/* {highlightText(user?.name, query)} */}
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
            <div className="grid grid-cols-3 gap-1 px-2">
              {posts
                ?.filter((post) =>
                  keys?.some((key) =>
                    post?.userData[key]
                      ?.toLowerCase()
                      ?.includes(query?.trim()?.toLowerCase())
                  )
                )
                .map((post) => {
                  return (
                    <Link
                      className="flex flex-col w-full space-y-2"
                      key={post.id}
                      to={`/posts/${post.id}`}
                    >
                      {post?.fileURLs && post?.fileURLs.length > 0 && (
                        <div key={post.id}>
                          {post?.fileURLs[0].endsWith(".mp4") ? (
                            <video
                              controls
                              className="h-full w-full object-cover rounded-sm border-[1px] border-blue-950"
                            >
                              <source src={post.fileURLs[0]} type="video/mp4" />
                            </video>
                          ) : (
                            <img
                              src={post?.fileURLs[0]}
                              alt="post media"
                              className="h-40 w-40 object-cover rounded-sm border-[1px] border-blue-950"
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
        <div className="max-h-screen">
          <GiSpinningSword className="text-red-600 h-50 w-50 animate-spin" />
        </div>
      )}
    </>
  );
};

export default Explore;
