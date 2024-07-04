import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { db } from "../../firebase";
import { AuthContext } from "../AuthContext";

const PostContext = createContext();
export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [postData, setPostData] = useState([]);
  const navigate = useNavigate();
  const [postComment, setPostComment] = useState({ commentText: "" });
  const [postComments, setPostComments] = useState([]);
  const [isPublished, setIsPublished] = useState(true);
  const userData = JSON.parse(localStorage.getItem("loggedInUserData"));
  const { currentUser } = useContext(AuthContext);
  const [postsLoading, setPostsLoading] = useState(false);

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

  const formatDate = (timestamp) => {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const fetchPostComments = async (id) => {
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
      // Sort comments by timestamp
      comments.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds;
        } else {
          return 0; // Handle cases where timestamp might be missing
        }
      });
      setPostComments(comments);
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };

  const handlePostComment = async (id) => {
    setIsPublished(false);
    const { commentText } = postComment;
    try {
      const docRef = await addDoc(collection(db, "postComments"), {
        comment: commentText,
        name: userData.name,
        userId: currentUser.uid,
        email: userData.email,
        postId: id,
        timestamp: serverTimestamp(),
        userProfileImage: userData.img,
      });
      console.log("comment posted", docRef);
      // Increment the comment count in the corresponding post document
      const postRef = doc(db, "posts", id);
      await updateDoc(postRef, {
        commentsCount: increment(1),
      });
      // Reset the comment text input
      setPostComment({
        commentText: "",
      });
      setIsPublished(true);
    } catch (error) {
      console.error(error);
      setIsPublished(false);
    }
    fetchPostById(id);
    fetchPostComments(id);
  };

  const handleDeleteComment = async (commentId, id) => {
    try {
      const commentRef = doc(db, "postComments", commentId);
      await deleteDoc(commentRef);
      fetchPostComments(id);
      console.log(`Comment with ID ${commentId} deleted`);
      // Increment the comment count in the corresponding post document
      const postRef = doc(db, "posts", id);
      await updateDoc(postRef, {
        commentsCount: increment(-1),
      });
      fetchPostById(id);
    } catch (error) {
      console.error("Error deleting comment: ", error);
    }
  };
  const handleLikePost = async (id) => {
    try {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      console.log(postSnap);
      if (postSnap.exists()) {
        const postData = postSnap.data();

        // Ensure postData.likes is initialized properly
        const likes = postData.likes || [];

        if (likes.includes(currentUser.uid)) {
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser.uid),
            likesCount: increment(-1),
          });
          // setPostData((prevData) => ({
          //   ...prevData,
          //   likes: prevData.likes.filter((uid) => uid !== currentUser.uid),
          //   likesCount: prevData.likesCount - 1,
          // }));
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === id
                ? {
                    ...post,
                    likes: post.likes.filter((uid) => uid !== currentUser.uid),
                    likesCount: post.likesCount - 1,
                  }
                : post
            )
          );
          console.log("post disliked");
          fetchPostById(id);
        } else {
          await updateDoc(postRef, {
            likes: arrayUnion(currentUser.uid),
            likesCount: increment(1),
          });
          // setPostData((prevData) => ({
          //   ...prevData,
          //   likes: [...postData.likes, currentUser.uid],
          //   likesCount: prevData.likesCount + 1,
          // }));
          // // Update local state (posts) for the specific post
          setPosts((prevPosts) =>
            prevPosts?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    likes: [...post?.likes, currentUser?.uid],
                    likesCount: post?.likesCount + 1,
                  }
                : post
            )
          );
          console.log("post liked");

          fetchPostById(id);
        }
      }
    } catch (error) {
      console.error("Error liking post: ", error);
    }
  };

  const handleLikeComment = async (commentId, postId) => {
    try {
      const commentRef = doc(db, "postComments", commentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        const commentLikes = commentData.likes || []; // Ensure likes array exists

        if (commentLikes.includes(currentUser.uid)) {
          await updateDoc(commentRef, {
            likes: arrayRemove(currentUser.uid),
            likesCount: increment(-1),
          });
          await fetchPostComments(postId); // Update comments list
        } else {
          await updateDoc(commentRef, {
            likes: arrayUnion(currentUser.uid),
            likesCount: increment(1),
          });
          await fetchPostComments(postId); // Update comments list
        }
      }
    } catch (error) {
      console.error("Error liking comment: ", error);
    }
  };

  const fetchAllPosts = async () => {
    setPostsLoading(true)
    try {
      const querySnapshot = await getDocs(collection(db, "posts"));
      // Use Promise.all to fetch user data concurrently
      const postsWithUserData = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const postData = docSnapshot.data();
          const userDocRef = doc(db, "users", postData.userId);
          const userDocSnap = await getDoc(userDocRef);

          let userData = {};
          if (userDocSnap.exists()) {
            userData = userDocSnap.data();
          }

          return {
            id: docSnapshot.id,
            ...postData,
            userData,
            timeStamp: postData.timeStamp?.toDate(), // Convert Firestore timestamp to JS Date
          };
        })
      );

      // Sort posts by timestamp in descending order
      postsWithUserData.sort((a, b) => b.timeStamp - a.timeStamp);
      setPostsLoading(false)
      setPosts(postsWithUserData);
      console.log(postsWithUserData);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  useEffect(() => {
    fetchAllPosts();
    // eslint-disable-next-line
  }, []);

  return (
    <PostContext.Provider
      value={{
        postData,
        setPostData,
        navigate,
        postComment,
        setPostComment,
        postComments,
        isPublished,
        userData,
        formatDate,
        fetchPostById,
        fetchPostComments,
        handleDeleteComment,
        handleLikeComment,
        handleLikePost,
        handlePostComment,
        currentUser,
        fetchAllPosts,
        posts,
        postsLoading
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
export default PostContext;
