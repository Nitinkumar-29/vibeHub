import { createContext, useEffect, useState } from "react";
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
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { db, storage } from "../../firebase";
import toast from "react-hot-toast";
import { deleteObject, listAll, ref } from "firebase/storage";

const PostContext = createContext();
export const PostProvider = ({ children }) => {
  const [homePagePosts, setHomePagePosts] = useState([]);
  const [postData, setPostData] = useState();
  const navigate = useNavigate();
  const [postComment, setPostComment] = useState({ commentText: "" });
  const [postComments, setPostComments] = useState([]);
  const [isPublished, setIsPublished] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userDataWithPostId, setUserDataWithPostId] = useState();
  const [userPosts, setUserPosts] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [otherPublicPostsHomePage, setOtherPublicPostsHomePage] = useState([]);
  const [error, setError] = useState("");
  const currentUser = localStorage.getItem("currentUser");
  const [postId, setPostId] = useState("");
  const [commentId, setCommentId] = useState("");

  const fetchPostById = async (id) => {
    setPostId(id);
    if (!postId) return;
    try {
      const postRef = doc(db, "posts", id);
      const postDocSnap = await getDoc(postRef);
      const postDataWithId = postDocSnap.data();
      setPostData(postDataWithId);
      const userDataWithPostRef = doc(db, "users", postDataWithId.userId);
      const userDataDocSnap = await getDoc(userDataWithPostRef);
      const userDataWithPostUserId = userDataDocSnap.data();
      setUserDataWithPostId(userDataWithPostUserId);
    } catch (error) {
      console.error(error);
    }
  };

  // for faster data fetching for a post
  useEffect(() => {
    if (!postId) return;
    try {
      const postRef = doc(db, "posts", postId);
      const unsubscribePostData = onSnapshot(postRef, async (doc) => {
        const postDataWithId = doc.exists ? doc.data() : {};
        console.log(postData);
        setPostData(postDataWithId);
      });
      return () => unsubscribePostData();
    } catch (error) {
      console.error(error);
    }
    // eslint-disable-next-line
  }, [postId]);

  // archive a post, posted by current user, can archvie only
  const handleArchivePost = async (id) => {
    if (!id) return;
    try {
      toast.loading("processing...");
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      const postData = postSnap.exists ? postSnap.data() : {};
      if (postData.archived === true) {
        await Promise.all([
          updateDoc(postRef, {
            archived: false,
          }),
        ]);
        toast.dismiss();
        toast.success("unarchived");
        handleFetchUserPosts();
      } else {
        await Promise.all([
          updateDoc(postRef, {
            archived: true,
          }),
        ]);
        toast.dismiss();
        toast.success("archived");
        handleFetchUserPosts();
      }
    } catch (error) {
      console.error(error);
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
      // Query to fetch comments for the specific post
      const q = query(
        collection(db, "postComments"),
        where("postId", "==", id)
      );

      // Fetch comments
      const querySnapshot = await getDocs(q);
      const comments = [];

      // Process each comment
      for (const docSnap of querySnapshot.docs) {
        const commentData = docSnap.data();
        const userId = commentData.userId;

        // Fetch user data for the comment
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        // Check if user document exists
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          // Combine comment data with user data
          comments.push({
            id: docSnap.id,
            ...commentData,
            user: userData,
          });
        } else {
          console.warn(`User data not found for userId ${userId}`);
        }
      }
      // Sort comments by timestamp
      comments.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds;
        } else {
          return 0; // Handle cases where timestamp might be missing
        }
      });
      // Update state with combined comments and user data
      setPostComments(comments);
    } catch (error) {
      console.error("Error fetching comments: ", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
      setError("Server down, Please try again later");
    }
  };

  const handlePostComment = async (id) => {
    setIsPublished(false);
    toast.loading("Processing...");

    const { commentText } = postComment;
    const docRef = doc(db, "users", currentUser);
    const docSnap = await getDoc(docRef);
    const docUserData = [];
    if (docSnap.exists()) {
      docUserData.push(docSnap.data());
    }
    try {
      await addDoc(collection(db, "postComments"), {
        comment: commentText,
        userId: currentUser,
        postId: id,
        timeStamp: serverTimestamp(),
      });
      // Increment the comment count in the corresponding post document
      const postRef = doc(db, "posts", id);
      await updateDoc(postRef, {
        commentsCount: increment(1),
      });
      toast.dismiss();
      toast.success("Comment Posted");

      // Reset the comment text input
      setPostComment({
        commentText: "",
      });
      setIsPublished(true);
    } catch (error) {
      toast.error("server error");
      console.error(error);
      setIsPublished(false);
    }
    fetchPostById(id);
    fetchPostComments(id);
  };

  const handleLikeComment = async (commentId, postId) => {
    if (!commentId) return;
    setCommentId(commentId);
    try {
      const commentRef = doc(db, "postComments", commentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        const commentLikes = commentData.likes || []; // Ensure likes array exists

        if (commentLikes.includes(currentUser)) {
          await updateDoc(commentRef, {
            likes: arrayRemove(currentUser),
            likesCount: increment(-1),
          });
          await fetchPostComments(postId); // Update comments list
        } else {
          await updateDoc(commentRef, {
            likes: arrayUnion(currentUser),
            likesCount: increment(1),
          });
          await fetchPostComments(postId); // Update comments list
        }
      }
    } catch (error) {
      console.error("Error liking comment: ", error);
    }
  };

  useEffect(() => {
    if (!commentId) return;
    const commentRef = doc(db, "postComments", commentId);
    const unsubscribe = onSnapshot(commentRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedComment = {
          id: docSnap.id,
          ...docSnap.data(),
        };

        // Update the specific comment in your state
        setPostComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId ? updatedComment : comment
          )
        );
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, [commentId]);

  const handleDeleteComment = async (commentId, id) => {
    try {
      toast.loading("deleting...");

      const commentRef = doc(db, "postComments", commentId);
      await deleteDoc(commentRef);
      toast.dismiss();
      toast.success("deleted");
      fetchPostComments(id);
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

  const handleFetchUserPosts = async () => {
    try {
      const queryPosts = [];
      const q = query(
        collection(db, "posts"),
        where("userId", "==", currentUser)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const allPosts = doc.data();
        queryPosts.push({ id: doc.id, ...allPosts });
        const sortedUserPosts = queryPosts.sort(
          (a, b) => b.timeStamp - a.timeStamp
        );
        setUserPosts(sortedUserPosts);
      });
    } catch (error) {
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
      setError("Server down, Please try again later");
    }
    // handleFetchSavedPosts();
  };

  const handleFetchSavedPosts = async () => {
    try {
      if (!currentUser) {
        throw new Error("Current user not found");
      }

      // Fetch saved posts
      const q = query(
        collection(db, "posts"),
        where("saves", "array-contains", currentUser)
      );
      const docRef = doc(db, "users", currentUser);
      const docSnap = await getDoc(docRef);
      const followingList = docSnap.exists()
        ? docSnap.data().following || []
        : [];

      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch user data for each post
      const postsWithUserData = await Promise.all(
        posts.map(async (post) => {
          const userDoc = await getDoc(doc(db, "users", post.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          return {
            ...post,
            user: userData,
            timeStamp: post.timeStamp?.toDate(),
          };
        })
      );
      const currentUserSavedPosts = [];
      const followedUsersSavedPosts = [];
      const publicUsersSavedPosts = [];

      postsWithUserData.forEach((post) => {
        const currentUserPost = post.userId === currentUser;
        const followingUserSavedPost = followingList.includes(post.userId);
        const publicUserSavedPost = post.user.accountType !== "private";

        if (currentUserPost) {
          currentUserSavedPosts.push(post);
        } else if (followingUserSavedPost) {
          followedUsersSavedPosts.push(post);
        } else if (publicUserSavedPost) {
          publicUsersSavedPosts.push(post);
        }
      });

      // Sort each category by timestamp in descending order
      currentUserSavedPosts.sort((a, b) => b.timeStamp - a.timeStamp);
      followedUsersSavedPosts.sort((a, b) => b.timeStamp - a.timeStamp);
      publicUsersSavedPosts.sort((a, b) => b.timeStamp - a.timeStamp);

      // Combine all categories
      const allSavedPosts = [
        ...currentUserSavedPosts,
        ...followedUsersSavedPosts,
        ...publicUsersSavedPosts,
      ];
      // Set the sorted posts to state
      setSavedPosts(allSavedPosts);
      handleFetchLikedPosts();
    } catch (error) {
      console.error("Error fetching saved posts: ", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
      setError("Server down, Please try again later");
    }
  };

  const handleFetchLikedPosts = async () => {
    try {
      // Fetch saved posts
      const q = query(
        collection(db, "posts"),
        where("likes", "array-contains", currentUser)
      );
      const docRef = doc(db, "users", currentUser);
      const docSnap = await getDoc(docRef);
      const followingList = docSnap.exists()
        ? docSnap.data().following || []
        : [];
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch user data for each post
      const postsWithUserData = await Promise.all(
        posts.map(async (post) => {
          const userDoc = await getDoc(doc(db, "users", post.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          return {
            ...post,
            user: userData,
            timeStamp: post.timeStamp?.toDate(),
          };
        })
      );
      const currentUserLikedPosts = [];
      const followedUsersLikedPosts = [];
      const publicUsersLikedPosts = [];

      postsWithUserData.forEach((post) => {
        const currentUserPost = post.userId === currentUser;
        const followingUserLikedPost = followingList.includes(post.userId);
        const publicUserLikedPost = post.user.accountType !== "private";

        if (currentUserPost) {
          currentUserLikedPosts.push(post);
        } else if (followingUserLikedPost) {
          followedUsersLikedPosts.push(post);
        } else if (publicUserLikedPost) {
          publicUsersLikedPosts.push(post);
        }
      });

      // Sort each category by timestamp in descending order
      currentUserLikedPosts.sort((a, b) => b.timeStamp - a.timeStamp);
      followedUsersLikedPosts.sort((a, b) => b.timeStamp - a.timeStamp);
      publicUsersLikedPosts.sort((a, b) => b.timeStamp - a.timeStamp);

      // Combine all categories
      const allLikedPosts = [
        ...currentUserLikedPosts,
        ...followedUsersLikedPosts,
        ...publicUsersLikedPosts,
      ];
      // Set the posts with user data to state
      setLikedPosts(allLikedPosts);
    } catch (error) {
      console.error("Error fetching liked posts: ", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
      setError("Server down, Please try again later");
    }
  };

  const handleLikePost = async (id) => {
    if (!id) return;
    setPostId(id);
    try {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const likes = postData.likes || [];
        const hasLiked = likes.includes(currentUser);

        // Update the 'likes' field in the database
        await updateDoc(postRef, {
          likes: hasLiked ? arrayRemove(currentUser) : arrayUnion(currentUser),
        });
      }
    } catch (error) {
      console.error("Error liking post: ", error);
      toast.error("Could not process.");
    }
  };

  useEffect(() => {
    if (!postId) return;
    const postRef = doc(db, "posts", postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const postData = docSnap.data();

        // Update 'homePagePosts'
        const updatedHomePagePosts = homePagePosts.map((post) =>
          post.id === postId ? { ...post, likes: postData.likes } : post
        );
        setHomePagePosts(updatedHomePagePosts);
        // Update 'otherPublicPostsHomePage'
        setOtherPublicPostsHomePage((prev) =>
          prev?.map((post) =>
            post?.id === postId ? { ...post, likes: postData.likes } : post
          )
        );
        // Update 'userPosts'
        setUserPosts((prevUserPosts) =>
          prevUserPosts?.map((post) =>
            post?.id === postId ? { ...post, likes: postData.likes } : post
          )
        );
        // Update 'likedPosts'
        if (postData.likes.includes(currentUser)) {
          setLikedPosts((prevLikedPosts) => {
            // If the post is already in likedPosts, update it
            const postIndex = prevLikedPosts.findIndex(
              (post) => post.id === postId
            );
            if (postIndex > -1) {
              return prevLikedPosts.map((post) =>
                post.id === postId ? { ...post, likes: postData.likes } : post
              );
            } else {
              // If the post is not in likedPosts, add it
              return [...prevLikedPosts, { ...postData, id: postId }];
            }
          });
        } else {
          // If the post is unliked, remove it from likedPosts
          setLikedPosts((prevLikedPosts) =>
            prevLikedPosts.filter((post) => post.id !== postId)
          );
        }
      }
    });

    return () => unsubscribe(); // Clean up the subscription
    // eslint-disable-next-line
  }, [
    postId,
    homePagePosts,
    setHomePagePosts,
    setOtherPublicPostsHomePage,
    setUserPosts,
    setLikedPosts,
  ]);

  // save post handle
  const handleSavePost = async (id) => {
    if (!id) return;
    setPostId(id);
    try {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const saves = postData.saves || [];
        const hasSaved = saves.includes(currentUser);

        // Update the 'saves' field in the database
        await updateDoc(postRef, {
          saves: hasSaved ? arrayRemove(currentUser) : arrayUnion(currentUser),
        });
      }
    } catch (error) {
      console.error("Error saving post: ", error);
      toast.error("Could not process.");
    }
  };

  useEffect(() => {
    if (!postId) return;
    const postRef = doc(db, "posts", postId);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const postData = docSnap.data();

        // Update homePagePosts
        const updatedPosts = homePagePosts.map((post) =>
          post.id === postId ? { ...post, saves: postData.saves } : post
        );
        setHomePagePosts(updatedPosts);
        // Update userSavedPosts
        setUserPosts((prev) =>
          prev?.map((post) =>
            post?.id === postId ? { ...post, saves: postData.saves } : post
          )
        );
        // Update userSavedPosts
        if (postData.saves.includes(currentUser)) {
          setSavedPosts((prevSavedPosts) => {
            // If the post is already in userSavedPosts, update it
            const postIndex = prevSavedPosts.findIndex(
              (post) => post.id === postId
            );
            if (postIndex > -1) {
              return prevSavedPosts.map((post) =>
                post.id === postId ? { ...post, saves: postData.saves } : post
              );
            } else {
              // If the post is not in userSavedPosts, add it
              return [...prevSavedPosts, { ...postData, id: postId }];
            }
          });
        } else {
          // If the post is unsaved, remove it from userSavedPosts
          setSavedPosts((prevSavedPosts) =>
            prevSavedPosts.filter((post) => post.id !== postId)
          );
        }
        // Update otherImageSavePosts
        setOtherPublicPostsHomePage((prev) =>
          prev?.map((post) =>
            post?.id === postId ? { ...post, saves: postData.saves } : post
          )
        );
      }
    });

    return () => unsubscribe(); // Clean up the listener on unmount
    // eslint-disable-next-line
  }, [
    postId,
    homePagePosts,
    setHomePagePosts,
    setOtherPublicPostsHomePage,
    setSavedPosts,
  ]);

  const fetchHomePagePosts = async () => {
    setPostsLoading(true);
    try {
      if (!currentUser) {
        return;
      }

      // Fetch the current user's following list
      const currentUserDoc = await getDoc(doc(db, "users", currentUser));
      const currentUserData = currentUserDoc.exists()
        ? currentUserDoc.data()
        : {};
      const followingList = currentUserData.following || [];

      // Fetch all posts from the database
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

      // Separate the posts into current user's, followed users', and other users' posts
      const currentUserPosts = [];
      const followedUsersPosts = [];
      const otherUsersPosts = [];

      postsWithUserData.forEach((post) => {
        const isCurrentUser = post.userId === currentUser;
        const isFollowing = followingList.includes(post.userId);
        const isPrivate = post.userData.accountType === "private";

        if (isCurrentUser) {
          currentUserPosts.push(post);
        } else if (isFollowing) {
          followedUsersPosts.push(post);
        } else if (!isPrivate) {
          otherUsersPosts.push(post);
        }
      });

      // Sort each category by timestamp in descending order
      currentUserPosts?.sort((a, b) => b.timeStamp - a.timeStamp);
      followedUsersPosts.length > 0 &&
        followedUsersPosts?.sort((a, b) => b.timeStamp - a.timeStamp);
      otherUsersPosts.sort((a, b) => b.timeStamp - a.timeStamp);

      // Combine the categories: current user's posts, followed users' posts, and other users' posts
      const combinedPosts = [
        // sortedPosts,
        ...currentUserPosts,
        ...followedUsersPosts,
      ];

      setPostsLoading(false);
      setHomePagePosts(combinedPosts);
      setOtherPublicPostsHomePage(otherUsersPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
      setError("Server down, Please try again later");

      setPostsLoading(false);
    }
  };

  const fetchExploreAllPosts = async () => {
    setPostsLoading(true);
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

      // // Filter out posts from private accounts
      const publicPosts = postsWithUserData.filter(
        (post) => post.userData.accountType !== "private"
      );
      // Sort posts by timestamp in descending order
      publicPosts.sort((a, b) => b.timeStamp - a.timeStamp);
      setPostsLoading(false);
      setExplorePosts(publicPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
      setError("Server down, Please try again later");
    }
  };

  const handleDeletePost = async (id) => {
    const postRef = doc(db, "posts", id);
    // const postSnap = await getDoc(postRef);
    toast.loading("deleting post");
    // Delete all files in the user's posts directory
    const postStorageRef = ref(storage, id);
    const postListResult = await listAll(postStorageRef);

    const postDeletePromises = postListResult.items.map((itemRef) => {
      return deleteObject(itemRef);
    });
    await Promise.all(postDeletePromises);
    await deleteDoc(postRef);
    const postCommentsRef = doc(db, "postComments", id);
    await deleteDoc(postCommentsRef);
    toast.dismiss();
    toast.success("Post deleted");
    handleFetchUserPosts();
    fetchHomePagePosts();
  };
  return (
    <PostContext.Provider
      value={{
        postData,
        setPostData,
        navigate,
        postComment,
        setPostComment,
        postComments,
        setPostComments,
        isPublished,
        formatDate,
        fetchPostById,
        fetchPostComments,
        handleDeleteComment,
        handleLikeComment,
        handleLikePost,
        handlePostComment,
        fetchHomePagePosts,
        homePagePosts,
        fetchExploreAllPosts,
        explorePosts,
        postsLoading,
        userDataWithPostId,
        handleSavePost,
        handleFetchUserPosts,
        userPosts,
        savedPosts,
        handleFetchSavedPosts,
        handleFetchLikedPosts,
        handleDeletePost,
        likedPosts,
        otherPublicPostsHomePage,
        error,
        handleArchivePost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
export default PostContext;
