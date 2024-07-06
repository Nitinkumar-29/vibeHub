import React, { useContext, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { Carousel } from "react-responsive-carousel";
import { SlBubble, SlHeart, SlPaperPlane, SlPin } from "react-icons/sl";
import { BsHeartFill } from "react-icons/bs";
import { RxBookmarkFilled, RxPaperPlane } from "react-icons/rx";
import { BiCopy, BiLoader } from "react-icons/bi";
import { FiTrash2 } from "react-icons/fi";
import PostContext from "../context/PostContext/PostContext";
import { useParams } from "react-router-dom";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { formatDistance, formatDistanceToNow } from "date-fns";
import { FaSpinner } from "react-icons/fa6";
import { formatTime } from "../utils/FormatTime";

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
    currentUser,
    fetchPostById,
    fetchPostComments,
    handleSavePost,
  } = useContext(PostContext);
  const { id } = useParams();

  const formatDate = (timestamp) => {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    return formatDistanceToNow(date, { addSuffix: true });
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
    <div className="flex flex-col items-center pb-14 w-full min-h-screen max-w-[447px]">
      {postData ? (
        <div className="flex flex-col items-center py-2 w-full">
          {postData?.userId && (
            <div className="flex flex-col space-y-1 w-full h-fit">
              <div className="h-16 border-t-[1px] border-blue-950 flex items-center space-x-4 w-full justify-start p-4">
                {userDataWithPostId?.img ? (
                  <img
                    src={userDataWithPostId?.img}
                    className="h-12 w-12 duration-200 rounded-full border-[1px] border-blue-900"
                    alt=""
                  />
                ) : (
                  <FaUser size={30} />
                )}
                <div className="flex justify-between space-x-1 w-full">
                  <span className="font-medium">
                    {userDataWithPostId?.name}
                  </span>
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
              <p className="p-2">{postData.postCaption}</p>
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
                {Array.isArray(postData.fileURLs) &&
                  postData.fileURLs.map((fileURL, index) => (
                    <div key={index} className="relative">
                      {fileURL.endsWith(".mp4") ? (
                        <video
                          controls
                          className="h-[10rem] w-[10rem] object-none rounded-sm border-[1px] border-blue-950"
                        >
                          <source src={fileURL} type="video/*" />
                        </video>
                      ) : (
                        <img
                          src={fileURL}
                          alt="post media"
                          className="h-[18rem] w-[18rem] object-cover rounded-sm border-[1px] border-blue-950"
                        />
                      )}
                    </div>
                  ))}
              </Carousel>
              <div className="flex items-center justify-between h-10 px-4 w-full">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1">
                    <span onClick={() => handleLikePost(id)}>
                      {postData?.likes?.includes(currentUser.uid) ? (
                        <BsHeartFill
                          size={20}
                          className="text-red-600 cursor-pointer"
                        />
                      ) : (
                        <SlHeart className="cursor-pointer" size={20} />
                      )}
                    </span>
                    {postData?.likes?.length !== 0 && (
                      <span>{postData?.likes?.length}</span>
                    )}
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
                    handleSavePost(postData.id, currentUser.uid);
                  }}
                >
                  {postData?.saves?.includes(currentUser.uid) ? (
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
              <span className="text-sm text-zinc-400 px-4">
                {postData?.timeStamp && formatDate(postData?.timeStamp, "PPpp")}
              </span>
            </div>
          )}
          {postData?.userId && (
            <div className="flex flex-col items-center space-y-4 w-full rounded-sm">
              <span className="w-full px-4 mt-3">Comments</span>
              <form onSubmit={postCommentById} className="w-full ">
                <textarea
                  type="textarea"
                  placeholder="Post a comment"
                  className="outline-none w-full bg-zinc-950 px-4"
                  rows={3}
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
                  type="submit"
                  className="p-2 rounded-md duration-200 cursor-pointer outline-none mx-4 border-[1px]"
                >
                  {isPublished === true && <RxPaperPlane size={20} />}
                  {isPublished === false && (
                    <BiLoader size={20} className="animate-spin" />
                  )}
                </button>
              </form>
              <div className="flex flex-col space-y-2 w-full">
                {postComments?.map((comment) => {
                  return (
                    <div
                      key={comment.id}
                      className="flex flex-col items-center space-y-2 p-2 border-t-[1px] rounded-ms w-full"
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
                                <div className="flex items-center space-x-1">
                                  <span>{comment?.user?.name}</span>{" "}
                                  <span className="text-zinc-500">
                                    (author)
                                  </span>
                                </div>
                              ) : (
                                <span>{comment?.user?.name}</span>
                              )}
                            </div>
                            <span>
                              {comment.timeStamp?.seconds &&
                                formatDistance(
                                  comment.timeStamp?.seconds,
                                  "PPpp"
                                )}
                            </span>
                          </div>
                        }
                        {(currentUser.uid === postData.userId ||
                          currentUser.uid === comment?.userId) && (
                          <FiTrash2
                            className="cursor-pointer"
                            onClick={() => handleDeleteComment(comment.id, id)}
                          />
                        )}
                      </div>
                      <div className="w-full tracking-tighter px-2">
                        {comment.comment}
                      </div>
                      <div className="flex items-center w-full px-2 space-x-4">
                        <div className="flex items-center space-x-1">
                          <div
                            onClick={() => handleLikeComment(comment.id, id)}
                          >
                            {comment?.likes?.includes?.(currentUser.uid) ? (
                              <BsHeartFill
                                className="text-red-600 cursor-pointer"
                                size={18}
                              />
                            ) : (
                              <SlHeart className="cursor-pointer" size={18} />
                            )}
                          </div>
                          <span className="text-sm">
                            {!comment.likesCount === 0 && comment.likesCount}
                          </span>
                        </div>
                        <SlBubble size={18} />
                      </div>
                      {/* <span className="w-full px-2 text-sm text-zinc-400">
                        {comment?.timeStamp
                          ? formatTime(comment?.timeStamp, "PPpp")
                          : "not provided"}
                      </span> */}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <FaSpinner className="mt-52 animate-spin" size={30} />
      )}
    </div>
  );
};

export default Post;
