import React, { useContext, useEffect, useRef, useState } from "react";
import PostContext from "../context/PostContext/PostContext";
import ThemeContext from "../context/Theme/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Carousel } from "react-responsive-carousel";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsDot, BsHeartFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { RxBookmarkFilled } from "react-icons/rx";
import { BiDownload, BiPause, BiPlay } from "react-icons/bi";
import { formatTime } from "../utils/FormatTime";
import { CgSpinner } from "react-icons/cg";
import { IoNotificationsSharp } from "react-icons/io5";
import { PostLink } from "../utils/PostedLinks";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "../styles/overflow_scroll.css";

const Home = () => {
  const {
    handleLikePost,
    homePagePosts,
    fetchHomePagePosts,
    postsLoading,
    handleSavePost,
    otherPublicPostsHomePage,
  } = useContext(PostContext);
  const { theme } = useContext(ThemeContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const [selectedMedia, setselectedMedia] = useState(null);
  const currentUser = localStorage.getItem("currentUser");
  const { followRequestsData } = useContext(AuthContext);

  const handlePlayPause = (index) => {
    videoRef.current.click(index);
    if (isPlaying === false) {
      videoRef.current.play(index);
      setIsPlaying(true);
    } else {
      videoRef.current.pause(index);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (selectedMedia?.length > 0) {
      handleDownload(); // Trigger the download when media is selected
    }
    // eslint-disable-next-line
  }, [selectedMedia]);

  const handleDownload = async () => {
    try {
      if (!selectedMedia || selectedMedia.length === 0) {
        throw new Error("No media files selected for download.");
      }

      toast.loading("Downloading media...");

      // Download each media file
      for (const mediaUrl of selectedMedia) {
        const response = await fetch(mediaUrl, {
          mode: "cors",
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${mediaUrl}`);
        }

        const blob = await response.blob();
        const contentType = response.headers.get("content-type");

        // Extract the file extension from the content type
        let extension = "";
        if (contentType.includes("image")) {
          extension = contentType.split("/")[1]; // e.g., "jpeg", "png"
        } else if (contentType.includes("video")) {
          extension = contentType.split("/")[1]; // e.g., "mp4", "webm"
        }

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;

        // Extract filename from the URL or use a default name
        const filename =
          mediaUrl.split("/").pop().split("?")[0] || `download.${extension}`;
        link.download = `${filename}.${extension}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
      toast.dismiss();
      toast.success("Media downloaded successfully");
      setselectedMedia(null);
    } catch (error) {
      console.error("Error downloading the media:", error.message);
      toast.error("Failed to download media.");
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    fetchHomePagePosts();
    // eslint-disable-next-line
  }, [currentUser]);
  return (
    <>
      {!postsLoading ? (
        <div className="flex flex-col justify-center items-center h-fit bg-inherit">
          <div
            className={`z-20 fixed top-0 ${
              theme === "dark" ? "bg-black" : "bg-zinc-100"
            }  flex justify-between items-center bg-opacity-60 px-4 py-2 w-full max-w-[430px] backdrop-blur-3xl`}
          >
            <Link className="flex space-x-3 items-center text-2xl" to="/">
              <img
                src={`/images/logo.png`}
                className="h-8 w-8 rounded-md"
                alt=""
              />
              <span
                style={{ fontFamily: "sans-serif" }}
                className={`font-bold bg-clip-text text-transparent bg-gradient-to-tr from-red-600 via-blue-600 to-indigo-600`}
              >
                Vibehub
              </span>
            </Link>
            <Link to={`user/${currentUser}/notifications`} className="relative">
              <IoNotificationsSharp size={25} />
              {followRequestsData.length !== 0 && (
                <span className="text-red-600 absolute -top-2 left-3 font-medium">
                  <BsDot size={25} />
                </span>
              )}
            </Link>
          </div>
          <div className="flex justify-center w-full h-full pt-16 bg-inherit">
            <div className="flex flex-col w-full h-fit space-y-4">
              {homePagePosts.length > 0 ? (
                homePagePosts
                  .filter((post) => !post.archived === true)
                  ?.sort((a, b) => b.timeStamp - a.timeStamp)
                  .map((post, index) => (
                    <div
                      key={index}
                      className="w-full pb-3 border-b-[1px] border-zinc-500 last:border-b-0"
                    >
                      <div className="h-fit flex items-center rounded-sm space-x-4 w-full justify-start px-4 py-1">
                        {post?.userData?.img ? (
                          <img
                            src={post?.userData?.img}
                            className="h-12 w-12 object-cover duration-200 rounded-full"
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
                              currentUser === post?.userId
                                ? `/userProfile/yourPosts`
                                : `/users/${post?.userId}/profile`
                            }
                            className="flex flex-col -space-y-1 font-medium"
                          >
                            <span>{post?.userData?.name}</span>
                            <span className="text-sm text-zinc-600">
                              {" "}
                              @{post?.userData?.user_name}
                            </span>
                          </Link>
                        </div>
                        {post.fileURLs.length > 0 && (
                          <button
                            onClick={() => {
                              setselectedMedia(post?.fileURLs); // Set the selected media
                            }}
                          >
                            <BiDownload size={25} />
                          </button>
                        )}
                      </div>
                      <div className="w-full h-full ">
                        {post?.postCaption && (
                          <div
                            className="whitespace-pre-wrap px-4 pb-2 leading-snug"
                            dangerouslySetInnerHTML={{
                              __html: PostLink(post?.postCaption),
                            }}
                          ></div>
                        )}

                        <div className="px-2 pb-2 flex flex-wrap">
                          {post?.mentionedUsers?.map((user, index) => {
                            return (
                              <Link
                                key={index}
                                className="text-zinc-500 px-2"
                                onClick={() => {
                                  window.scrollTo(0, 0);
                                }}
                                to={
                                  currentUser === user?.userId
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
                                  <span>@{user?.username}</span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                        <div className="flex w-full my-1 px-4">
                          {post?.fileURLs?.length !== 0 && (
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
                                post && post?.fileURLs.length > 1 ? true : false
                              }
                            >
                              {post?.fileURLs?.map((fileURL, index) => (
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
                                      className="h-[540px] w-full object-cover rounded-md"
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
                                    <span className="z-20 absolute top-[50%]">
                                      {isPlaying ? (
                                        <BiPause
                                          onClick={() => {
                                            handlePlayPause(index);
                                          }}
                                          className="z-20"
                                          size={40}
                                        />
                                      ) : (
                                        <BiPlay
                                          onClick={() => {
                                            handlePlayPause(index);
                                          }}
                                          className="z-20"
                                          size={40}
                                        />
                                      )}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </Carousel>
                          )}
                        </div>
                        <div className="flex items-center justify-between h-fit pt-1 px-4">
                          <div className="flex items-center space-x-6">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() =>
                                handleLikePost(post?.id, currentUser)
                              }
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
                          <div
                            className=""
                            onClick={() =>
                              handleSavePost(post?.id, currentUser)
                            }
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
                        <div className="flex flex-col -space-y-1">
                          {post?.likes?.length !== 0 && (
                            <span className="w-full px-4">
                              {post?.likes?.length !== 0 && post?.likes?.length}
                              &nbsp;
                              {post?.likes?.length === 1 ? "like" : "likes"}
                            </span>
                          )}
                          {/* )} */}
                          <span className="w-full px-4 text-sm text-zinc-400">
                            {post?.timeStamp
                              ? formatTime(post?.timeStamp, "PPpp", {
                                  addSuffix: true,
                                })
                              : "not provided"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="flex flex-col space-y-3 items-center w-full px-4">
                  <span className="text-4xl">Nothing To Show 🫥</span>
                  <span className="text-lg">
                    Follow Some Users To Get Started.
                  </span>
                  <Link
                    to="/explore"
                    className="underline underline-offset-4 decoration-orange-600"
                  >
                    Explore posts and search users
                  </Link>
                </div>
              )}
            </div>
          </div>
          {homePagePosts.length > 0 && (
            <div className="flex flex-col items-center w-full h-fit">
              {otherPublicPostsHomePage.length > 0 && (
                <div
                  className={`my-6 underline underline-offset-4 decoration-gray-700 text-2xl border-b-[1px] `}
                >
                  Explore more posts
                </div>
              )}
              <div className="flex flex-col py-3 w-full h-fit">
                {otherPublicPostsHomePage.length > 0 &&
                  otherPublicPostsHomePage
                    ?.sort((a, b) => b.timeStamp - a.timeStamp)
                    .map((post, index) => (
                      <div
                        key={index}
                        className="w-full border-b-[1px] pb-3 border-zinc-700 last:border-0"
                      >
                        <div className="h-16 flex items-center rounded-sm space-x-4 w-full justify-start px-3">
                          {post?.userData?.img ? (
                            <img
                              src={post?.userData?.img}
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
                                currentUser === post?.userId
                                  ? `/userProfile/yourPosts`
                                  : `/users/${post?.userId}/profile`
                              }
                              className="flex flex-col -space-y-1 font-medium"
                            >
                              <span>{post?.userData?.name}</span>
                              <span className="text-sm text-zinc-600">
                                {" "}
                                @{post?.userData?.user_name}
                              </span>
                            </Link>
                          </div>
                        </div>
                        <div className="w-full h-full">
                          {post?.postCaption && (
                            <div
                              className="whitespace-pre-wrap px-4 pb-2 leading-snug"
                              dangerouslySetInnerHTML={{
                                __html: PostLink(post?.postCaption),
                              }}
                            ></div>
                          )}
                          <div className="px-2 my-1 flex flex-wrap">
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
                          <div className="flex w-full px-4">
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
                                post && post?.fileURLs.length > 1 ? true : false
                              }
                            >
                              {post?.fileURLs?.map((fileURL, index) => (
                                <div
                                  key={index}
                                  className="relative  mx-[.25px]"
                                >
                                  {fileURL.includes(".mp4") ? (
                                    <video
                                      controls
                                      autoFocus={true}
                                      className="h-[80%] w-full object-contain rounded-md"
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
                                </div>
                              ))}
                            </Carousel>
                          </div>
                          <div className="flex items-center justify-between h-10 px-4 pt-2">
                            <div className="flex items-center space-x-6">
                              <div
                                className="flex items-center cursor-pointer"
                                onClick={() =>
                                  handleLikePost(post?.id, currentUser)
                                }
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
                            <div
                              className=""
                              onClick={() =>
                                handleSavePost(post?.id, currentUser)
                              }
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
                          <div className="flex flex-col">
                            {post?.likes?.length !== 0 && (
                              <span className="w-full px-4">
                                {post?.likes?.length !== 0 &&
                                  post?.likes?.length}
                                &nbsp;
                                {post?.likes?.length === 1 ? "like" : "likes"}
                              </span>
                            )}
                            {/* )} */}
                            <span className="w-full px-4 text-sm text-zinc-400">
                              {post?.timeStamp
                                ? formatTime(post?.timeStamp, "PPpp", {
                                    addSuffix: true,
                                  })
                                : "not provided"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ height: `calc(100vh - 90px)` }}
          className="flex items-center justify-center"
        >
          <CgSpinner className="animate-spin" size={50} />
        </div>
      )}
    </>
  );
};

export default Home;
