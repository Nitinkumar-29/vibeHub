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
  updateDoc,
  where,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { db, storage } from "../../firebase";
import { AuthContext } from "../AuthContext";
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
  const userData = JSON.parse(localStorage.getItem("loggedInUserData"));
  const { currentUser } = useContext(AuthContext);
  const [postsLoading, setPostsLoading] = useState(false);
  const [userDataWithPostId, setUserDataWithPostId] = useState();
  const [userPosts, setUserPosts] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [otherUserPosts, setOtherUserPosts] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [otherPublicPostsHomePage, setOtherPublicPostsHomePage] = useState([]);

  const fetchPostById = async (id) => {
    const postRef = doc(db, "posts", id);
    const postDocSnap = await getDoc(postRef);
    const postDataWithId = postDocSnap.data();
    setPostData(postDataWithId);
    const userDataWithPostRef = doc(db, "users", postDataWithId.userId);
    const userDataDocSnap = await getDoc(userDataWithPostRef);
    const userDataWithPostUserId = userDataDocSnap.data();
    setUserDataWithPostId(userDataWithPostUserId);
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
    }
  };

  const handlePostComment = async (id) => {
    setIsPublished(false);
    toast.loading("Processing...");

    const { commentText } = postComment;
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);
    const docUserData = [];
    if (docSnap.exists()) {
      docUserData.push(docSnap.data());
    }
    try {
      await addDoc(collection(db, "postComments"), {
        comment: commentText,
        userId: currentUser.uid,
        postId: id,
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
    const queryPosts = [];
    const q = query(
      collection(db, "posts"),
      where("userId", "==", currentUser.uid)
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
    handleFetchSavedPosts();
  };

  const handleFetchSavedPosts = async () => {
    try {
      if (!currentUser) {
        throw new Error("Current user not found");
      }

      // Fetch saved posts
      const q = query(
        collection(db, "posts"),
        where("saves", "array-contains", currentUser.uid)
      );
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      const followingList = docSnap.exists()
        ? docSnap.data().following || []
        : [];
      console.log(followingList);

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

      console.log(postsWithUserData);

      const currentUserSavedPosts = [];
      const followedUsersSavedPosts = [];
      const publicUsersSavedPosts = [];

      postsWithUserData.forEach((post) => {
        const currentUserPost = post.userId === currentUser.uid;
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

      console.log(allSavedPosts);

      // Set the sorted posts to state
      setSavedPosts(allSavedPosts);
      console.log(allSavedPosts);
      handleFetchLikedPosts();
    } catch (error) {
      console.error("Error fetching saved posts: ", error);
    }
  };

  const handleFetchLikedPosts = async () => {
    try {
      // Fetch saved posts
      const q = query(
        collection(db, "posts"),
        where("likes", "array-contains", currentUser.uid)
      );
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      const followingList = docSnap.exists()
        ? docSnap.data().following || []
        : [];

      console.log(followingList);

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

      console.log(postsWithUserData);

      const currentUserLikedPosts = [];
      const followedUsersLikedPosts = [];
      const publicUsersLikedPosts = [];

      postsWithUserData.forEach((post) => {
        const currentUserPost = post.userId === currentUser.uid;
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

      console.log(allLikedPosts);
      // Set the posts with user data to state
      setLikedPosts(allLikedPosts);
    } catch (error) {
      console.error("Error fetching saved posts: ", error);
    }
  };

  const handleLikePost = async (id) => {
    try {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const likes = postData.likes || [];
        let updatedPosts;

        if (likes.includes(currentUser.uid)) {
          // Optimistically update UI
          updatedPosts = homePagePosts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  likes: post.likes.filter((uid) => uid !== currentUser.uid),
                }
              : post
          );
          setHomePagePosts(updatedPosts);
          setOtherPublicPostsHomePage((prev) =>
            prev?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    likes: post.likes.filter((uid) => uid !== currentUser.uid),
                  }
                : post
            )
          );
          toast.loading("Removing like...");
          // Update database
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser.uid),
          });
          toast.dismiss();
          toast.success("Like removed");
          handleFetchUserPosts();
          handleFetchSavedPosts();
          handleFetchLikedPosts();
        } else {
          // Optimistically update UI
          updatedPosts = homePagePosts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  likes: [...post?.likes, currentUser?.uid],
                }
              : post
          );
          setHomePagePosts(updatedPosts);
          setOtherPublicPostsHomePage((prev) =>
            prev?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    likes: [...post?.likes, currentUser?.uid],
                  }
                : post
            )
          );
          toast.loading("Adding like...");
          // Update database
          await updateDoc(postRef, {
            likes: arrayUnion(currentUser.uid),
          });
          toast.dismiss();
          toast.success("Liked");
        }

        // Fetch the latest post data
        fetchPostById(id);
        handleFetchUserPosts();
        handleFetchSavedPosts();
        handleFetchLikedPosts();
      }
    } catch (error) {
      console.error("Error liking post: ", error);
      toast.dismiss();
      toast.error("Could not process.");

      // Revert the optimistic update if there is an error
      fetchPostById(id);
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
          toast.loading("Removing like...");
          await updateDoc(commentRef, {
            likes: arrayRemove(currentUser.uid),
            likesCount: increment(-1),
          });
          await fetchPostComments(postId); // Update comments list
          toast.dismiss();
          toast.success("Like removed");
        } else {
          toast.loading("Adding like...");
          await updateDoc(commentRef, {
            likes: arrayUnion(currentUser.uid),
            likesCount: increment(1),
          });
          await fetchPostComments(postId); // Update comments list
          toast.dismiss();
          toast.success("Liked");
        }
      }
    } catch (error) {
      console.error("Error liking comment: ", error);
    }
  };

  const fetchHomePagePosts = async () => {
    setPostsLoading(true);
    // if (!localStorage.getItem("token")) {
    //   setPostsLoading(false);
    //   return;
    // }
    try {
      if (!currentUser) {
        return;
      }

      // Fetch the current user's following list
      const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
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
        const isCurrentUser = post.userId === currentUser.uid;
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
      // let sortedPosts = [...currentUserPosts, ...followedUsersPosts].sort(
      //   (a, b) => b.timeStamp - a.timeStamp
      // );
      // if (followedUsersPosts.length === 0) {
      //   sortedPosts = [...currentUserPosts];
      // }
      otherUsersPosts.sort((a, b) => b.timeStamp - a.timeStamp);

      // Combine the categories: current user's posts, followed users' posts, and other users' posts
      const combinedPosts = [
        // sortedPosts,
        ...currentUserPosts,
        ...followedUsersPosts,
      ];

      setPostsLoading(false);
      setHomePagePosts(combinedPosts);
      console.log(combinedPosts);
      setOtherPublicPostsHomePage(otherUsersPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
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
      console.log(publicPosts);
      // Sort posts by timestamp in descending order
      publicPosts.sort((a, b) => b.timeStamp - a.timeStamp);
      setPostsLoading(false);
      setExplorePosts(publicPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  const handleSavePost = async (id) => {
    try {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const postData = postSnap?.data(); // This is the fetched data
        const saves = postData?.saves || []; // Initialize saves array from fetched data

        if (saves.includes(currentUser?.uid)) {
          toast.loading("Removing...");

          await updateDoc(postRef, {
            saves: arrayRemove(currentUser?.uid),
          });

          setHomePagePosts((prevPosts) =>
            prevPosts?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    saves: post?.saves?.filter(
                      (uid) => uid !== currentUser?.uid
                    ),
                  }
                : post
            )
          );
          setOtherPublicPostsHomePage((prev) =>
            prev?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    saves: post?.saves?.filter(
                      (uid) => uid !== currentUser?.uid
                    ),
                  }
                : post
            )
          );
          toast.dismiss();
          toast.success("removed");
          handleFetchUserPosts();
          handleFetchSavedPosts();
          handleFetchLikedPosts();
        } else {
          toast.loading("saving...");

          await updateDoc(postRef, {
            saves: arrayUnion(currentUser?.uid),
          });
          setHomePagePosts((prevPosts) =>
            prevPosts?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    saves: [...post?.saves, currentUser?.uid],
                  }
                : post
            )
          );
          setOtherPublicPostsHomePage((prev) =>
            prev?.map((post) =>
              post?.id === id
                ? {
                    ...post,
                    saves: [...post?.saves, currentUser?.uid],
                  }
                : post
            )
          );
          toast.dismiss();
          toast.success("saved");
          handleFetchUserPosts();
          handleFetchSavedPosts();
        }
        fetchPostById(id);
      } else {
        console.log("No such post document!");
      }
    } catch (error) {
      console.error("Error saving post: ", error);
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

  useEffect(() => {
    fetchHomePagePosts();
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
        otherUserPosts,
        otherPublicPostsHomePage,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
export default PostContext;
