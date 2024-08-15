import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

const FollwersList = () => {
  const [followersList, setFollowersList] = useState([]);
  const { userId } = useParams();
  const currentUser = localStorage.getItem("currentUser");
  let isOwner = userId === currentUser;
  // Handle follow/unfollow
  const handleManageFollow = async (id) => {
    try {
      toast.loading("Processing your request");
      const targetUserRef = doc(db, "users", id);
      const currentUserRef = doc(db, "users", currentUser);
      const targetUserSnap = await getDoc(targetUserRef);
      const currentUserSnap = await getDoc(currentUserRef);

      if (targetUserSnap.exists() && currentUserSnap.exists()) {
        const targetUserSnapShot = targetUserSnap.data();

        // Ensure followers and following fields are arrays
        const targetUserFollowers = targetUserSnapShot.followers || [];
        if (targetUserFollowers.includes(currentUser)) {
          // Unfollow the user
          await Promise.all([
            updateDoc(targetUserRef, {
              followers: arrayRemove(currentUser),
            }),
            updateDoc(currentUserRef, {
              following: arrayRemove(id),
            }),
          ]);
          toast.dismiss();
          toast.success("Unfollowed");
          handleFetchFollowersList();
        } else {
          // Follow the user
          await Promise.all([
            updateDoc(targetUserRef, {
              followers: arrayUnion(currentUser),
            }),
            updateDoc(currentUserRef, {
              following: arrayUnion(id),
            }),
          ]);
          toast.dismiss();
          const docSnapData = targetUserSnapShot;
          toast.success(`You are now following ${docSnapData.name}`);
          handleFetchFollowersList();
        }
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error updating followers");
      console.error("Error updating followers:", error);
    }
  };

  const handleFetchFollowersList = async () => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    const docSnapShot = docSnap.exists ? docSnap.data() : [];

    // follower list
    const followers = docSnapShot.followers;
    const followersData = await Promise.all(
      followers.map(async (follower) => {
        const followerDoc = await getDoc(doc(db, "users", follower));
        const followerData = followerDoc.exists ? followerDoc.data() : [];

        return {
          id: followerDoc.id,
          data: followerData,
        };
      })
    );
    setFollowersList(followersData);
  };

  // handleRemoveFollower
  const handleRemoveFollower = async (id) => {
    try {
      toast.loading("Removing....");
      const docRef = doc(db, "users", currentUser);
      const docSnap = await getDoc(docRef);
      const targetRef = doc(db, "users", id);
      const docSnapShot = docSnap.exists ? docSnap.data() : [];
      const currentUserFollowersList = docSnapShot.followers;

      let updatedList;

      // check whether the currentuserid is your id
      if (currentUserFollowersList.includes(id)) {
        await Promise.all([
          updateDoc(docRef, { followers: arrayRemove(id) }),
          updateDoc(targetRef, {
            following: arrayRemove(currentUser),
          }),
        ]);
        updatedList = followersList.filter((follower) => follower.id !== id);
        setFollowersList(updatedList);
        toast.dismiss();
        toast.success("Removed");
      }
    } catch (error) {}
  };

  useEffect(() => {
    handleFetchFollowersList();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      {followersList.length > 0 ? (
        <div className="h-full w-full flex flex-col items-center space-y-4 px-4 mt-4">
          {followersList
            ?.sort((a, b) => {
              if (a.id === currentUser) {
                return -1;
              } else if (b.id === currentUser) {
                return 1;
              }
              return a.user_name;
            })
            .map((follower, index) => {
              return (
                <div className="flex justify-between min-w-[90%]" key={index}>
                  <div>
                    <img
                      src={follower?.data?.img}
                      className="h-10 w-10 object-cover rounded-full"
                      alt=""
                    />
                  </div>
                  <Link
                    to={
                      follower.id === currentUser
                        ? `/userProfile/yourPosts`
                        : `/users/${follower.id}/profile`
                    }
                    className="flex flex-col "
                  >
                    <span>{follower?.data?.name}</span>
                    <span className="text-sm text-gray-400">
                      {follower?.data?.user_name}
                    </span>
                  </Link>

                  {!isOwner && (
                    <div>
                      {follower?.data?.followers?.includes(currentUser) ? (
                        <button
                          // eslint-disable-next-line no-undef
                          onClick={() => handleManageFollow(follower.id)}
                          className="px-4 py-2 border-[1px] border-gray-700 rounded-md"
                        >
                          Unfollow &nbsp;
                        </button>
                      ) : (
                        <div className="flex items-center">
                          {follower.id === currentUser ? (
                            <button className="cursor-auto px-8 py-2 ">
                              You
                            </button>
                          ) : (
                            <button
                              // eslint-disable-next-line no-undef
                              onClick={() => handleManageFollow(follower.id)}
                              className="px-4 py-2 border-[1px] border-gray-700 rounded-md"
                            >
                              Follow Back
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {isOwner && (
                    <div>
                      <button
                        onClick={() => {
                          handleRemoveFollower(follower.id);
                        }}
                        className="px-4 py-2 border-[1px] border-gray-700 rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="h-20 w-full flex items-center justify-center">
          <span className="text-zinc-400">0 followers</span>
        </div>
      )}
    </div>
  );
};

export default FollwersList;
