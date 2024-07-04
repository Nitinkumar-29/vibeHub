import React, { useContext, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { TfiArrowCircleLeft } from "react-icons/tfi";
import { Carousel } from "react-responsive-carousel";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsHeartFill, BsSave } from "react-icons/bs";
import { RxBookmarkFilled, RxPaperPlane } from "react-icons/rx";
import { BiCopy, BiLoader } from "react-icons/bi";
import { FiTrash2 } from "react-icons/fi";
import PostContext from "../context/PostContext/PostContext";
import { useParams } from "react-router-dom";
import { PiBookmarkSimpleThin } from "react-icons/pi";

const Post = () => {
  const {
    postData,
    navigate,
    postComment,
    setPostComment,
    postComments,
    isPublished,
    formatDate,
    handleDeleteComment,
    handleLikeComment,
    handleLikePost,
    handlePostComment,
    currentUser,
    fetchPostById,
    fetchPostComments,
  } = useContext(PostContext);
  const { id } = useParams();

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
  }, [id]);
  return (
    <div
      className="overflow-y-auto h-screen"
    >
      <div className="flex flex-col items-center mb-16">
        <div className="flex items-center justify-center bg-zinc-950 w-full h-16">
          <div className="flex justify-between items-center h-12 p-2 w-full">
            <div className="flex items-center space-x-2">
              <TfiArrowCircleLeft
                onClick={() => {
                  navigate(-1);
                }}
                size={25}
              />
            </div>
          </div>
        </div>
        {postData ? (
          <div className="flex flex-col items-center space-y-2 py-2">
            {postData?.userId && (
              <div className="flex flex-col space-y-3 w-full h-fit border-[1px] rounded-md border-blue-950 bg-zinc-900">
                <div className="h-16 border-y-[1px] border-blue-900 flex items-center space-x-4 w-full justify-start p-2">
                  {postData?.userProfileImage ? (
                    <img
                      src={postData?.userProfileImage}
                      className="h-12 w-12 duration-200 rounded-full border-[1px] border-blue-900"
                      alt=""
                    />
                  ) : (
                    <FaUser size={48} />
                  )}
                  <div className="flex justify-between space-x-1 w-full">
                    <span className="font-medium">{postData?.name}</span>
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
                      <div key={index} className="relative px-2">
                        {fileURL.endsWith(".mp4") ? (
                          <video
                            controls
                            className="h-[10rem] w-[10rem] object-none rounded-md border-[1px] border-blue-950"
                          >
                            <source src={fileURL} type="video/*" />
                          </video>
                        ) : (
                          <img
                            src={fileURL}
                            alt="post media"
                            className="h-[18rem] w-[18rem] object-cover rounded-md border-[1px] border-blue-950"
                          />
                        )}
                      </div>
                    ))}
                </Carousel>
                <div className="flex items-center justify-between h-10 p-2">
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
                      {postData?.likes?.length >= 0 && (
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
                  <span className="text-sm text-zinc-400">
                    {postData.timeStamp
                      ? formatDate(postData.timeStamp, "PPpp")
                      : "not provided"}
                  </span>
                  <div className="">
                    {postData?.saved ? (
                      <RxBookmarkFilled className="text-red-600 cursor-pointer" size={28} />
                    ) : (
                      <PiBookmarkSimpleThin size={28} className="cursor-pointer" />
                    )}
                  </div>
                </div>
              </div>
            )}
            {postData?.userId && (
              <div className="flex flex-col items-center space-y-4 w-[95%] bg-zinc-900 rounded-md border-blue-950 border-[1px] p-2">
                <span className="w-full">
                  Comments: &nbsp;{postData.commentCounts}
                </span>
                <form onSubmit={postCommentById} className="w-full ">
                  <textarea
                    type="textarea"
                    placeholder="Post a comment"
                    className="outline-none w-full bg-inherit"
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
                    className="p-2 rounded-md duration-200 cursor-pointer outline-none border-[1px]"
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
                        className="flex flex-col space-y-2 p-2 border-[1px] rounded-md w-full"
                      >
                        <div className="flex w-full items-center justify-between">
                          {
                            <div className="flex w-full justify-between items-center">
                              <div className="flex items-center space-x-1">
                                {comment.userProfileImage ? (
                                  <img
                                    src={comment.userProfileImage}
                                    className="h-8 w-8 rounded-full border-[1px]"
                                    alt=""
                                  />
                                ) : (
                                  <FaUser className="h-8 w-8 border-[1px] rounded-full border-blue-800" />
                                )}
                                {postData.userId === comment.userId ? (
                                  <div className="flex items-center space-x-1">
                                    <span>{comment.name}</span>{" "}
                                    <span className="text-zinc-500">
                                      (author)
                                    </span>
                                  </div>
                                ) : (
                                  <span>{comment.name}</span>
                                )}
                              </div>
                              <span>
                                {comment.timeStamp &&
                                  formatDate(comment.timeStamp, "PPpp")}
                              </span>
                            </div>
                          }
                          {(currentUser.uid === postData.userId ||
                            currentUser.uid === comment.userId) && (
                            <FiTrash2
                              className="cursor-pointer"
                              onClick={() =>
                                handleDeleteComment(comment.id, id)
                              }
                            />
                          )}
                        </div>
                        <div className="tracking-tighter">
                          {comment.comment}
                        </div>
                        <div className="flex items-center w-full space-x-4">
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
                              {comment.likesCount}
                            </span>
                          </div>
                          <SlBubble size={18} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default Post;
