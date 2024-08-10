import PostContext from "../context/PostContext/PostContext";
import "../styles/overflow_scroll.css";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import React, { useContext, useEffect, useRef, useState } from "react";
import { Carousel } from "react-responsive-carousel";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsHeartFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { RxBookmarkFilled } from "react-icons/rx";
import { BiPause, BiPlay } from "react-icons/bi";
import { formatTime } from "../utils/FormatTime";
import ThemeContext from "../context/Theme/ThemeContext";
import { CgSpinner } from "react-icons/cg";
import { HighLightLinks } from "../utils/HighlightLinks";
import { IoNotificationsSharp } from "react-icons/io5";
import { auth } from "../firebase";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
  const {
    handleLikePost,
    currentUser,
    homePagePosts,
    fetchHomePagePosts,
    postsLoading,
    handleSavePost,
    otherPublicPostsHomePage,
  } = useContext(PostContext);
  const { theme } = useContext(ThemeContext);
  const { allUsers } = useContext(AuthContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const [position, setPosition] = useState("fixed");
  const [lastScrollY, setLastScrollY] = useState(0);

  const handlePosition = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < lastScrollY) {
      // Scrolling down
      setPosition("fixed");
    } else {
      // Scrolling up
      setPosition("static");
    }

    setLastScrollY(currentScrollY);
  };

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
    fetchHomePagePosts();
    // eslint-disable-next-line
  }, [currentUser]);

  useEffect(() => {
    window.addEventListener("scroll", handlePosition);

    return () => {
      window.removeEventListener("scroll", handlePosition);
    };
    // eslint-disable-next-line
  }, [lastScrollY]);

  return (
    <>
      {!postsLoading ? (
        <div className="flex flex-col justify-center items-center h-fit">
          <div
            className={`z-20 ${position} top-0 ${
              theme === "dark" ? "bg-black" : "bg-white"
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
            <Link to={`user/${auth?.currentUser?.uid}/notifications`}>
              <IoNotificationsSharp size={25} />
            </Link>
          </div>
          <div className="flex justify-center w-full h-full pb-2 pt-12">
            <div className="flex flex-col w-full h-fit space-y-4">
              {homePagePosts.length > 0 ? (
                homePagePosts
                  ?.sort((a, b) => b.timeStamp - a.timeStamp)
                  .map((post, index) => (
                    <div
                      key={index}
                      className="w-full pb-3 border-b-[1px] border-zinc-700 last:border-b-0"
                    >
                      <div className="h-fit flex items-center rounded-sm space-x-4 w-full justify-start px-4 py-1">
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
                              auth.currentUser?.uid === post?.userId
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
                          {/* <div>
                          <HiDotsVertical
                            className="cursor-pointer"
                            size={25}
                          />
                          <div className="hidden">
                            <span>Edit</span>
                            <span>Delete</span>
                            <span></span>
                            </div>
                            </div> */}
                        </div>
                      </div>
                      <div className="w-full h-full ">
                        {post?.postCaption && (
                          <p
                            className="whitespace-pre-wrap px-4"
                            dangerouslySetInnerHTML={{
                              __html: HighLightLinks(post?.postCaption),
                            }}
                          ></p>
                        )}
                        <div className="px-2 flex flex-wrap">
                          {post?.mentionedUsers?.map((user, index) => {
                            return (
                              <Link
                                key={index}
                                className="text-zinc-500 px-2"
                                onClick={() => {
                                  window.scrollTo(0, 0);
                                }}
                                to={
                                  auth.currentUser.uid === user?.userId
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
                              <div key={index} className="relative  mx-[.25px]">
                                {fileURL.includes(".mp4") ? (
                                  <video
                                    onClick={() => {
                                      handlePlayPause(index);
                                    }}
                                    onEnded={handleEnded}
                                    ref={videoRef}
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
                        </div>
                        <div className="flex items-center justify-between h-fit pt-1 px-4">
                          <div className="flex items-center space-x-6">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() =>
                                handleLikePost(post?.id, auth.currentUser?.uid)
                              }
                            >
                              {post?.likes?.includes(auth.currentUser?.uid) ? (
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
                              handleSavePost(post?.id, auth.currentUser?.uid)
                            }
                          >
                            {post?.saves?.includes(auth.currentUser?.uid) ? (
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
                          {/* {post?.likes?.length !== 0 && ( */}
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
                                auth.currentUser?.uid === post?.userId
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
                            {/* <div>
                          <HiDotsVertical
                            className="cursor-pointer"
                            size={25}
                          />
                          <div className="hidden">
                            <span>Edit</span>
                            <span>Delete</span>
                            <span></span>
                          </div>
                          </div> */}
                          </div>
                        </div>
                        <div className="w-full h-full">
                          {post?.postCaption && (
                            <p className="px-4 py-2">{post?.postCaption}</p>
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
                                  handleLikePost(
                                    post?.id,
                                    auth.currentUser?.uid
                                  )
                                }
                              >
                                {post?.likes?.includes(
                                  auth.currentUser?.uid
                                ) ? (
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
                                handleSavePost(post?.id, auth.currentUser?.uid)
                              }
                            >
                              {post?.saves?.includes(auth.currentUser?.uid) ? (
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
                            {/* {post?.likes?.length !== 0 && ( */}
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
