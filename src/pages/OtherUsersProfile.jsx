import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../firebase";
import ThemeContext from "../context/Theme/ThemeContext";
import { BsGrid3X3, BsHeartFill } from "react-icons/bs";
import { BiLockAlt, BiUserPin } from "react-icons/bi";
import PostContext from "../context/PostContext/PostContext";
import toast from "react-hot-toast";
import { TfiLayoutListPost } from "react-icons/tfi";
import { FaUser, FaUserLock } from "react-icons/fa";
import { formatTime } from "../utils/FormatTime";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { RxBookmarkFilled } from "react-icons/rx";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";

const OtherUsersProfile = () => {
  const { userId, username } = useParams();
  const otherUserId = userId;
  const [focusedSection, setFocusedSection] = useState(() => {
    // Check if the value exists in localStorage
    const storedSection = localStorage.getItem("focusedSection");
    // Return the stored value if available, otherwise default to 1
    return storedSection ? parseInt(storedSection) : 1;
  });
  const [data, setData] = useState({});
  const { theme } = useContext(ThemeContext);
  const { currentUser, fetchHomePagePosts } = useContext(PostContext);
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [otherUserImagePosts, setOtherUserImagePosts] = useState([]);
  const [otherUserPosts, setOtherUserPosts] = useState([]);

  // Fetch user data
  const handleFetchUserData = async () => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = { ...userSnap.data(), userId };
      setData(userData);
    }
  };

  // Fetch tagged posts
  const handleTaggedPosts = async () => {
    try {
      const q = query(
        collection(db, "posts"),
        where("mentionedUsers", "array-contains", userId)
      );
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const postsWithUserData = await Promise.all(
        posts.map(async (post) => {
          const userDoc = await getDoc(doc(db, "users", post.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          return { ...post, user: userData };
        })
      );

      setTaggedPosts(postsWithUserData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOtherUserImagePostsData = async () => {
    try {
      const q = query(collection(db, "posts"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOtherUserImagePosts(posts);
    } catch (error) {
      console.error("Error fetching other user posts:", error);
    }
  };

  // Handle follow/unfollow
  const handleFollow = async (id) => {
    try {
      const toastId = toast.loading("Processing your request");
      const targetUserRef = doc(db, "users", userId);
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserSnap = await getDoc(targetUserRef);
      const currentUserSnap = await getDoc(currentUserRef);

      if (targetUserSnap.exists()) {
        const targetUserSnapShot = targetUserSnap.data();
        const currentUserSnapShot = currentUserSnap.data();

        if (targetUserSnapShot.followers.includes(id)) {
          // Unfollow the user
          await Promise.all([
            updateDoc(targetUserRef, {
              followers: arrayRemove(id),
            }),
            updateDoc(currentUserRef, {
              following: arrayRemove(userId),
            }),
          ]);
          toast.dismiss(toastId);
          toast.success("Unfollowed");
        } else {
          // Follow the user
          await Promise.all([
            updateDoc(targetUserRef, {
              followers: arrayUnion(id),
            }),
            updateDoc(currentUserRef, {
              following: arrayUnion(userId),
            }),
          ]);
          toast.dismiss(toastId);
          toast.success(`You are now following ${data.name}`);
        }
        // Fetch and update the user data after updating the followers
        handleFetchUserData();
        fetchHomePagePosts();
      } else {
        console.log("User document does not exist");
        toast.dismiss(toastId);
        toast.error("User not found");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error updating followers");
      console.error("Error updating followers:", error);
    }
  };

  useEffect(() => {
    handleFetchUserData();
    handleTaggedPosts();
    handleOtherUserImagePostsData();
    // eslint-disable-next-line
  }, []);

  // Handle focus for different sections
  const handleFocus = (id) => {
    setFocusedSection(id);
  };

  // Fetch other user posts
  const handleOtherUserPostsData = async () => {
    try {
      if (!userId) {
        console.error(` ${userId} , userid is undefined or null.`);
        return;
      }

      const q = query(collection(db, "posts"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOtherUserPosts(posts);
    } catch (error) {
      console.error("Error fetching other user posts:", error);
    }
  };

  const handleLikePost = async (id) => {
    try {
      toast.loading("updating likes...");
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const likes = postData.likes || [];
        let updatedPosts;

        if (likes.includes(currentUser.uid)) {
          // Update database
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser.uid),
          });
          toast.dismiss();
          // Optimistically update UI
          updatedPosts = otherUserPosts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  likes: post.likes.filter((uid) => uid !== currentUser.uid),
                }
              : post
          );
          setOtherUserPosts(updatedPosts);
          toast.success("Like removed");

          // handleOtherUserPostsData();
        } else {
          // Update database
          await updateDoc(postRef, {
            likes: arrayUnion(currentUser.uid),
          });
          toast.dismiss();
          // Optimistically update UI
          updatedPosts = otherUserPosts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  likes: [...post.likes, currentUser.uid],
                }
              : post
          );
          setOtherUserPosts(updatedPosts);
          toast.success("Liked");

          // handleOtherUserPostsData();
        }
      }
    } catch (error) {
      console.error("Error liking post: ", error);
      toast.dismiss();
      toast.error("Could not process.");
    }
  };

  const handleSavePost = async (id, otherUserId) => {
    try {
      toast.loading("Updating your saved posts collection...");
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap?.data(); // This is the fetched data
        const saves = postData?.saves || []; // Initialize saves array from fetched data

        if (saves.includes(currentUser?.uid)) {
          await updateDoc(postRef, {
            saves: arrayRemove(currentUser?.uid),
          });

          toast.dismiss();
          setOtherUserPosts((prevPosts) =>
            prevPosts?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    saves: post?.saves?.filter(
                      (uid) => uid !== currentUser?.uid
                    ),
                  }
                : post
            )
          );
          toast.success("removed");
          handleOtherUserPostsData(otherUserId);
        } else {
          await updateDoc(postRef, {
            saves: arrayUnion(currentUser?.uid),
          });
          toast.dismiss();
          setOtherUserPosts((prevPosts) =>
            prevPosts?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    saves: [...post?.saves, currentUser?.uid],
                  }
                : post
            )
          );
          toast.success("saved");
          handleOtherUserPostsData();
        }
      } else {
        console.log("No such post document!");
      }
    } catch (error) {
      console.error("Error saving post: ", error);
    }
  };

  // Update localStorage whenever focusedSection changes
  useEffect(() => {
    localStorage.setItem("focusedSection", focusedSection.toString());
  }, [focusedSection]);

  useEffect(() => {
    handleOtherUserPostsData();
    // eslint-disable-next-line
  }, [otherUserId]);

  return (
    <div className={`flex flex-col items-center w-full min-h-[86.5vh]`}>
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
              <span className={` `}>
                {data?.user_name && (
                  <span className={`text-gray-400`}>@{data?.user_name}</span>
                )}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-6">
            <div className="flex space-x-3">
              <div className="flex flex-col items-center">
                <span className="text-2xl">{otherUserPosts.length}</span>
                <span className={`px-3 py-1 `}>Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">{data?.followers?.length || 0}</span>
                <span className={`px-3 py-1 `}>Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl">{data?.following?.length || 0}</span>
                <span className={`px-3 py-1 `}>Following</span>
              </div>
            </div>
            <div className="flex justify-between space-x-6 w-full">
              <button
                onClick={() => handleFollow(currentUser?.uid)}
                className={` px-3 py-1 border-[.5px] ${
                  theme === "dark" ? "" : "bg-orange-700 text-white"
                } rounded-md w-full text-center`}
              >
                {data?.followers?.includes(currentUser.uid) ? (
                  <span
                    className={`${theme === "dark" ? "text-orange-600" : ""}`}
                  >
                    Following
                  </span>
                ) : (
                  "Follow"
                )}
              </button>
              <button
                disabled={!data?.followers?.includes(currentUser.uid)}
                className={` ${
                  data?.followers?.includes(currentUser.uid)
                    ? "cursor-pointer"
                    : "cursor-not-allowed"
                } px-3 py-1 border-[.5px] ${
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
          {(data?.accountType !== "private" ||
            data?.followers?.includes(currentUser.uid)) && (
            <div className="flex w-full justify-around my-2">
              <button
                onClick={() => handleFocus(1)}
                className={`${
                  focusedSection === 1
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } `}
              >
                <BsGrid3X3 size={20} />
              </button>
              <button
                onClick={() => {
                  handleFocus(2);
                  handleOtherUserPostsData(userId);
                }}
                className={`${
                  focusedSection === 2
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } `}
              >
                <TfiLayoutListPost size={25} />
              </button>
              <button
                onClick={() => handleFocus(3)}
                className={`${
                  focusedSection === 3
                    ? `${theme === "dark" ? "text-white" : "text-black"}`
                    : "text-gray-400"
                } `}
              >
                <BiUserPin size={25} />
              </button>
            </div>
          )}
          {data?.accountType !== "private" ||
          data?.followers?.includes(currentUser.uid) ? (
            <div className="flex w-full border-t-[1px] border-gray-400">
              <div
                className={`${
                  focusedSection === 1 ? "grid" : "hidden"
                } grid-cols-3 gap-[.125rem]`}
              >
                {otherUserImagePosts && otherUserImagePosts.length > 0 ? (
                  otherUserImagePosts
                    .filter((post) => post.fileURLs.length > 0)
                    .sort((a, b) => b.timeStamp - a.timeStamp)
                    .map((post) => (
                      <Link
                        onClick={() => window.scrollTo(0, 0)}
                        className="flex flex-col w-full space-y-2"
                        key={post.id}
                        to={`/posts/${post.id}`}
                      >
                        <div key={post.id}>
                          {post.fileURLs[0].includes(".mp4") ? (
                            <video
                              controls
                              className="h-40 w-40 object-cover rounded-sm"
                            >
                              <source src={post.fileURLs[0]} type="video/mp4" />
                            </video>
                          ) : (
                            <img
                              src={post.fileURLs[0]}
                              alt="post media"
                              className="h-40 w-40 object-cover rounded-sm"
                            />
                          )}
                        </div>
                      </Link>
                    ))
                ) : (
                  <span className="w-fit mx-auto pt-10">no post available</span>
                )}
              </div>
              {/* text based posts */}
              <div
                className={`w-full flex flex-col items-center space-y-6 pt-2 border-t-[1px] border-gray-400 ${
                  focusedSection === 2 ? "flex" : "hidden"
                }`}
              >
                {otherUserPosts && otherUserPosts.length > 0 ? (
                  otherUserPosts
                    .filter(
                      (post) => !post?.fileURLs || post?.fileURLs.length === 0
                    )
                    .map((post) => {
                      return (
                        <div key={post.id} className={`w-full px-4`}>
                          <div className="h-16 flex items-center rounded-sm space-x-4 w-full justify-start">
                            {data?.img ? (
                              <img
                                src={data?.img}
                                className="w-[3rem] h-[3rem] object-cover border-[1px] full border-zinc-900 duration-200 rounded-full"
                                alt=""
                              />
                            ) : (
                              <FaUser size={48} />
                            )}
                            <div className="flex w-full justify-between items-center space-x-1">
                              <Link
                                onClick={() => {
                                  window.scrollTo(0, 0);
                                }}
                                to={
                                  currentUser?.uid === post?.userId
                                    ? `/userProfile/yourPosts`
                                    : `/users/${post?.userId}/profile`
                                }
                                className="flex flex-col -space-y-1 font-medium"
                              >
                                <span>{data?.name}</span>
                                <span className="text-sm text-zinc-600">
                                  {" "}
                                  @{data?.user_name}
                                </span>
                              </Link>
                              {/* <div>
                          <HiDotsVertical
                            className="cursor-pointer"
                            size={25}
                          />
                          <div className="hidden">
                            <span>Edit</span>
                            <span>Delete</span>
                            <span></span>
                          </div>
                        </div> */}
                            </div>
                          </div>
                          <p>{post?.postCaption}</p>
                          <div className="px-2 mb-1 flex flex-wrap">
                            {post?.mentionedUsers?.map((user, index) => {
                              return (
                                <Link
                                  key={index}
                                  className="text-zinc-500 px-2"
                                  onClick={() => {
                                    window.scrollTo(0, 0);
                                  }}
                                  to={`/users/${user?.userId}/profile`}
                                >
                                  {post.userId === user?.userId ? (
                                    <div className="flex items-center">
                                      @{user?.username || user}{" "}
                                      <span className="text-sm">
                                        &nbsp;(author)
                                      </span>
                                    </div>
                                  ) : (
                                    <span>
                                      @{user?.username || user?.username}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between h-10 pt-2">
                            <div className="flex items-center space-x-6">
                              <button
                                className="flex items-center cursor-pointer"
                                onClick={() =>
                                  handleLikePost(post?.id, currentUser?.uid)
                                }
                              >
                                {post?.likes?.includes(currentUser?.uid) ? (
                                  <BsHeartFill
                                    size={20}
                                    className="text-red-600"
                                  />
                                ) : (
                                  <SlHeart size={20} />
                                )}
                              </button>
                              <Link
                                to={`/posts/${post?.id}`}
                                onClick={() => {
                                  window.scrollTo(0, 0);
                                }}
                              >
                                <div className="flex items-center space-x-1">
                                  <SlBubble size={20} />
                                </div>
                              </Link>
                              <SlPaperPlane size={20} />
                            </div>
                            <button
                              className=""
                              onClick={() =>
                                handleSavePost(post?.id, currentUser?.uid)
                              }
                            >
                              {post?.saves?.includes(currentUser?.uid) ? (
                                <RxBookmarkFilled
                                  className="text-pink-600"
                                  size={28}
                                />
                              ) : (
                                <PiBookmarkSimpleThin size={28} />
                              )}
                            </button>
                          </div>
                          <div className="flex flex-col">
                            {/* {post?.likes?.length !== 0 && ( */}
                            {post?.likes?.length !== 0 && (
                              <span className="w-full">
                                {post?.likes?.length !== 0 &&
                                  post?.likes?.length}
                                &nbsp;
                                {post?.likes?.length === 1 ? "like" : "likes"}
                              </span>
                            )}
                            {/* )} */}
                            <span className="w-full text-sm text-zinc-400">
                              {post?.timeStamp
                                ? formatTime(post?.timeStamp, "PPpp", {
                                    addSuffix: true,
                                  })
                                : "not provided"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <span>No post Available</span>
                )}
              </div>

              {/*  tagged posts*/}
              <div
                className={`w-full flex justify-center pt-10 border-t-[1px] border-gray-400 ${
                  focusedSection === 3 ? "flex" : "hidden"
                }`}
              >
                0 tag post
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-[80%] mx-auto">
              <FaUserLock size={85} />{" "}
              <div className="flex flex-col items-start">
                <span className="">This is a private account</span>
                <span className="">Follow to see their posts and vidoes</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherUsersProfile;
