import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../firebase";
import ThemeContext from "../context/Theme/ThemeContext";
import { Carousel } from "react-responsive-carousel";
import { FaUser } from "react-icons/fa";
import {
  BiGridAlt,
  BiGridVertical,
  BiSolidGridAlt,
  BiSolidUserPin,
  BiTag,
  BiUserPin,
} from "react-icons/bi";
import { VscMention } from "react-icons/vsc";
import { BsGrid3X3 } from "react-icons/bs";

const OtherUsersProfile = () => {
  const { userId, username } = useParams();
  const [isFocused, setIsFocused] = useState(false);
  const [data, setData] = useState([]);
  const { theme } = useContext(ThemeContext);
  const [userPosts, setUserPosts] = useState([]);
  const [taggedPosts, setTaggedPosts] = useState([]);
  // need to fetch a user all data and acivity

  const handleFetchUserData = async () => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = { ...userSnap.data(), userId };
      setData(userData);
    }
  };

  // user posts
  const handleUserPostsData = async () => {
    const q = query(collection(db, "posts"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUserPosts(posts);
  };

  // fetched tagged post by other users
  const handleTaggedPosts = async () => {
    try {
      // Fetch saved posts where mentionedUsers array contains the userId
      const q = query(
        collection(db, "posts"),
        where("mentionedUsers", "array-contains", userId)
      );
      const querySnapshot = await getDocs(q);
      // Map over the querySnapshot to get the post data along with post IDs
      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log({ posts });

      // Fetch user data for each post
      const postsWithUserData = await Promise.all(
        posts.map(async (post) => {
          // Assuming each post has a userId field to fetch user data
          const userDoc = await getDoc(doc(db, "users", post.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          return { ...post, user: userData };
        })
      );

      // Set the posts with user data to state
      setTaggedPosts(postsWithUserData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    handleTaggedPosts();
    // eslint-disable-next-line
  }, []);

  // focus another component
  const handleFocus = (id) => {
    if (id === 2) {
      setIsFocused(true);
    } else {
      setIsFocused(false);
    }
  };

  useEffect(() => {
    handleUserPostsData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    handleFetchUserData();
    // eslint-disable-next-line
  }, []);
  return (
    <div className={`flex flex-col items-center w-full min-h-[85.9vh]`}>
      <div className="flex flex-col items-center w-full">
        <div className="flex flex-col items-center h-[60vh] space-y-10 px-4">
          <div className="flex flex-col items-center space-y-2 mt-10">
            <div>
              <img
                src={data?.img}
                className="h-32 w-32 hover:h-40 hover:w-40 rounded-full duration-300 cursor-pointer"
                alt=""
              />
            </div>
            <div className="space-x-2">
              <span className="text-xl font-semibold">{data?.name}</span>
              <span
                className={`${isFocused ? "text" : ""} ${
                  isFocused ? "text-white" : "text-gray-400"
                } `}
              >
                @{data?.user_name}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-6">
            <div className="flex space-x-3">
              <div className="flex flex-col items-center space-y-1">
                <span>{userPosts.length}</span>
                <span className={`px-3 py-1 `}>Posts</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <span>0</span>
                <span className={`px-3 py-1 `}>Followers</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <span>0</span>
                <span className={`px-3 py-1 `}>Following</span>
              </div>
            </div>
            <div className="flex justify-between space-x-6 w-full">
              <button
                className={` px-3 py-1 border-[.5px] ${
                  theme === "dark" ? "" : "bg-orange-700 text-white"
                } rounded-md w-full text-center`}
              >
                Follow
              </button>
              <button
                className={` px-3 py-1 border-[.5px] ${
                  theme === "dark" ? "" : "bg-orange-700 text-white"
                } rounded-md w-full text-center`}
              >
                Message
              </button>
            </div>
          </div>
        </div>
        {/* user posts and other content */}
        <div className="flex flex-col items-center w-full">
          <div className="flex w-full justify-around my-2">
            <button
              onClick={() => handleFocus(1)}
              className={`${!isFocused ? "text-white" : "text-gray-400"} `}
            >
              <BsGrid3X3 size={20} />
            </button>
            <button
              onClick={() => handleFocus(2)}
              className={`${isFocused ? "text-white" : "text-gray-400"} `}
            >
              <BiUserPin size={25} />
            </button>
          </div>
          <div className="flex w-full">
            <div
              className={`${
                !isFocused ? "grid" : "hidden"
              } grid-cols-3`}
            >
              {userPosts
                ?.map((post) => {
                  return (
                    <Link
                      onClick={() => {
                        window.scrollTo(0, 0);
                      }}
                      className="flex flex-col w-full space-y-2"
                      key={post.id}
                      to={`/posts/${post.id}`}
                    >
                      {post?.fileURLs && post?.fileURLs.length > 0 && (
                        <div key={post.id}>
                          {post?.fileURLs[0].includes(".mp4") ? (
                            <video
                              controls
                              className="h-full w-full object-cover rounded-sm"
                            >
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
            {/*  tagged posts*/}
            <div
              className={`w-full flex justify-center pt-10 border-t-[1px] border-gray-400 ${
                !isFocused ? "hidden" : "flex"
              }`}
            >
              0 tag post
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherUsersProfile;
