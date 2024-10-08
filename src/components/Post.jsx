import React, { useContext, useEffect, useRef, useState } from "react";
import { FaUser } from "react-icons/fa";
import { Carousel } from "react-responsive-carousel";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsEmojiSmile, BsHeartFill } from "react-icons/bs";
import { RxBookmarkFilled } from "react-icons/rx";
import { BiCopy, BiLoader, BiPause, BiPlay } from "react-icons/bi";
import { FiTrash2 } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { PostLink } from "../utils/PostedLinks";
import { GoPaperAirplane } from "react-icons/go";
import { formatTime } from "../utils/FormatTime";
import { CgSpinner } from "react-icons/cg";
import EmojiPicker from "emoji-picker-react";
import PostContext from "../context/PostContext/PostContext";
import { AuthContext } from "../context/AuthContext";
import ThemeContext from "../context/Theme/ThemeContext";

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
  const { currentUserData } = useContext(AuthContext);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [pickerPosition, setPickerPosition] = useState("bottom"); // Default to bottom
  const commentInputRef = useRef(null);

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

  const handlePickerPosition = () => {
    if (commentInputRef.current) {
      const inputRect = commentInputRef.current.getBoundingClientRect();
      const distanceFromTop = inputRect.top;
      const distanceFromBottom = window.innerHeight - inputRect.bottom;

      // Determine picker position based on distance
      if (distanceFromBottom < 400 && distanceFromTop > 400) {
        setPickerPosition("top");
      } else {
        setPickerPosition("bottom");
      }
    }
  };

  useEffect(() => {
    handlePickerPosition();
  }, [emojiPickerOpen]);

  return (
    <div className="flex flex-col items-center pb-14 w-full h-full">
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
              <div className="py-1">
                {postData?.postCaption && (
                  <div
                    className="whitespace-pre-wrap px-4 pb-2"
                    dangerouslySetInnerHTML={{
                      __html: PostLink(postData?.postCaption.trim()),
                    }}
                  ></div>
                )}
                <div className="flex flex-wrap px-4">
                  {postData?.mentionedUsers?.map((user, index) => (
                    <Link
                      key={index}
                      onClick={() => {}}
                      to={
                        currentUser && currentUser === user?.userId
                          ? `/userProfile/yourPosts`
                          : `/users/${user?.userId}/profile`
                      }
                      className="text-zinc-500 px-1"
                    >
                      @{user?.username}
                    </Link>
                  ))}
                </div>
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
            <div className="flex flex-col items-center w-full rounded-sm pb-16">
              <div
                className={`flex items-end w-[93%] space-x-1 my-5 mx-auto border-b-[1px] pb-1 ${
                  theme === "dark" ? "border-gray-400" : "border-gray-800"
                }`}
              >
                <div className="relative flex space-x-1 items-center w-full">
                  <img
                    src={currentUserData?.img}
                    className="h-8 min-w-8 max-w-8 rounded-full"
                    alt=""
                  />
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder="Post a comment"
                    className="outline-none w-full bg-inherit p-2"
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
                  {emojiPickerOpen && (
                    <div
                      className={`z-10 flex self-center absolute mx-auto w-full ${
                        pickerPosition === "top" ? "bottom-14" : "top-14"
                      }`}
                    >
                      <EmojiPicker
                        reactionsDefaultOpen={emojiPickerOpen}
                        allowExpandReactions={emojiPickerOpen}
                        emojiStyle="google"
                        searchDisabled
                        suggestedEmojisMode={false}
                        onEmojiClick={(event) => {
                          setEmojiPickerOpen(false);
                          setPostComment((prev) => ({
                            ...prev,
                            commentText: prev.commentText + event.emoji,
                          }));
                        }}
                        height={300}
                      />
                    </div>
                  )}
                </div>

                <div className="relative flex space-x-1 items-center">
                  <BsEmojiSmile
                    className="cursor-pointer"
                    onClick={() => {
                      setEmojiPickerOpen(!emojiPickerOpen);
                    }}
                    size={20}
                  />
                  <button
                    disabled={postComment.commentText.length === 0}
                    onClick={postCommentById}
                    className={`p-2 rounded-md duration-200 ${
                      postComment.commentText.length === 0
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    } outline-none`}
                  >
                    {isPublished === true && <GoPaperAirplane size={25} />}
                    {isPublished === false && (
                      <BiLoader size={20} className="animate-spin" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col w-full items-center">
                {postComments?.length > 0 && (
                  <span
                    className={`w-full text-lg px-4 mb-2 ${
                      theme === "dark" ? "text-zinc-300" : "text-zinc-900"
                    }`}
                  >
                    {postComments.length !== 0 && postComments.length}&nbsp;
                    {postComments.length !== 0 && postComment.length === 1
                      ? "Comment"
                      : "Comments"}{" "}
                  </span>
                )}
                {postComments?.length > 0 ? (
                  postComments
                    ?.sort((a, b) => b.timeStamp - a.timeStamp)
                    ?.map((comment) => {
                      return (
                        <div
                          key={comment.id}
                          className={`flex flex-col items-center space-y-2 p-2 w-full border-b-[1px] border-zinc-600 last:border-b-0`}
                        >
                          <div className="flex w-full items-center justify-between px-2">
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
                            {((currentUser &&
                              currentUser === postData.userId) ||
                              (currentUser &&
                                currentUser === comment?.userId)) && (
                              <FiTrash2
                                className={`cursor-pointer ${
                                  theme === "dark"
                                    ? "text-zinc-300"
                                    : "text-zinc-900"
                                }`}
                                onClick={() =>
                                  handleDeleteComment(comment.id, id)
                                }
                              />
                            )}
                          </div>
                          <div
                            className={`w-full tracking-tighter px-2 ${
                              theme === "dark"
                                ? "text-zinc-400"
                                : "text-zinc-900"
                            }`}
                          >
                            {comment.comment}
                          </div>
                          <div className="flex items-center w-full px-2 space-x-4">
                            <div className="flex items-center space-x-1">
                              <div
                                className="flex space-x-1 items-center"
                                onClick={() =>
                                  handleLikeComment(comment.id, id)
                                }
                              >
                                {comment?.likes?.includes?.(currentUser) ? (
                                  <BsHeartFill
                                    className="text-red-600 cursor-pointer"
                                    size={18}
                                  />
                                ) : (
                                  <SlHeart
                                    className="cursor-pointer"
                                    size={18}
                                  />
                                )}
                                <span>{comment?.likesCount}</span>
                              </div>
                              <span className="text-sm">
                                {!comment.likesCount === 0 &&
                                  comment.likesCount}
                              </span>
                            </div>
                            {/* <SlBubble size={18} /> */}
                          </div>
                          {comment.timeStamp && (
                            <div
                              className={`text-sm w-full px-2 leading-3 ${
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
                    })
                ) : (
                  <span
                    className={`${
                      theme === "dark" ? "text-zinc-500" : "text-zinc-900"
                    }`}
                  >
                    0 comments? Be the first one to comment
                  </span>
                )}
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
