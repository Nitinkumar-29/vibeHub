import PostContext from "../context/PostContext/PostContext";
import "../styles/overflow_scroll.css";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import React, { useContext, useEffect, useRef, useState } from "react";
import { getDocs, collection, where, query } from "firebase/firestore";
import { db } from "../firebase";
import { formatTime } from "../utils/FormatTime";
import { Carousel } from "react-responsive-carousel";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsHeartFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { RxBookmarkFilled } from "react-icons/rx";
import { HiDotsVertical } from "react-icons/hi";
import { BiLoaderCircle } from "react-icons/bi";
// import { TbMusicOff } from "react-icons/tb";
// import { GiMusicalNotes } from "react-icons/gi";

const Home = () => {
  // const audioControl = useRef();
  // const [isPlaying, setIsPlaying] = useState(true);
  const {
    handleLikePost,
    currentUser,
    posts,
    fetchAllPosts,
    postsLoading,
    handleSavePost,
  } = useContext(PostContext);

  useEffect(() => {
    fetchAllPosts();
    // eslint-disable-next-line
  }, []);

  // const handlePlay = async () => {
  //   const audioElement = audioControl.current;
  //   if (audioElement) {
  //     await audioElement.play();
  //     setIsPlaying(true);
  //   }
  // };

  // const handlePause = async () => {
  //   const audioElement = audioControl.current;
  //   if (audioElement) {
  //     await audioElement.play();
  //     audioElement.pause();
  //     setIsPlaying(false);
  //   }
  // };

  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(userData);
      });
    }
  };

  useEffect(() => {
    if (currentUser) {
      handleFetchUserData();
    }
    // eslint-disable-next-line
  }, [currentUser]);

  return (
    <>
      {!postsLoading ? (
        <div className="flex flex-col justify-center items-center mb-12 h-full">
          {posts?.length > 0 ? (
            <div className="flex justify-center w-full h-full py-2">
              <div className="flex flex-col w-full h-fit">
                {posts?.map((post, index) => (
                  <div key={index} className="w-full rounded-md">
                    <div className="h-16 flex items-center border-t-[1px] border-blue-950 rounded-sm space-x-4 w-full justify-start px-3">
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
                        <div>
                          <span className="font-medium">
                            {post?.userData?.name}
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
                              <div
                                onClick={isPlaying ? handlePause : handlePlay}
                              >
                                {isPlaying === true ? (
                                  <GiMusicalNotes
                                    size={15}
                                    className="animate-pulse cursor-pointer"
                                  />
                                ) : (
                                  <TbMusicOff
                                    size={15}
                                    className="cursor-pointer"
                                  />
                                )}
                              </div>
                            ) : (
                              ""
                            )}
                            <span className="text-xs">{post.audioName}</span>
                          </div> */}
                        </div>
                        <div>
                          <HiDotsVertical
                            className="cursor-pointer"
                            size={25}
                          />
                          <div className="hidden">
                            <span>Edit</span>
                            <span>Delete</span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-full my-2">
                      <p className="px-4 py-2">{post?.postCaption}</p>
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
                            onClick={() =>
                              handleLikePost(post?.id, currentUser?.uid)
                            }
                          >
                            {post?.likes?.includes(currentUser?.uid) ? (
                              <BsHeartFill
                                size={20}
                                className="text-red-600 cursor-pointer"
                              />
                            ) : (
                              <SlHeart size={20} />
                            )}
                            {/* {post?.likes?.length !== 0 && ( */}
                            <span className="w-2">
                              {post?.likes?.length !== 0 && post?.likes?.length}
                            </span>
                            {/* )} */}
                          </div>
                          <Link to={`/post/${post?.id}`}>
                            <div className="flex items-center space-x-1">
                              <SlBubble size={20} />
                              <span className="w-2">
                                {post?.commentsCount !== 0 &&
                                  post?.commentsCount}
                              </span>
                            </div>
                          </Link>
                          <SlPaperPlane size={20} />
                        </div>
                        <div
                          className=""
                          onClick={() =>
                            handleSavePost(post?.id, currentUser?.uid)
                          }
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
                          ? formatTime(post?.timeStamp, "PPpp")
                          : "not provided"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-screen space-y-2">
              <span className="text-4xl">server error</span>
              <span>Please try again later</span>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{ height: `calc(100vh - 90px)` }}
          className="flex items-center justify-center"
        >
          <BiLoaderCircle className="animate-ping" size={50} />
        </div>
      )}
    </>
  );
};

export default Home;
