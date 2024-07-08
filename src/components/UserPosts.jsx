import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PostContext from "../context/PostContext/PostContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaUser } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { Carousel } from "react-responsive-carousel";
import { BsHeartFill } from "react-icons/bs";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { RxBookmarkFilled } from "react-icons/rx";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { formatDistanceToNow } from "date-fns";
import { GiMusicalNotes } from "react-icons/gi";
import { TbMusicOff } from "react-icons/tb";

const UserPosts = () => {
  const audioControl = useRef();
  const menuRefs = useRef({});

  const { userPosts, handleDeletePost } = useContext(PostContext);
  const { sub } = useParams();
  const { currentUser, handleLikePost, handleSavePost } =
    useContext(PostContext);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [toggleMenu, setToggleMenu] = useState({});
  // const [togglePostId, setTogglePostId] = useState(null);

  const handlePlay = async () => {
    const audioElement = audioControl.current;
    if (audioElement) {
      await audioElement.play();
      setIsPlaying(true);
    }
  };

  const handlePause = async () => {
    const audioElement = audioControl.current;
    if (audioElement) {
      await audioElement.play();
      audioElement.pause();
      setIsPlaying(false);
    }
  };
  // Function to handle menu toggle for a specific post
  const handlePostMenuToggle = (postId) => {
    setToggleMenu((prevState) => ({
      ...prevState,
      [postId]: prevState[postId] === "hidden" ? "flex" : "hidden",
    }));
  };

  const handleClickOutside = (event) => {
    Object.keys(menuRefs.current).forEach((postId) => {
      if (
        menuRefs.current[postId] &&
        !menuRefs.current[postId].contains(event.target)
      ) {
        setToggleMenu((prevState) => ({
          ...prevState,
          [postId]: "hidden",
        }));
      }
    });
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const fetchUserData = async () => {
    try {
      const docRef = doc(db, "users", currentUser.uid);
      console.log("Document Reference:", docRef);
      const userDataDoc = await getDoc(docRef);
      if (userDataDoc.exists()) {
        const userData = userDataDoc.data();
        console.log("User Data:", userData);
        setCurrentUserData(userData);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      fetchUserData();
    }
    // eslint-disable-next-line
  }, [currentUser]);

  return (
    <div className="pb-10">
      {userPosts?.map((post) => {
        return (
          <div key={post.id} className="w-full rounded-md">
            <div className="h-16 flex items-center border-t-[1px] border-blue-950 rounded-sm space-x-4 w-full justify-start px-3">
              {currentUserData?.img ? (
                <img
                  src={currentUserData?.img}
                  className="w-[3rem] h-[3rem] object-cover border-[1px] full border-zinc-900 duration-200 rounded-full"
                  alt=""
                />
              ) : (
                <FaUser size={48} />
              )}
              <div className="flex w-full justify-between items-center space-x-1">
                <div className="flex flex-col -space-y-1">
                  <span className="font-medium">{currentUserData?.name}</span>
                  <span className="text-zinc-600 font-medium text-sm">
                    @{currentUserData?.user_name}
                  </span>
                  {/* <div className="flex items-center space-x-2">
                    {post?.audio && (
                      <audio
                        className="border-2 bg-inherit"
                        autoPlay
                        onPlay={handlePlay}
                        onPause={handlePause}
                        ref={audioControl}
                      >
                        <source src={post?.audio} type="audio/*" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    {post?.audio ? (
                      <div onClick={isPlaying ? handlePause : handlePlay}>
                        {isPlaying === true ? (
                          <GiMusicalNotes
                            size={15}
                            className="animate-pulse cursor-pointer"
                          />
                        ) : (
                          <TbMusicOff size={15} className="cursor-pointer" />
                        )}
                      </div>
                    ) : (
                      ""
                    )}
                    <span className="text-xs">{post.audioName}</span>
                  </div> */}
                </div>
                <div className="relative ">
                  <HiDotsVertical
                    onClick={() => {
                      handlePostMenuToggle(post.id);
                    }}
                    className={`cursor-pointer ${
                      toggleMenu[post.id] === "flex" ? "text-pink-600" : ""
                    }`}
                    size={25}
                  />
                  <div
                    ref={(el) => (menuRefs.current[post.id] = el)}
                    className={`${
                      toggleMenu[post.id] === "flex" ? "flex" : "hidden"
                    } ${
                      toggleMenu[post.id] === "flex" ? "duration-300" : ""
                    }  flex-col items-start right-6 top-0 bg-zinc-900 space-y-4 transition-all z-20 rounded-md p-4 w-[80px] absolute`}
                  >
                    <button
                      onClick={() => {
                        handleDeletePost(post.id);
                        handlePostMenuToggle(post.id);
                        console.log(post.id);
                      }}
                      className="text-sm"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        handleDeletePost(post.id);
                      }}
                      className="text-sm"
                    >
                      Unsave
                    </button>
                    <button
                      onClick={() => {
                        handleDeletePost(post.id);
                      }}
                      className="text-sm"
                    >
                      UnLike
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full h-full my-2">
              <p className="px-4 py-2">{post?.postCaption}</p>
              <div className="px-2 flex flex-wrap">
                {post?.mentionedUsers?.map((user, index) => {
                  return (
                    <Link
                      key={index}
                      className="text-zinc-500 px-2"
                      onClick={() => {
                        console.log(user?.userId, user);
                      }}
                      to={`/users/${user?.userId || user}/profile`}
                    >
                      {currentUser.uid === user?.userId && post.userId ? (
                        <div className="flex items-center">
                          @{user?.username || user}{" "}
                          <span className="text-sm">&nbsp;(author)</span>
                        </div>
                      ) : (
                        <span>@{user?.username || user}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
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
                showIndicators={true}
              >
                {post?.fileURLs?.map((fileURL, index) => (
                  <div
                    key={index}
                    className="relative aspect-w-3 aspect-h-3  mx-[.25px]"
                  >
                    {fileURL ? (
                      <img
                        src={fileURL}
                        alt="post media"
                        className={`h-full w-full object-contain rounded-sm border-[1px] border-blue-950`}
                      />
                    ) : fileURL ? (
                      <video
                        controls
                        className="h-[10rem] w-[10rem] object-cover rounded-sm border-[1px] border-blue-950"
                      >
                        <source src={fileURL} type="video" />
                      </video>
                    ) : null}
                  </div>
                ))}
              </Carousel>
              <div className="flex items-center justify-between h-12 px-4 pt-2">
                <div className="flex items-center space-x-6">
                  <div
                    className="flex space-x-1 items-center cursor-pointer"
                    onClick={() => handleLikePost(post?.id, currentUser?.uid)}
                  >
                    {post?.likes?.includes(currentUser?.uid) ? (
                      <BsHeartFill
                        size={20}
                        className="text-red-600 cursor-pointer"
                      />
                    ) : (
                      <SlHeart size={20} />
                    )}
                    {post?.likes?.length !== 0 && (
                      <span>{post?.likes?.length}</span>
                    )}
                  </div>
                  <Link to={`/post/${post?.id}`}>
                    <div className="flex items-center space-x-1">
                      <SlBubble size={20} />
                      <span>
                        {post?.commentsCount !== 0 && post?.commentsCount}
                      </span>
                    </div>
                  </Link>
                  <SlPaperPlane size={20} />
                </div>
                <div
                  className=""
                  onClick={() => handleSavePost(post?.id, currentUser?.uid)}
                >
                  {post?.saves?.includes(currentUser?.uid) ? (
                    <RxBookmarkFilled
                      className="text-pink-600 cursor-pointer"
                      size={28}
                    />
                  ) : (
                    <PiBookmarkSimpleThin
                      size={28}
                      className="cursor-pointer"
                    />
                  )}
                </div>
              </div>
              <span className="w-full px-4 text-sm text-zinc-400">
                {post?.timeStamp
                  ? formatDate(post?.timeStamp, "PPpp")
                  : "not provided"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserPosts;
