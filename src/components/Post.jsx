import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";
import { TfiArrowCircleLeft } from "react-icons/tfi";
import { Carousel } from "react-responsive-carousel";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { SlBubble, SlHeart, SlPaperPlane } from "react-icons/sl";
import { formatDistanceToNow } from "date-fns";
import { BsSave } from "react-icons/bs";
import { RxPaperPlane } from "react-icons/rx";
import { BiLoader } from "react-icons/bi";

const Post = () => {
  const [postData, setPostData] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [postComment, setPostComment] = useState({ commentText: "" });
  const [postComments, setPostComments] = useState([]);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    const fetchPostById = async (id) => {
      try {
        const postRef = doc(db, "posts", id);
        const postSnapShot = await getDoc(postRef);

        if (postSnapShot.exists()) {
          const postData = postSnapShot.data();
          console.log("Post data: ", postData);
          // You can set the post data to state if needed
          setPostData(postData);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching post: ", error);
      }
    };

    if (currentUser?.uid) {
      fetchPostById(id);
    }
    // eslint-disable-next-line
  }, [id, currentUser?.uid]);

  const formatDate = (timestamp) => {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    setIsPublished(false);
    const { commentText } = postComment;

    try {
      const docRef = await addDoc(collection(db, "postComments"), {
        comment: commentText,
        name: postData.name,
        userId: postData.userId,
        email: postData.email,
        postId: id,
        timestamp: serverTimestamp(),
        userProfileImage: postData.userProfileImage,
      });
      console.log("comment posted", docRef);

      // Reset the comment text input
      setPostComment({
        commentText: "",
      });

      setIsPublished(true);
    } catch (error) {
      console.error(error);
      setIsPublished(false);
    }

    fetchPostComments();
  };

  const fetchPostComments = async () => {
    try {
      const q = query(
        collection(db, "postComments"),
        where("postId", "==", id)
      );
      const querySnapshot = await getDocs(q);
      const comments = [];
      querySnapshot.forEach((doc) => {
        comments.push({ id: doc.id, ...doc.data() });
        console.log(comments);
      });
      setPostComments(comments);
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };
  useEffect(() => {
    fetchPostComments();
  }, [id]);

  return (
    <div
      // style={{ height: "calc(100% - 64px)" }}
      className="overflow-y-auto h-screen"
    >
      <div className="flex flex-col items-center mb-16">
        <div className="flex items-center justify-center bg-zinc-950 w-full h-16">
          <div className="flex justify-between items-center border-[1px] border-blue-900 h-12 p-2 w-[95%] rounded-md shadow-sm shadow-blue-800">
            <div className="flex items-center space-x-2">
              <TfiArrowCircleLeft
                onClick={() => {
                  navigate(-1);
                }}
                size={18}
              />
              <span>Post</span>
            </div>
            <span>id: {id}</span>
          </div>
        </div>
        {postData ? (
          <div className="flex flex-col items-center space-y-2 py-2">
            {postData?.userId && (
              <div className="flex flex-col space-y-3 w-[95%] h-fit border-[1px] rounded-md border-blue-950 bg-zinc-900">
                <div className="h-fit flex space-x-4 w-full justify-start p-3">
                  {postData?.userProfileImage ? (
                    <img
                      src={postData?.userProfileImage}
                      className="h-12 w-12 duration-200 rounded-full border-[1px] border-blue-900"
                      alt=""
                    />
                  ) : (
                    <FaUser size={48} />
                  )}
                  <div className="flex flex-col space-y-1 w-full">
                    <span className="font-medium">{postData?.name}</span>
                    <span>{postData?.email}</span>
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
                            className="h-[10rem] w-[10rem] object-cover rounded-md border-[1px] border-blue-950"
                          >
                            <source src={fileURL} type="video/mp4" />
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
                    <SlHeart size={20} />
                    <SlBubble size={20} />
                    <SlPaperPlane size={20} />
                  </div>
                  <span className="text-sm text-zinc-400">
                    {postData.timeStamp
                      ? formatDate(postData.timeStamp, "PPpp")
                      : "not provided"}
                  </span>
                  <div className="">
                    <BsSave size={20} />
                    {/* <BsSaveFill size={20} /> */}
                  </div>
                </div>
              </div>
            )}
            {postData?.userId && (
              <div className="flex flex-col items-center space-y-4 w-[95%] bg-zinc-900 rounded-md border-blue-950 border-[1px] p-2">
                <span className="w-full">
                  Comments: &nbsp;{postComments.length}
                </span>
                <form onSubmit={handlePostComment} className="w-full ">
                  <textarea
                    type="text"
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
                  {postComments.map((comment) => {
                    return (
                      <>
                        <div className="flex flex-col space-y-2 p-2 border-[1px] rounded-md w-full">
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
                              <span>{comment.name}</span>
                            </div>
                            <span>
                              {comment.timeStamp &&
                                formatDate(comment.timeStamp, "PPpp")}
                            </span>
                          </div>
                          <div className="tracking-tighter">
                            {comment.comment}
                          </div>
                          <div className="flex items-center w-full space-x-4">
                            <SlHeart size={15} />
                            <SlBubble size={15} />
                          </div>
                        </div>
                      </>
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
