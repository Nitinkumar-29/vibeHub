import React, { useContext, useEffect } from "react";
import PostContext from "../context/PostContext/PostContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { RxBookmarkFilled } from "react-icons/rx";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsHeartFill } from "react-icons/bs";
import { Carousel } from "react-responsive-carousel";
import { BiCopy } from "react-icons/bi";
import { FaUser } from "react-icons/fa";
import { formatTime } from "../utils/FormatTime";

const UserSavedPosts = () => {
  const {
    handleFetchSavedPosts,
    savedPosts,
    currentUser,
    handleLikePost,
    handleSavePost,
  } = useContext(PostContext);

  useEffect(() => {
    if (currentUser?.uid) {
      handleFetchSavedPosts();
    }
    // eslint-disable-next-line
  }, [currentUser?.uid]);

  return (
    <div className="flex items-center w-full border-t-[1px] border-blue-950 justify-center pb-14">
      {savedPosts && savedPosts.length === 0 ? (
        <div className="mt-4">
          0 posts? <Link to="/">Try saving a post now</Link>
        </div>
      ) : (
        <div className="w-full">
          {savedPosts?.map((savedPost) => (
            <div
              key={savedPost.id}
              className="flex flex-col space-y-1 w-full h-fit"
            >
              <div className="h-16 border-t-[1px] border-blue-950 flex items-center space-x-4 w-full justify-start p-4">
                {savedPost.user?.img ? (
                  <img
                    src={savedPost.user.img}
                    className="h-12 w-12 duration-200 rounded-full border-[1px] border-blue-900"
                    alt=""
                  />
                ) : (
                  <FaUser size={30} />
                )}
                <div className="flex justify-between space-x-1 w-full">
                  <Link
                    to={`/users/${savedPost?.userId}/profile`}
                    className="flex flex-col -space-y-1 font-medium"
                  >
                    <span>{savedPost.user?.name}</span>
                    <span className="text-sm text-zinc-600">
                      {" "}
                      @{savedPost.user?.user_name}
                    </span>
                  </Link>
                  <span
                    className="cursor-pointer text-slate-500 hover:text-white duration-200"
                    onClick={() => {
                      const fullUrl = window.location.href;
                      navigator.clipboard.writeText(fullUrl);
                    }}
                  >
                    <BiCopy size={20} />
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap">
                <p className="p-2">{savedPost.postCaption}</p>
                {savedPost?.mentionedUsers?.map((user, index) => (
                  <Link
                    key={index}
                    onClick={() => {
                    }}
                    to={`/users/${user?.userId}/profile`}
                    className="text-zinc-500 px-2"
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
                showIndicators={true}
              >
                {Array.isArray(savedPost.fileURLs) &&
                  savedPost.fileURLs.map((fileURL, index) => (
                    <div key={index} className="relative">
                      {fileURL.includes(".mp4") ? (
                        <video
                          controls
                          className="h-full w-full object-contain rounded-sm border-[1px] border-blue-950"
                        >
                          <source src={fileURL} type="video/*" />
                        </video>
                      ) : (
                        <div className="">
                          <img
                            src={fileURL}
                            alt="post media"
                            className="h-fit w-fit object-contain rounded-sm border-[1px] border-blue-950"
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </Carousel>
              <div className="flex items-center justify-between h-10 px-4 w-full">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <span onClick={() => handleLikePost(savedPost.id)}>
                      {savedPost?.likes?.includes(currentUser.uid) ? (
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
                  {savedPost?.saves?.includes(currentUser.uid) ? (
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
              <div className="flex flex-col items-start pb-2  w-fit px-4">
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
