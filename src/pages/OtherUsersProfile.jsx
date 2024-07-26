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
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { db } from "../firebase";
import ThemeContext from "../context/Theme/ThemeContext";
import { BsGrid3X3, BsHeartFill } from "react-icons/bs";
import {
  BiArrowBack,
  BiCopy,
  BiLockAlt,
  BiPause,
  BiPlay,
  BiUserPin,
} from "react-icons/bi";
import PostContext from "../context/PostContext/PostContext";
import toast from "react-hot-toast";
import { TfiLayoutListPost } from "react-icons/tfi";
import { FaUser, FaUserLock } from "react-icons/fa";
import { formatTime } from "../utils/FormatTime";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { RxBookmarkFilled } from "react-icons/rx";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { Carousel } from "react-responsive-carousel";
import FollowingList from "../components/FollowingList";
import { FiSettings } from "react-icons/fi";
import { HighLightLinks } from "../utils/HighlightLinks";

const OtherUsersProfile = () => {
  const { userId, username } = useParams();
  const location = useLocation();
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
      if (!userId) {
        throw new Error("Profile user ID not provided");
      }
      console.log(userId);

      // Fetch all posts and filter them client-side
      const q = query(collection(db, "posts"));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log("No posts found.");
        setTaggedPosts([]);
        return;
      }

      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter posts where the profile user is mentioned
      const filteredPosts = posts.filter((post) =>
        post.mentionedUsers?.some((user) => user.userId === userId)
      );

      if (filteredPosts.length === 0) {
        console.log("No posts found where the profile user is mentioned.");
        setTaggedPosts([]);
        return;
      }

      // Fetch user data for each post
      const postsWithUserData = await Promise.all(
        filteredPosts.map(async (post) => {
          const userDoc = await getDoc(doc(db, "users", post.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          return { ...post, user: userData };
        })
      );

      setTaggedPosts(postsWithUserData);
      console.log("Tagged posts fetched:", postsWithUserData);
      console.log(taggedPosts);
    } catch (error) {
      console.error("Error fetching tagged posts:", error);
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
        let updatedTaggedPosts;
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
          updatedTaggedPosts = taggedPosts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  likes: post.likes.filter((uid) => uid !== currentUser.uid),
                }
              : post
          );
          setOtherUserPosts(updatedPosts);
          setTaggedPosts(updatedTaggedPosts);
          toast.success("Like removed");
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
          updatedTaggedPosts = taggedPosts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  likes: [...post.likes, currentUser.uid],
                }
              : post
          );
          setOtherUserPosts(updatedPosts);
          setTaggedPosts(updatedTaggedPosts);
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
      toast.loading("Updating collection...");
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
          setTaggedPosts((prevPosts) =>
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
          setTaggedPosts((prevPosts) =>
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

  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayPause = (index) => {
    videoRef.current.click(index);
    if (isPlaying === false) {
      videoRef.current.play(index);
      console.log(isPlaying);
      setIsPlaying(true);
    } else {
      videoRef.current.pause(index);
      console.log(isPlaying);
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  // Update localStorage whenever focusedSection changes
  useEffect(() => {
    localStorage.setItem("focusedSection", focusedSection.toString());
  }, [focusedSection]);

  useEffect(() => {
    handleOtherUserPostsData();
    handleFetchUserData();
    handleTaggedPosts();
    // eslint-disable-next-line
  }, [userId]);

  return (
    <div className={`flex flex-col items-center w-full min-h-[86.5vh]`}>
      <div className="flex flex-col items-center w-full">
        <div
          className={`z-10 sticky top-0 right-0 flex items-center py-2 justify-between w-full px-4 ${
            theme === "dark" ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          <div className="flex space-x-2 items-center">
            <BiArrowBack size={20} className="cursor-pointer" />
            <span className={` `}>
              {data?.user_name && (
                <span className={`text-xl font-semibold`}>
                  {data?.user_name}
                </span>
              )}
            </span>
          </div>
          <Link
            to={`/userProfile/settings`}
            onClick={() => {
              window.scrollTo(0, 0);
            }}
          >
            <FiSettings size={20} />
          </Link>
        </div>
        <div className="flex flex-col  jsutify-center items-center space-y-4 h-fit w-full p-4">
          <div className="flex justify-between w-full h-fit">
            <div className="flex flex-col items-center space-y-1">
              <img
                src={data?.img}
                className="h-16 w-16 object-cover rounded-full"
                alt=""
              />
              <span className="">{data?.name}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex flex-col items-center">
                <span className="text-3xl">{otherUserPosts.length}</span>
                <Link
                  to={`/users/${userId}/profile`}
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Posts
                </Link>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl">{data?.followers?.length || 0}</span>
                <Link
                  to={`/users/${userId}/profile/followers`}
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Followers
                </Link>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl">{data?.following?.length || 0}</span>
                <Link
                  to={`/users/${userId}/profile/following`}
                  className={`text-sm font-semibold px-3 py-1 `}
                >
                  Following
                </Link>
              </div>
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
            {(data.accountType !== "private" ||
              data?.followers?.includes(currentUser.uid)) && (
              <Link
                to={`/userChats/${data?.userId}/messages`}
                className={`px-3 py-1 border-[.5px] ${
                  theme === "dark" ? "" : "bg-orange-700 text-white"
                } rounded-md w-full text-center`}
              >
                Message
              </Link>
            )}
          </div>
        </div>
        {data?.accountType !== "private" ||
        data?.followers?.includes(currentUser.uid) ? (
          <div className="w-full">
            <div className="w-full">
              {(location.pathname === `/users/${userId}/profile/followers` ||
                location.pathname === `/users/${userId}/profile/following`) && (
                <div
                  className={`w-full flex justify-evenly border-b-[1px] ${
                    theme === "dark" ? "border-gray-400" : "border-black"
                  }`}
                >
                  <span className="w-full flex justify-center">
                    <Link
                      to={`/users/${userId}/profile/followers`}
                      className={`${
                        location.pathname ===
                        `/users/${userId}/profile/followers`
                          ? `${theme === "dark" ? "text-white" : "text-black"}`
                          : "text-gray-400"
                      } p-2  text-center`}
                    >
                      {/* <TfiLayoutListPost size={25} /> */}
                      Followers
                    </Link>
                  </span>
                  <span className="w-full flex justify-center">
                    <Link
                      to={`/users/${userId}/profile/following`}
                      className={`${
                        location.pathname ===
                        `/users/${userId}/profile/following`
                          ? `${theme === "dark" ? "text-white" : "text-black"}`
                          : "text-gray-400"
                      } p-2  text-center`}
                    >
                      {/* <TfiLayoutListPost size={25} /> */}
                      Following
                    </Link>
                  </span>
                </div>
              )}
            </div>
            {(otherUserImagePosts && otherUserPosts).length > 0 && (
              <div className="w-full">
                {location.pathname === `/users/${userId}/profile` && (
                  <div className="flex flex-col items-center w-full">
                    {(data?.accountType !== "private" ||
                      data?.followers?.includes(currentUser.uid)) && (
                      <div className="flex w-full justify-around my-2">
                        <button
                          onClick={() => handleFocus(1)}
                          className={`${
                            focusedSection === 1
                              ? `${
                                  theme === "dark" ? "text-white" : "text-black"
                                }`
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
                              ? `${
                                  theme === "dark" ? "text-white" : "text-black"
                                }`
                              : "text-gray-400"
                          } `}
                        >
                          <TfiLayoutListPost size={25} />
                        </button>
                        <button
                          onClick={() => {
                            handleFocus(3);
                            handleTaggedPosts();
                          }}
                          className={`${
                            focusedSection === 3
                              ? `${
                                  theme === "dark" ? "text-white" : "text-black"
                                }`
                              : "text-gray-400"
                          } `}
                        >
                          <BiUserPin size={25} />
                        </button>
                      </div>
                    )}

                    <div
                      className={`flex w-full border-t-[1px] ${
                        theme === "dark" ? "border-gray-400" : "border-black"
                      }`}
                    >
                      <div
                        className={`${
                          focusedSection === 1
                            ? `${
                                otherUserImagePosts.length > 0
                                  ? "grid grid-cols-3 gap-[.125rem]"
                                  : "flex items-center justify-center w-full"
                              }`
                            : "hidden"
                        }`}
                      >
                        {otherUserImagePosts &&
                        otherUserImagePosts.length > 0 ? (
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
                                    <video className="h-40 w-40 object-cover rounded-sm">
                                      <source
                                        src={post.fileURLs[0]}
                                        type="video/mp4"
                                      />
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
                          <span className="self-center pt-4 w-full border-2">
                            no post available
                          </span>
                        )}
                      </div>
                      {/* text based posts */}
                      <div
                        className={`w-full flex flex-col items-center space-y-6 pt-2 ${
                          focusedSection === 2 ? "flex" : "hidden"
                        }`}
                      >
                        {otherUserPosts && otherUserPosts.length > 0 ? (
                          otherUserPosts
                            .filter(
                              (post) =>
                                !post?.fileURLs || post?.fileURLs.length === 0
                            )
                            ?.sort((a, b) => b.timeStamp - a.timeStamp)
                            ?.map((post) => {
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
                                    </div>
                                  </div>
                                  <p
                                    className="whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{
                                      __html: HighLightLinks(post?.postCaption),
                                    }}
                                  />
                                  <div className="mb-1 flex flex-wrap">
                                    {post?.mentionedUsers?.map(
                                      (user, index) => {
                                        return (
                                          <Link
                                            key={index}
                                            className="text-zinc-500 px-2"
                                            onClick={() => {
                                              window.scrollTo(0, 0);
                                            }}
                                            to={
                                              currentUser.uid === user?.userId
                                                ? `/userProfile/yourPosts`
                                                : `/users/${user?.userId}/profile`
                                            }
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
                                                @
                                                {user?.username ||
                                                  user?.username}
                                              </span>
                                            )}
                                          </Link>
                                        );
                                      }
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between h-10 pt-2">
                                    <div className="flex items-center space-x-6">
                                      <button
                                        className="flex items-center cursor-pointer"
                                        onClick={() =>
                                          handleLikePost(
                                            post?.id,
                                            currentUser?.uid
                                          )
                                        }
                                      >
                                        {post?.likes?.includes(
                                          currentUser?.uid
                                        ) ? (
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
                                        handleSavePost(
                                          post?.id,
                                          currentUser?.uid
                                        )
                                      }
                                    >
                                      {post?.saves?.includes(
                                        currentUser?.uid
                                      ) ? (
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
                                        {post?.likes?.length === 1
                                          ? "like"
                                          : "likes"}
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
                      {data?.followers.includes(currentUser.uid) ? (
                        <div
                          className={`w-full flex justify-center pt-2 ${
                            focusedSection === 3 ? "flex" : "hidden"
                          }`}
                        >
                          {taggedPosts && taggedPosts.length > 0 ? (
                            <div className="w-full h-full space-y-6">
                              {taggedPosts?.map((taggedPost) => {
                                return (
                                  <div key={taggedPost.id} className={`w-full`}>
                                    <div className="h-16 flex items-center rounded-sm space-x-4 w-full justify-start px-4">
                                      {data?.img ? (
                                        <img
                                          src={taggedPost.user?.img}
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
                                            currentUser?.uid ===
                                            taggedPost?.userId
                                              ? `/userProfile/yourPosts`
                                              : `/users/${taggedPost?.userId}/profile`
                                          }
                                          className="flex flex-col -space-y-1 font-medium"
                                        >
                                          <span>{taggedPost?.user?.name}</span>
                                          <span className="text-sm text-zinc-600">
                                            {" "}
                                            @{taggedPost?.user?.user_name}
                                          </span>
                                        </Link>
                                      </div>
                                    </div>
                                    <p
                                      className="whitespace-pre-wrap px-4"
                                      dangerouslySetInnerHTML={{
                                        __html: HighLightLinks(
                                          taggedPost?.postCaption
                                        ),
                                      }}
                                    />
                                    <div className="px-2 mb-1 flex flex-wrap">
                                      {taggedPost?.mentionedUsers?.map(
                                        (user, index) => {
                                          return (
                                            <Link
                                              key={index}
                                              className="text-zinc-500 px-2"
                                              onClick={() => {
                                                window.scrollTo(0, 0);
                                              }}
                                              to={
                                                currentUser.uid === user?.userId
                                                  ? `/userProfile/yourPosts`
                                                  : `/users/${user?.userId}/profile`
                                              }
                                            >
                                              {taggedPost.userId ===
                                              user?.userId ? (
                                                <div className="flex items-center">
                                                  @{user?.username || user}{" "}
                                                  <span className="text-sm">
                                                    &nbsp;(author)
                                                  </span>
                                                </div>
                                              ) : (
                                                <span>
                                                  @
                                                  {user?.username ||
                                                    user?.username}
                                                </span>
                                              )}
                                            </Link>
                                          );
                                        }
                                      )}
                                    </div>
                                    <div className="flex w-full">
                                      <Carousel
                                        className="carousel"
                                        showThumbs={false}
                                        autoPlay={false}
                                        infiniteLoop={true}
                                        showStatus={false}
                                        emulateTouch={true}
                                        useKeyboardArrows={true}
                                        swipeable={true}
                                        showArrows={true}
                                        showIndicators={
                                          taggedPost &&
                                          taggedPost?.fileURLs.length > 1
                                            ? true
                                            : false
                                        }
                                      >
                                        {taggedPost?.fileURLs?.map(
                                          (fileURL, index) => (
                                            <div
                                              key={index}
                                              className="relative  mx-[.25px]"
                                            >
                                              {fileURL.includes(".mp4") ? (
                                                <video
                                                  onClick={() => {
                                                    handlePlayPause(index);
                                                  }}
                                                  onEnded={handleEnded}
                                                  ref={videoRef}
                                                  autoFocus={true}
                                                  className="h-[80%] w-full object-contain rounded-sm "
                                                >
                                                  <source
                                                    src={fileURL}
                                                    type="video/mp4"
                                                  />
                                                </video>
                                              ) : (
                                                <img
                                                  src={fileURL}
                                                  alt="post media"
                                                  className="h-fit w-fit object-contain rounded-sm"
                                                />
                                              )}

                                              {fileURL.includes(".mp4") && (
                                                <button
                                                  onClick={() =>
                                                    handlePlayPause()
                                                  }
                                                  className="z-20 absolute top-[50%]"
                                                >
                                                  {isPlaying ? (
                                                    <BiPause
                                                      className="z-20"
                                                      size={40}
                                                    />
                                                  ) : (
                                                    <BiPlay
                                                      className="z-20"
                                                      size={40}
                                                    />
                                                  )}
                                                </button>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </Carousel>
                                    </div>
                                    <div className="flex items-center justify-between h-10 pt-2 px-4">
                                      <div className="flex items-center space-x-6">
                                        <button
                                          className="flex items-center cursor-pointer"
                                          onClick={() =>
                                            handleLikePost(
                                              taggedPost?.id,
                                              currentUser?.uid
                                            )
                                          }
                                        >
                                          {taggedPost?.likes?.includes(
                                            currentUser?.uid
                                          ) ? (
                                            <BsHeartFill
                                              size={20}
                                              className="text-red-600"
                                            />
                                          ) : (
                                            <SlHeart size={20} />
                                          )}
                                        </button>
                                        <Link
                                          to={`/posts/${taggedPost?.id}`}
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
                                          handleSavePost(
                                            taggedPost?.id,
                                            currentUser?.uid
                                          )
                                        }
                                      >
                                        {taggedPost?.saves?.includes(
                                          currentUser?.uid
                                        ) ? (
                                          <RxBookmarkFilled
                                            className="text-pink-600"
                                            size={28}
                                          />
                                        ) : (
                                          <PiBookmarkSimpleThin size={28} />
                                        )}
                                      </button>
                                    </div>
                                    <div className="flex flex-col px-4">
                                      {/* {post?.likes?.length !== 0 && ( */}
                                      {taggedPost?.likes?.length !== 0 && (
                                        <span className="w-full">
                                          {taggedPost?.likes?.length !== 0 &&
                                            taggedPost?.likes?.length}
                                          &nbsp;
                                          {taggedPost?.likes?.length === 1
                                            ? "like"
                                            : "likes"}
                                        </span>
                                      )}
                                      {/* )} */}
                                      <span className="w-full text-sm text-zinc-400">
                                        {taggedPost?.timeStamp
                                          ? formatTime(
                                              taggedPost?.timeStamp,
                                              "PPpp",
                                              {
                                                addSuffix: true,
                                              }
                                            )
                                          : "not provided"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            "No data available"
                          )}
                        </div>
                      ) : (
                        <div
                          className={`w-full ${
                            focusedSection === 3 ? "flex" : "hidden"
                          } justify-center pt-4`}
                        >
                          <span>Follow this user to see tagged posts</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <Outlet />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center w-[80%] mx-auto">
            <FaUserLock size={85} />
            <div className="flex flex-col items-start">
              <span className="">This is a private account</span>
              <span className="">Follow to see their posts and vidoes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtherUsersProfile;
