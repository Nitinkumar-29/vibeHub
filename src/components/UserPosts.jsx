import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PostContext from "../context/PostContext/PostContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaAlignRight, FaUser } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { Carousel } from "react-responsive-carousel";
import { BsHeartFill } from "react-icons/bs";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { RxBookmarkFilled } from "react-icons/rx";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { formatDistanceToNow } from "date-fns";
import { GiMusicalNotes, GiNextButton } from "react-icons/gi";
import { TbMusicOff } from "react-icons/tb";
import { formatTime } from "../utils/FormatTime";
import { FaCircleLeft, FaCircleRight } from "react-icons/fa6";
import ThemeContext from "../context/Theme/ThemeContext";
import { BiPause, BiPlay } from "react-icons/bi";
import { HighLightLinks } from "../utils/HighlightLinks";
import { AuthContext } from "../context/AuthContext";

const UserPosts = () => {
  const audioControl = useRef();
  const menuRefs = useRef({});
  const currentUser = localStorage.getItem("currentUser");
  const { userPosts, handleDeletePost } = useContext(PostContext);
  const { handleLikePost, handleSavePost } = useContext(PostContext);
  // const [isPlaying, setIsPlaying] = useState(true);
  const { currentUserData } = useContext(AuthContext);
  const [toggleMenu, setToggleMenu] = useState({});
  const { theme } = useContext(ThemeContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const [error, setError] = useState("");
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

  const [isEdit, setIsEdit] = useState(false);

  const handleEditPost = (postId) => {
    setIsEdit(!isEdit);
  };

  return (
    <>
      {!error ? (
        <div className="pb-2 space-y-3 w-full">
          {userPosts?.length > 0 ? (
            userPosts?.map((post) => {
              return (
                <div
                  key={post?.id}
                  className={`w-full border-b-[1px] last:border-b-0 border-zinc-700 pb-3`}
                >
                  <div className="h-16 flex items-center rounded-sm space-x-2 w-full justify-start px-3">
                    {currentUserData?.img ? (
                      <img
                        src={currentUserData?.img}
                        className="w-[3rem] h-[3rem] object-cover duration-200 rounded-full"
                        alt=""
                      />
                    ) : (
                      <FaUser size={48} />
                    )}
                    <div className="flex w-full justify-between items-center space-x-1">
                      <div className="flex flex-col -space-y-1">
                        <span className="font-medium">
                          {currentUserData?.name}
                        </span>
                        <span className="text-zinc-600 font-medium text-sm">
                          @{currentUserData?.user_name}
                        </span>
                      </div>
                      <div className="relative ">
                        <HiDotsVertical
                          onClick={() => {
                            handlePostMenuToggle(post?.id);
                          }}
                          className={`cursor-pointer ${
                            toggleMenu[post?.id] === "flex"
                              ? "text-pink-600"
                              : ""
                          }`}
                          size={25}
                        />
                        <div
                          ref={(el) => (menuRefs.current[post?.id] = el)}
                          className={`${
                            toggleMenu[post?.id] === "flex" ? "flex" : "hidden"
                          } ${
                            toggleMenu[post?.id] === "flex"
                              ? "duration-300"
                              : ""
                          }  flex-col items-start right-6 top-0 ${
                            theme === "dark" ? "bg-gray-950" : "bg-gray-100"
                          } space-y-4 transition-all z-20 rounded-md p-4 w-[120px] absolute`}
                        >
                          <button
                            onClick={() => {
                              handleDeletePost(post.id);
                              handlePostMenuToggle(post.id);
                            }}
                            className="text-sm"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              handleEditPost(post.id);
                            }}
                            className="text-sm"
                          >
                            {!isEdit ? "Edit" : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              handleDeletePost(post.id);
                            }}
                            className="text-sm"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-full">
                    <div
                      contentEditable={isEdit}
                      suppressContentEditableWarning={true}
                      className="px-4 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: HighLightLinks(post?.postCaption),
                      }}
                    ></div>
                    {post?.mentionedUsers?.length > 0 && (
                      <div className="px-2 flex flex-wrap">
                        {post?.mentionedUsers?.map((user, index) => {
                          return (
                            <Link
                              key={index}
                              className="text-zinc-500 px-2"
                              onClick={() => {}}
                              to={`/users/${user?.userId || user}/profile`}
                            >
                              {currentUser === user?.userId && post.userId ? (
                                <div className="flex items-center">
                                  @{user?.username}
                                  <span className="text-sm">
                                    &nbsp;(author)
                                  </span>
                                </div>
                              ) : (
                                <span>@{user?.username}</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    <Carousel
                      className="carousel px-4"
                      showThumbs={false}
                      autoPlay={false}
                      infiniteLoop={true}
                      showStatus={false}
                      emulateTouch={true}
                      useKeyboardArrows={true}
                      swipeable={true}
                      showArrows={true}
                      showIndicators={post.fileURLs.length > 1 ? true : false}
                    >
                      {post?.fileURLs?.map((fileURL, index) => (
                        <div key={index} className="relative mx-[.25px]">
                          {fileURL?.includes(".mp4") ? (
                            <video
                              onClick={() => {
                                handlePlayPause(index);
                              }}
                              onEnded={handleEnded}
                              ref={videoRef}
                              autoFocus={true}
                              className="h-full w-full object-contain rounded-md"
                            >
                              <source src={fileURL} type="video/mp4" />
                            </video>
                          ) : (
                            <img
                              src={fileURL}
                              alt=""
                              className="h-full w-full object-contain rounded-md"
                            />
                          )}
                          {fileURL?.includes(".mp4") && (
                            <button
                              onClick={() => handlePlayPause()}
                              className="z-20 absolute top-[50%]"
                            >
                              {isPlaying ? (
                                <BiPause className="z-20" size={40} />
                              ) : (
                                <BiPlay className="z-20" size={40} />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </Carousel>
                    <div className="flex items-center justify-between h-fit px-4 py-1">
                      <div className="flex items-center space-x-6">
                        <div
                          className="flex space-x-1 items-center cursor-pointer"
                          onClick={() => handleLikePost(post?.id, currentUser)}
                        >
                          {post?.likes?.includes(currentUser) ? (
                            <BsHeartFill
                              size={20}
                              className="text-red-600 cursor-pointer"
                            />
                          ) : (
                            <SlHeart size={20} />
                          )}
                        </div>
                        <Link to={`/posts/${post?.id}`}>
                          <div className="flex items-center space-x-1">
                            <SlBubble size={20} />
                          </div>
                        </Link>
                        <SlPaperPlane size={20} />
                      </div>
                      <div
                        className=""
                        onClick={() => handleSavePost(post?.id, currentUser)}
                      >
                        {post?.saves?.includes(currentUser) ? (
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
                    <div className="flex flex-col -space-y-1 px-4">
                      {post?.likes?.length !== 0 && (
                        <div className="flex items-center">
                          {post?.likes?.length !== 0 && (
                            <span>{post?.likes?.length}</span>
                          )}
                          <span>
                            &nbsp;{post?.likes?.length === 1 ? "like" : "likes"}
                          </span>
                        </div>
                      )}
                      <span className="w-full text-sm text-zinc-400">
                        {post?.timeStamp
                          ? formatTime(post?.timeStamp, "PPpp")
                          : "not provided"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full flex justify-center mt-10">
              <span>0 posts? &nbsp;</span>
              <Link
                to="/createPost"
                className="underline underline-offset-2 decoration-slate-400"
              >
                Create a Post
              </Link>{" "}
            </div>
          )}
        </div>
      ) : (
        <div>{!currentUser && <span>{error}</span>}</div>
      )}
    </>
  );
};

export default UserPosts;
