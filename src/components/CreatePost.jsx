import React, { useContext, useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { AuthContext } from "../context/AuthContext";
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
import { db, storage } from "../firebase";
import { BiLoader, BiZoomIn } from "react-icons/bi";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { TiAttachmentOutline } from "react-icons/ti";
import { VscMention } from "react-icons/vsc";
import { PiMusicNotesPlusFill } from "react-icons/pi";
import { GiMusicalNotes } from "react-icons/gi";
import { TbMusicOff } from "react-icons/tb";
import { TbMusicCheck } from "react-icons/tb";
const CreatePost = () => {
  const inputRef = useRef();
  const audioRef = useRef();
  const audioControl = useRef();
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(null);

  const [newPostData, setNewPostData] = useState({
    name: "",
    email: "",
    postCaption: "",
  });

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleAudioFileChange = (e) => {
    setAudioFile(e.target.files[0]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };
  const handlePlay = () => {
    const audioElement = audioControl.current;
    if (audioElement) {
      audioElement.play();
      audioElement.loop = true;
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    const audioElement = audioControl.current;
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
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

  const handlehashtag = async () => {
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  };

  const handlePublishPost = async (e) => {
    e.preventDefault();
    setIsPublished(false);
    let audioURL = "";
    const name = "audio " + audioFile?.name;
    toast.loading("Publishing your thoughts...");

    if (audioFile) {
      const audioRef = ref(storage, `audio/${name}`);
      const uploadTask = await uploadBytesResumable(audioRef, audioFile);
      audioURL = await getDownloadURL(uploadTask.ref);
    }
    const fileURLs = await handleUploadFiles();
    const { postCaption } = newPostData;

    try {
      setIsPublished(false);
      const postPublished = await addDoc(collection(db, "posts"), {
        postCaption: postCaption,
        fileURLs: fileURLs,
        userId: currentUser.uid,
        audio: audioURL,
        audioName: name,
        timeStamp: serverTimestamp(),
        saves: [],
        likes: [],
      });
      console.log(postPublished);
      setIsPublished(true);
      toast.dismiss();
      toast.success("Post published");
      navigate("/");
      setNewPostData({
        name: "",
        email: "",
        postCaption: "",
      });
      setFiles([]);
    } catch (error) {
      setIsPublished(false);
      console.error(error);
    }
  };

  return (
    <div className="text-white flex justify-center w-full bg-zinc-950 h-full">
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="min-h-screen h-full w-full bg-inherit rounded-md pb-16">
          <form className="relative w-full h-full hideScrollbar mt-2">
            <div className="h-16 flex space-x-4 w-full justify-start p-3 border-t-[1px] border-blue-950">
              {currentUserData?.img && (
                <img
                  src={currentUserData.img}
                  className="h-12 w-12 duration-200 rounded-full"
                  alt=""
                  value={currentUserData.userProfileImage}
                />
              )}
              <div className="flex flex-col space-y-1">
                <span className="font-medium">{currentUserData?.name}</span>
                <div>
                  <input
                    type="file"
                    accept="audio/mp3"
                    hidden
                    ref={audioRef}
                    value={audioFile || ""}
                    onChange={handleAudioFileChange}
                  />
                  {audioFile && (
                    <audio
                      className="border-2 bg-inherit"
                      onPlay={handlePlay}
                      onPause={handlePause}
                      ref={audioControl}
                    >
                      <source
                        src={URL.createObjectURL(audioFile)}
                        type={audioFile.type}
                      />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  {!audioFile ? (
                    <PiMusicNotesPlusFill
                      size={15}
                      className="cursor-pointer"
                      onClick={() => {
                        audioRef.current.click();
                      }}
                    />
                  ) : (
                    <div>
                      {isPlaying === null ? (
                        <div className="flex items-center space-x-4">
                          <TbMusicCheck
                            className="cursor-pointer"
                            size={15}
                            onClick={() => {
                              handlePlay();
                            }}
                          />
                          <span className="text-sm">Click to play</span>
                        </div>
                      ) : (
                        <div onClick={isPlaying ? handlePause : handlePlay}>
                          {isPlaying ? (
                            <GiMusicalNotes
                              size={15}
                              className="animate-pulse cursor-pointer"
                            />
                          ) : (
                            <TbMusicOff size={20} className="cursor-pointer" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center w-full h-fit p-2">
              <textarea
                type="textarea"
                className="w-full focus:outline-none p-2 my-1 bg-zinc-900 rounded-md placeholder:text-zinc-400 overflow-y-auto"
                placeholder={`What's on your mind, ${currentUserData?.name} ?`}
                rows={6}
                name="postCaption"
                onChange={onChange}
                required
                value={newPostData.postCaption || ""}
              />
              <input
                ref={inputRef}
                hidden
                type="file"
                multiple
                accept="image/*, video/*"
                onChange={handleFileChange}
              />
              <div className="flex items-center justify-between mb-2 p-2 rounded-md bg-zinc-900 w-full">
                <div className="flex items-center space-x-2">
                  <TiAttachmentOutline
                    onClick={() => {
                      inputRef.current.click();
                    }}
                    size={23}
                    className="cursor-pointer"
                  />
                  <VscMention
                    onClick={handlehashtag}
                    size={25}
                    className="cursor-pointer"
                  />
                </div>
                <button
                  className="p-1 rounded-md duration-200 cursor-pointer"
                  onClick={handlePublishPost}
                >
                  {isPublished === null && "Publish"}
                  {isPublished === false && (
                    <BiLoader size={25} className="animate-spin" />
                  )}
                </button>
              </div>
              <span className="w-full text-zinc-500 pb-2">
                Please try to post media in 4:3 ratio
              </span>
              <div className="grid col-start-auto grid-cols-2 gap-3 w-full">
                {files?.map((file, index) => (
                  <div key={index} className="relative w-full">
                    {file.type.startsWith("image/") && (
                      <div className="w-[11.8rem] h-[9rem] relative">
                        <img
                          onMouseDown={BiZoomIn}
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-full object-cover rounded-md"
                        />
                        <span
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 p-2 bg-gray-800 text-white rounded-full"
                        >
                          <AiOutlineClose size={16} />
                        </span>
                      </div>
                    )}
                    {file.type.startsWith("video/") && (
                      <div className="relative w-[11.8rem] h-[9.1rem]">
                        <video
                          controls
                          className="w-full h-full object-contain rounded-md"
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
