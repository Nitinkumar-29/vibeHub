import { collection, getDocs } from "firebase/firestore";
import React, { useContext, useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { FaUser, FaUserAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import PostContext from "../context/PostContext/PostContext";
import { GiSpinningSword } from "react-icons/gi";
import ThemeContext from "../context/Theme/ThemeContext";
import "../styles/overflow_scroll.css";

const Explore = () => {
  const [allUsers, setAllUsers] = useState([]);
  const { explorePosts, fetchExploreAllPosts, currentUser } =
    useContext(PostContext);
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

  useEffect(() => {
    fetchExploreAllPosts();
    // eslint-disable-next-line
  }, []);

  return (
    <>
      {allUsers && explorePosts ? (
        <div
          className={`relative w-full bg-inherit pb-20 min-h-[92vh] overflow-y-auto hideScrollbar`}
        >
          <div
            ref={componentRef}
            className={`flex justify-between items-center w-full max-w-[430px] py-4 px-2`}
          >
            <input
              onClickCapture={() => {}}
              type="text"
              ref={searchInputRef}
              className={`${
                theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"
              } w-full p-3 outline-none rounded-md`}
              placeholder="Search @username, name.... with '/ '"
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </div>
          {query.trim(" ").length > 0 && (
            <div className="flex flex-col px-4 space-y-3">
              <span>Users</span>
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
                          currentUser?.uid !== user?.id
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
                              src={post?.fileURLs[0]}
                              alt="post media"
                              className="h-40 w-40 object-cover rounded-sm"
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
