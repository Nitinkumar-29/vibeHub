import React, { useContext, useEffect } from "react";
import { getDocs, collection, where, query } from "firebase/firestore";
import { db } from "../firebase";
import { formatTime } from "../utils/FormatTime";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import "../styles/overflow_scroll.css";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { BsHeartFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import PostContext from "../context/PostContext/PostContext";
import { FaUser } from "react-icons/fa";
import { PiBookmarkSimpleThin } from "react-icons/pi";
import { RxBookmarkFilled } from "react-icons/rx";
import { HiDotsVertical } from "react-icons/hi";

const Home = () => {
  const { handleLikePost, currentUser, posts, fetchAllPosts } =
    useContext(PostContext);

  useEffect(() => {
    fetchAllPosts();
    // eslint-disable-next-line
  }, []);

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
    <div
      // style={{ height: "calc(100% - 64px)" }}
      className="overflow-y-auto h-screen"
    >
      <div className="flex flex-col items-center mb-16">
        <div className="flex items-center justify-center bg-zinc-900 w-full h-16">
          <div className="flex justify-between items-center h-12 p-3 w-full rounded-md">
            <img
              src={`/images/logo.png`}
              className="h-12 w-12 rounded-md"
              alt=""
            />
            <span>Posts: {posts?.length}</span>
          </div>
        </div>
        {posts?.length > 0 ? (
          <div className="flex justify-center w-full h-full py-2">
            <div className="flex flex-col w-full h-fit">
              {posts?.map((post, index) => (
                <div key={index} className="w-full rounded-md bg-zinc-900">
                  <div className="h-16 flex items-center border-t-[1px] border-blue-950 rounded-sm space-x-4 w-full justify-start px-3">
                    {post?.userData?.img ? (
                      <img
                        src={post?.userData?.img}
                        className="w-[3rem] h-[3rem] object-cover duration-200 rounded-full"
                        alt=""
                      />
                    ) : (
                      <FaUser size={48} />
                    )}
                    <div className="flex w-full justify-between items-center space-y-1">
                      <span className="font-medium">{post?.userData?.name}</span>
                      <HiDotsVertical size={25} />
                    </div>
                  </div>
                  <div className="w-full h-full my-2">
                    <p className="p-2">{post?.postCaption}</p>
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
                          className="relative aspect-w-3 aspect-h-4 mx-[.25px]"
                        >
                          {fileURL ? (
                            <img
                              src={fileURL}
                              alt="post media"
                              className={`h-full w-full object-scale-down rounded-sm border-[1px] border-blue-950`}
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
                          {post.likes?.includes(currentUser?.uid) ? (
                            <BsHeartFill
                              size={20}
                              className="text-red-600 cursor-pointer"
                            />
                          ) : (
                            <SlHeart size={20} />
                          )}
                          {post?.likes?.length !== 0 && (
                            <span>{post?.likes?.length}</span>
                          )}
                        </div>
                        <Link to={`/post/${post?.id}`}>
                          <div className="flex items-center space-x-1">
                            <SlBubble size={20} />
                            <span>
                              {post?.commentsCount !== 0 && post?.commentsCount}
                            </span>
                          </div>
                        </Link>
                        <SlPaperPlane size={20} />
                      </div>
                      <div className="">
                        {post?.saved ? (
                          <RxBookmarkFilled
                            className="text-red-600 cursor-pointer"
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
          <div className="flex flex-col justify-center items-center h-fit space-y-2">
            <span>0 posts or may be server error</span>
            <span>Please try again later</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
