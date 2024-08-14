import React, { useContext, useEffect, useRef, useState } from "react";
import { FaUser } from "react-icons/fa";
import { Carousel } from "react-responsive-carousel";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsHeartFill } from "react-icons/bs";
import { RxBookmarkFilled } from "react-icons/rx";
import { BiCopy, BiLoader, BiPause, BiPlay } from "react-icons/bi";
import { FiTrash2 } from "react-icons/fi";
import PostContext from "../context/PostContext/PostContext";
import { Link, useParams } from "react-router-dom";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { GoPaperAirplane } from "react-icons/go";
import ThemeContext from "../context/Theme/ThemeContext";
import { formatTime } from "../utils/FormatTime";
import { CgSpinner } from "react-icons/cg";
import { HighLightLinks } from "../utils/HighlightLinks";

const Post = () => {
  const {
    postData,
    userDataWithPostId,
    postComment,
    setPostComment,
    postComments,
    isPublished,
    handleDeleteComment,
    handleLikeComment,
    handleLikePost,
    handlePostComment,
    fetchPostById,
    fetchPostComments,
    handleSavePost,
  } = useContext(PostContext);
  const { theme } = useContext(ThemeContext);
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const currentUser = localStorage.getItem("currentUser");

  const handlePlayPause = () => {
    videoRef.current.click();
    if (isPlaying === false) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const postCommentById = (e) => {
    e.preventDefault();
    handlePostComment(id);
  };
  useEffect(() => {
    fetchPostById(id);
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    fetchPostComments(id);
    // eslint-disable-next-line
  }, [id]);

  return (
    <div className="flex flex-col items-center pb-14 w-full h-full max-w-[447px]">
      {postData ? (
        <div className="flex flex-col items-center py-2 w-full">
          {postData?.userId && (
            <div className="flex flex-col w-full h-fit">
              <div className="h-16 flex items-center space-x-2 w-full justify-start p-4">
                {userDataWithPostId?.img ? (
                  <img
                    src={userDataWithPostId?.img}
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
                      currentUser && currentUser === postData?.userId
                        ? `/userProfile/yourPosts`
                        : `/users/${postData?.userId}/profile`
                    }
                    className="flex flex-col -space-y-1 font-medium"
                  >
                    <span>{userDataWithPostId?.name}</span>
                    <span className="text-sm text-zinc-600">
                      {" "}
                      @{userDataWithPostId?.user_name}
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
              <div className="flex flex-wrap py-1">
                <p
                  className="px-4 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: HighLightLinks(postData?.postCaption),
                  }}
                />
                {postData?.mentionedUsers?.map((user, index) => (
                  <Link
                    key={index}
                    onClick={() => {
                      console.log(user?.userId, user?.username);
                    }}
                    to={
                      currentUser && currentUser === user?.userId
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
                className="carousel px-4"
                showThumbs={false}
                autoPlay={false}
                infiniteLoop={true}
                showStatus={false}
                emulateTouch={true}
                useKeyboardArrows={true}
                swipeable={true}
                showArrows={true}
                showIndicators={postData.fileURLs.length > 1 ? true : false}
              >
                {Array.isArray(postData.fileURLs) &&
                  postData.fileURLs.map((fileURL, index) => {
                    return (
                      <div key={index} className=" relative">
                        {fileURL.includes(".mp4") ? (
                          <video
                            onClick={() => {
                              handlePlayPause(index);
                            }}
                            onEnded={handleEnded}
                            ref={videoRef}
                            autoFocus={true}
                            className="h-[80%] w-full object-contain rounded-md "
                          >
                            <source src={fileURL} type="video/mp4" />
                          </video>
                        ) : (
                          <img
                            src={fileURL}
                            alt=""
                            className="h-fit w-fit object-contain rounded-md"
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
                    );
                  })}
              </Carousel>
              <div className="flex items-center justify-between h-10 px-4 w-full">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <span onClick={() => handleLikePost(id)}>
                      {postData?.likes?.includes(currentUser) ? (
                        <BsHeartFill
                          size={20}
                          className="text-red-600 cursor-pointer"
                        />
                      ) : (
                        <SlHeart className="cursor-pointer" size={20} />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <SlBubble size={20} />
                    <span>
                      {postComments.length !== 0 && postComments.length}
                    </span>
                  </div>
                  <SlPaperPlane size={20} />
                </div>

                <div
                  onClick={() => {
                    handleSavePost(id);
                  }}
                >
                  {postData?.saves?.includes(currentUser) ? (
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
              <div className="flex flex-col items-start px-4 w-fit">
                <div>
                  {postData?.likes?.length !== 0 && (
                    <span>{postData?.likes?.length}&nbsp;</span>
                  )}
                  {postData?.likes?.length !== 0 && (
                    <span>
                      {postData?.likes?.length > 1 ? "likes" : "like"}
                    </span>
                  )}
                </div>
                <span className="text-sm text-zinc-400">
                  {postData?.timeStamp &&
                    formatTime(postData?.timeStamp, "PPpp")}
                </span>
              </div>
            </div>
          )}
          {postData?.userId && (
            <div className="flex flex-col items-center space-y-4 w-full rounded-sm pb-16">
              <div
                className={`flex items-end w-[93%] space-x-1 my-5 mx-auto border-b-[1px] ${
                  theme === "dark" ? "border-gray-400" : "border-gray-800"
                }`}
              >
                <input
                  type="text"
                  placeholder="Post a comment"
                  className={`outline-none  w-full bg-inherit p-2`}
                  name="commentText"
                  required
                  onChange={(e) => {
                    setPostComment({
                      ...postComment,
                      [e.target.name]: e.target.value,
                    });
                  }}
                  value={postComment.commentText}
                />
                <button
                  onClick={postCommentById}
                  className="p-2 rounded-md duration-200 cursor-pointer outline-none"
                >
                  {isPublished === true && <GoPaperAirplane size={20} />}
                  {isPublished === false && (
                    <BiLoader size={20} className="animate-spin" />
                  )}
                </button>
              </div>
              <div className="flex flex-col space-y-2 w-full">
                {postComments.length > 0 && (
                  <div>
                    {" "}
                    <span className="w-full text-lg px-4">Comments&nbsp;</span>
                  </div>
                )}
                {postComments
                  ?.sort((a, b) => b.timeStamp - a.timeStamp)
                  ?.map((comment) => {
                    return (
                      <div
                        key={comment.id}
                        className="flex flex-col items-center space-y-2 p-2 rounded-ms w-full"
                      >
                        <div className="flex w-full items-start justify-between px-2">
                          {
                            <div className="flex w-full justify-between items-center">
                              <div className="flex items-center space-x-1">
                                {comment?.user?.img ? (
                                  <img
                                    src={comment?.user?.img}
                                    className="h-8 w-8 rounded-full border-[1px]"
                                    alt=""
                                  />
                                ) : (
                                  <FaUser className="h-8 w-8 border-[1px] rounded-full border-blue-800" />
                                )}
                                {postData.userId === comment.userId ? (
                                  <Link
                                    onClick={() => {
                                      window.scrollTo(0, 0);
                                    }}
                                    to={
                                      currentUser &&
                                      currentUser === comment.userId
                                        ? `/userProfile/yourPosts`
                                        : `/users/${comment?.userId}/profile`
                                    }
                                    className="flex flex-col items-start -space-y-1 px-2"
                                  >
                                    <div className="">
                                      <span>{comment?.user?.name}</span>
                                      <span className="text-zinc-500">
                                        &nbsp;(author)
                                      </span>
                                    </div>
                                    <span className="text-sm text-zinc-600">
                                      @{comment?.user?.user_name}
                                    </span>{" "}
                                  </Link>
                                ) : (
                                  <Link
                                    onClick={() => {
                                      window.scrollTo(0, 0);
                                    }}
                                    to={
                                      currentUser &&
                                      currentUser === comment.userId
                                        ? `/userProfile/yourPosts`
                                        : `/users/${comment?.userId}/profile`
                                    }
                                    className="flex space-x-1"
                                  >
                                    <span>{comment?.user?.name}</span>

                                    <span className="text-zinc-600">
                                      @{comment?.user?.user_name}
                                    </span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          }
                          {((currentUser && currentUser === postData.userId) ||
                            (currentUser &&
                              currentUser === comment?.userId)) && (
                            <FiTrash2
                              className="cursor-pointer"
                              onClick={() =>
                                handleDeleteComment(comment.id, id)
                              }
                            />
                          )}
                        </div>
                        <div className="w-full tracking-tighter px-2">
                          {comment.comment}
                        </div>
                        <div className="flex items-center w-full px-2 space-x-4">
                          <div className="flex items-center space-x-1">
                            <div
                              className="flex space-x-1 items-center"
                              onClick={() => handleLikeComment(comment.id, id)}
                            >
                              {comment?.likes?.includes?.(currentUser) ? (
                                <BsHeartFill
                                  className="text-red-600 cursor-pointer"
                                  size={18}
                                />
                              ) : (
                                <SlHeart className="cursor-pointer" size={18} />
                              )}
                              <span>{comment?.likesCount}</span>
                            </div>
                            <span className="text-sm">
                              {!comment.likesCount === 0 && comment.likesCount}
                            </span>
                          </div>
                          {/* <SlBubble size={18} /> */}
                        </div>
                        {comment.timeStamp && (
                          <div
                            className={`text-sm w-full px-2 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-800"
                            }`}
                          >
                            {comment.comment &&
                              formatTime(
                                comment.timeStamp && comment.timeStamp
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <CgSpinner className="mt-52 animate-spin" size={30} />
      )}
    </div>
  );
};

export default Post;
