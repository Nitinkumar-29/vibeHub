import React, { useContext, useEffect, useRef, useState } from "react";
import PostContext from "../context/PostContext/PostContext";
import { Link } from "react-router-dom";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { RxBookmarkFilled } from "react-icons/rx";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsHeartFill } from "react-icons/bs";
import { Carousel } from "react-responsive-carousel";
import { BiCopy, BiPause, BiPlay } from "react-icons/bi";
import { FaUser } from "react-icons/fa";
import { formatTime } from "../utils/FormatTime";

const UserSavedPosts = () => {
  const { handleFetchSavedPosts, savedPosts, handleLikePost, handleSavePost } =
    useContext(PostContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const currentUser = localStorage.getItem("currentUser");

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

  useEffect(() => {
    if (currentUser) {
      handleFetchSavedPosts();
    }
    // eslint-disable-next-line
  }, [currentUser]);

  return (
    <div className="flex items-center w-full border-t-[1px] border-blue-950 justify-center pb-1">
      {savedPosts && savedPosts.length === 0 ? (
        <div className="mt-4">
          0 posts? <Link to="/">Try saving a post now</Link>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {savedPosts?.map((savedPost) => (
            <div
              key={savedPost.id}
              className="flex flex-col -space-y-1 w-full h-fit"
            >
              <div className="h-16 flex items-center space-x-4 w-full justify-start px-3">
                {savedPost.user?.img ? (
                  <img
                    src={savedPost.user.img}
                    className="h-12 w-12 duration-200 rounded-full"
                    alt=""
                  />
                ) : (
                  <FaUser size={30} />
                )}
                <div className="flex justify-between space-x-1 w-full">
                  <Link
                    onClick={() => {
                      window.scrollTo(0, 0);
                    }}
                    to={
                      currentUser === savedPost.userId
                        ? `/userProfile/yourPosts`
                        : `/users/${savedPost?.userId}/profile`
                    }
                    className="flex flex-col -space-y-1 font-medium"
                  >
                    <span>{savedPost.user?.name}</span>
                    <span className="text-sm text-zinc-600">
                      {" "}
                      @{savedPost.user?.user_name}
                    </span>
                  </Link>
                </div>
              </div>
              <div className="flex flex-wrap">
                <p className="px-4">{savedPost.postCaption}</p>
                {savedPost?.mentionedUsers?.map((user, index) => (
                  <Link
                    key={index}
                    onClick={() => {
                      window.scrollTo(0, 0);
                    }}
                    to={
                      currentUser === user?.userId
                        ? `/userProfile/yourPosts`
                        : `/users/${user?.userId}/profile`
                    }
                    className="text-zinc-500 px-4"
                  >
                    @{user?.username}
                  </Link>
                ))}
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
                showIndicators={
                  savedPost && savedPost?.fileURLs.length > 1 ? true : false
                }
              >
                {Array.isArray(savedPost.fileURLs) &&
                  savedPost.fileURLs.map((fileURL, index) => (
                    <div key={index} className="relative my-1">
                      {fileURL.includes(".mp4") ? (
                        <video
                          onClick={() => {
                            handlePlayPause(index);
                          }}
                          onEnded={handleEnded}
                          ref={videoRef}
                          autoFocus={true}
                          className="h-full w-full object-contain rounded-sm "
                        >
                          <source src={fileURL} type="video/mp4" />
                        </video>
                      ) : (
                        <img
                          src={fileURL}
                          alt="post media"
                          className="h-full w-full object-contain rounded-sm "
                        />
                      )}
                      {fileURL.includes(".mp4") && (
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
              <div className="flex items-center justify-between h-10 px-4 w-full">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <span onClick={() => handleLikePost(savedPost.id)}>
                      {savedPost?.likes?.includes(currentUser) ? (
                        <BsHeartFill
                          size={20}
                          className="text-red-600 cursor-pointer"
                        />
                      ) : (
                        <SlHeart className="cursor-pointer" size={20} />
                      )}
                    </span>
                  </div>
                  <Link
                    onClick={() => {
                      window.scrollTo(0, 0);
                    }}
                    to={`/posts/${savedPost?.id}`}
                    className="flex items-center space-x-1"
                  >
                    <SlBubble size={20} />
                  </Link>
                  <SlPaperPlane size={20} />
                </div>

                <div
                  onClick={() => {
                    handleSavePost(savedPost.id);
                  }}
                >
                  {savedPost?.saves?.includes(currentUser) ? (
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
              <div className="flex flex-col items-start pb-2 -space-y-1 w-fit px-4">
                {savedPost?.likes?.length !== 0 && (
                  <span className="w-fit">
                    {savedPost?.likes?.length !== 0 && savedPost?.likes?.length}
                    &nbsp;{savedPost?.likes?.length === 1 ? "like" : "likes"}
                  </span>
                )}
                <span className="text-sm text-zinc-400">
                  {savedPost?.timeStamp &&
                    formatTime(savedPost?.timeStamp, "PPpp")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSavedPosts;
