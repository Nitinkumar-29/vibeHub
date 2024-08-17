import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { Link, useParams } from "react-router-dom";
import { CgSpinner } from "react-icons/cg";
import { AuthContext } from "../context/AuthContext";
import { FaUser } from "react-icons/fa";

const FollowingList = () => {
  const [followingList, setFollowingList] = useState([]);
  const { userId } = useParams();
  const currentUser = localStorage.getItem("currentUser");
  const { handleFollow } = useContext(AuthContext);
  const [followingId, setFollowingId] = useState("");

  const handleFetchFollowingList = async () => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    const docSnapShot = docSnap.exists ? docSnap.data() : [];

    // follower list
    const followings = docSnapShot.following;
    const followingData = await Promise.all(
      followings.map(async (following) => {
        const followerDoc = await getDoc(doc(db, "users", following));
        const followerData = followerDoc.exists ? followerDoc.data() : [];

        return {
          id: followerDoc.id,
          data: followerData,
        };
      })
    );
    setFollowingList(followingData);
  };

  useEffect(() => {
    if (!followingId) return;
    const docRef = doc(db, "users", followingId);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      try {
        handleFetchFollowingList();
        setFollowingId("");
        return () => unsubscribe();
      } catch (error) {}
    });
    // eslint-disable-next-line
  }, [followingId]);

  useEffect(() => {
    handleFetchFollowingList();
    // eslint-disable-next-line
  }, []);
  return (
    <>
      {followingList && followingList ? (
        <div>
          {followingList?.length > 0 ? (
            <div className="h-full w-full flex flex-col space-y-4 items-center px-4 mt-4">
              {followingList
                .sort((a, b) => {
                  if (a.id === currentUser) {
                    return -1;
                  } else if (b.id === currentUser) {
                    return 1;
                  }
                  return a.user_name;
                })
                .map((following, index) => {
                  return (
                    <div
                      className="flex justify-start items-center space-x-4 w-full"
                      key={index}
                    >
                      <div>
                      {following?.data?.img? (
                      <img
                        src={following?.data?.img}
                        className="h-12 w-12 object-cover rounded-full"
                        alt=""
                      />
                    ) : (
                      <FaUser size={48} className="rounded-full" />
                    )}
                      </div>
                      <Link
                        to={
                          following.id === currentUser
                            ? `/userProfile/yourPosts`
                            : `/users/${following.id}/profile`
                        }
                        className="flex flex-col flex-1"
                      >
                        <span>
                          {following?.data?.name &&
                          following?.data?.name?.length > 15
                            ? `${following?.data?.name.slice(0, 10)}...`
                            : following?.data?.name}
                        </span>
                        <span className="text-sm text-zinc-400">
                          {following?.data?.user_name}
                        </span>
                      </Link>
                      <div className="ml-auto">
                        {following?.data?.followers?.includes(currentUser) ? (
                          <button
                            onClick={() => {
                              handleFollow(following.id);
                              setFollowingId(following.id);
                            }}
                            className="text-center px-2 py-1 border-[1px] border-zinc-700 text-yellow-600 rounded-md w-28"
                          >
                            Following
                          </button>
                        ) : (
                          <div className="flex items-center">
                            {following.id === currentUser ? (
                              <span className="text-center px-2 py-1 text-green-600 rounded-md w-28">
                                You
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  handleFollow(following.id);
                                  setFollowingId(following.id);
                                }}
                                className="text-center px-2 py-1 border-[1px] border-zinc-700 rounded-md w-28"
                              >
                                {following?.data?.followRequests?.includes(
                                  currentUser
                                ) ? (
                                  <span className="text-orange-600">
                                    Requested
                                  </span>
                                ) : (
                                  <span className="text-blue-600">Follow</span>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="h-20 w-full flex items-center justify-center">
              <span className="text-zinc-400">0 following</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-20 w-full flex items-center justify-center">
          <CgSpinner className="animate-spin" size={40} />
        </div>
      )}
    </>
  );
};

export default FollowingList;
