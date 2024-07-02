import React, { useContext, useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { CgAdd } from "react-icons/cg";
import { MdPublish } from "react-icons/md";
import { TfiArrowCircleLeft } from "react-icons/tfi";
import { AuthContext } from "../context/AuthContext";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { BiZoomIn } from "react-icons/bi";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const CreatePost = () => {
  const inputRef = useRef();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUserData, setCurrentUserData] = useState(null);
  const [newPostData, setNewPostData] = useState({
    name: "",
    email: "",
    postCaption: "",
  });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const onChange = (e) => {
    setNewPostData({ ...newPostData, [e.target.name]: e.target.value });
  };

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

  const handleUploadFiles = async () => {
    if (files.length === 0) return [];
    const uploadPromises = files.map((file) => {
      const name = new Date().getTime() + "_" + file.name;
      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");

            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
              default:
                break;
            }
          },
          (error) => {
            console.log(error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File available at", downloadURL);
            resolve(downloadURL);
          }
        );
      });
    });

    return Promise.all(uploadPromises);
  };

  const handleSavePost = async () => {
    const fileURLs = await handleUploadFiles();
    const { postCaption } = newPostData;
    const name = currentUserData?.name;
    const email = currentUserData?.email;
    const userId = currentUser.uid;

    try {
      await setDoc(doc(db, "posts", userId), {
        name: name,
        email: email,
        postCaption: postCaption,
        fileURLs: fileURLs,
      });
      setSuccessMessage("Post created successfully!");
      console.log("post created and published");
      toast.success("Post published");
      navigate("/");
      setNewPostData({ name: "", email: "", postCaption: "" });
      setFiles([]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="text-white flex justify-center w-screen max-w-[430px] bg-zinc-950 h-screen">
      <div className="flex flex-col items-center justify-center mt-1 space-y-4 w-[95%] h-[90%]">
        <div className="flex items-center justify-between h-12 p-2 bg-zinc-900 rounded-md w-full max-w-[400px]">
          <span
            onClick={() => {
              navigate(-1);
            }}
            className="shadow-sm shadow-blue-800 border-[1px] border-blue-800 p-2 rounded-md duration-200"
          >
            <TfiArrowCircleLeft />
          </span>
          <span>Create Post</span>
          <span
            className="shadow-sm shadow-blue-800 border-[1px] border-blue-800 p-2 rounded-md duration-200 cursor-pointer"
            onClick={handleSavePost}
          >
            <MdPublish />
          </span>
        </div>
        <div className="h-[88%] w-full bg-zinc-900 rounded-md">
          <form className="relative w-full h-full">
            <div className="h-fit flex space-x-4 w-full justify-start p-3">
              {currentUserData?.img && (
                <img
                  src={currentUserData.img}
                  className="h-12 w-12 duration-200 rounded-full border-[1px] border-blue-800"
                  alt=""
                />
              )}
              <div className="flex flex-col space-y-1">
                <span className="font-medium">{currentUserData?.name}</span>
                <span>{currentUserData?.email}</span>
              </div>
            </div>
            <div className="w-full h-fit p-2 mb-3">
              <textarea
                type="text"
                className="w-full bg-inherit focus:outline-none p-2"
                placeholder={`What's on your mind, ${currentUserData?.name} ?`}
                rows={5}
                name="postCaption"
                onChange={onChange}
                value={newPostData.postCaption}
              />
              <input
                ref={inputRef}
                hidden
                type="file"
                multiple
                accept="image/*, video/*"
                onChange={handleFileChange}
              />
              <div className="grid grid-cols-2 gap-3 h-60 p-2 w-full overflow-y-auto mx-auto">
                {files.map((file, index) => (
                  <div key={index} className="relative">
                    {file.type.startsWith("image/") && (
                      <div className="w-full relative">
                        <img
                          onMouseDown={BiZoomIn}
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-[8rem] h-[8rem] object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 right-2 p-1 bg-gray-800 text-white rounded-full"
                        >
                          <AiOutlineClose size={20} />
                        </button>
                      </div>
                    )}
                    {file.type.startsWith("video/") && (
                      <div className="relative w-full m-1">
                        <video
                          controls
                          className="h-[8rem] border-2 w-[8rem] object-cover rounded-md"
                        >
                          <source
                            src={URL.createObjectURL(file)}
                            type={file.type}
                          />
                        </video>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 right-2 p-1 bg-gray-800 text-white rounded-full"
                        >
                          <AiOutlineClose size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center p-2 absolute bottom-0 w-full h-12 border-[1px] border-blue-900">
              <span>Add to your Post</span>
              <div className="flex items-center space-x-3">
                <CgAdd
                  onClick={() => {
                    inputRef.current.click();
                  }}
                  className="cursor-pointer"
                  size={20}
                />
                <span className="cursor-pointer text-xl mb-[3px]">@</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
