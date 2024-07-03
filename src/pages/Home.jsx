import React, { useContext, useEffect, useState } from "react";
import { getDocs, collection, where, query } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { FaComment, FaHeart } from "react-icons/fa";
import { formatTime } from "../utils/FormatTime";
import { BiShareAlt } from "react-icons/bi";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import "../styles/overflow_scroll.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const [currentUserData, setCurrentUserData] = useState([]);

  const fetchAllPosts = async () => {
    const querySnapshot = await getDocs(collection(db, "posts"));
    const postsArray = [];
    querySnapshot.forEach((doc) => {
      const postData = doc.data();
      postsArray.push({
        id: doc.id,
        ...postData,
        timeStamp: postData.timeStamp?.toDate(), // Convert Firestore timestamp to JS Date
      });
    });
    // Sort posts by timestamp in descending order
    postsArray.sort((a, b) => b.timeStamp - a.timeStamp);
    setPosts(postsArray);
    console.log(postsArray);
  };

  useEffect(() => {
    fetchAllPosts();
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
        setCurrentUserData(userData);
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
    <div className="text-white flex flex-col items-center w-screen max-w-[430px] bg-zinc-950 h-screen">
      <div className="flex items-center justify-center bg-zinc-950 w-full h-16">
        <div className="flex justify-between items-center border-[1px] border-blue-900 h-12 p-2 w-[95%] rounded-md shadow-sm shadow-blue-800">
          <span>Home</span>
          <span>Posts: {posts.length}</span>
        </div>
      </div>
      <div
        style={{ height: "calc(100% - 128px)" }}
        className="flex justify-center w-[95%] h-full py-2 hide-scrollbar"
      >
        <div className="flex flex-col space-y-3 w-full h-fit">
          {posts.map((post, index) => (
            <div
              key={index}
              className="w-full border-[1px] border-blue-900 rounded-md bg-zinc-900"
            >
              <div className="h-fit flex space-x-4 w-full justify-start p-3">
                {currentUserData?.img && (
                  <img
                    src={currentUserData.img}
                    className="h-12 w-12 duration-200 rounded-full border-[1px] border-blue-800"
                    alt=""
                  />
                )}
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">{post?.name}</span>
                  <span>{post?.email}</span>
                </div>
              </div>
              <div className="w-full h-full p-2 space-y-2">
                <p>{post.postCaption}</p>
                <Carousel
                  showThumbs={false}
                  autoPlay={false}
                  transitionTime={5}
                  infiniteLoop={true}
                  showStatus={false}
                  swipeable={true}
                  emulateTouch={true}
                  useKeyboardArrows={true}
                >
                  {post.fileURLs.map((fileURL, index) => (
                    <div key={index} className="relative mx-1">
                      {fileURL ? (
                        <img
                          src={fileURL}
                          alt="post media"
                          className={`min-h-[20rem] min-w-[20rem] object-cover rounded-md border-[1px] border-blue-950`}
                        />
                      ) : fileURL ? (
                        <video
                          controls
                          className="h-[10rem] w-[10rem] object-cover rounded-md border-[1px] border-blue-950"
                        >
                          <source src={fileURL} type="video" />
                        </video>
                      ) : null}
                    </div>
                  ))}
                </Carousel>
                <div className="flex items-center justify-between h-8 border-t-[1px] border-blue-950 mt-2">
                  <div className="flex items-center space-x-3">
                    <FaHeart />
                    <FaComment />
                    <BiShareAlt />
                  </div>
                  <span className="text-sm text-zinc-400">
                    {post.timeStamp
                      ? formatTime(post.timeStamp, "PPpp")
                      : "not provided"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
