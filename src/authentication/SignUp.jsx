import React, { useContext, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { FaUserPlus } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const SignUp = () => {
  const imageRef = useRef();

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [file, setFile] = useState("");
  const { dispatch, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [passwordType, setPasswordType] = useState("password");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState([]);

  const handleTogglePasswordType = () => {
    if (passwordType === "password") {
      setPasswordType("text");
    } else {
      setPasswordType("password");
    }
  };
  const handleImageOnChange = (e) => {
    imageRef.current.click();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const handleUploadFile = () => {
      const name = new Date().getTime() + "_" + file.name;
      const storageRef = ref(storage, name); // Create a reference with the desired file path
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => {
          console.log(error);
          // setError(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setData((prev) => ({ ...prev, img: downloadURL }));
          });
        }
      );
    };
    if (file) handleUploadFile();
  }, [file]);

  const onChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const generateUsername = (name) => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generates a random number between 1000 and 9999
    return `${name}${randomDigits}`;
  };
  const username = data.name.split(" ");
  const updatedName = username[0];
  const generateUser_name = generateUsername(updatedName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(false);
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await setDoc(doc(db, "users", response.user.uid), {
        ...data,
        followers: data.followers || [],
        following: data.following || [],
        user_name: generateUser_name,
        timeStamp: serverTimestamp(),
        accountType: "private",
      });
      setData({
        name: "",
        email: "",
        password: "",
      });
      setFile("");
      setLoading(true);
      dispatch({ type: "SIGNUP", payload: response.user });
      if (currentUser && currentUser.email) {
        const q = query(
          collection(db, "users"),
          where("email", "==", currentUser.email)
        );
        const querySnapshot = await getDocs(q);
        console.log(querySnapshot);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log({ data, uid: currentUser.uid });
          setUserData(data, currentUser.uid);
          localStorage.setItem(
            "loggedInUserData",
            JSON.stringify(userData, currentUser.uid)
          );
        });
      }
      navigate("/userProfile");
      console.log(response.user, data);
      await sendEmailVerification(response.user);
    } catch (error) {
      console.error(error);
      setError("Email already in use");
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen w-screen max-w-[430px] text-white bg-neutral-900 space-y-3">
        <h1 className="text-2xl font-semibold my-3">Create Account</h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center space-y-4"
        >
          <div className="flex justify-center w-72">
            {!file ? (
              <div>
                <FaUserPlus onClick={handleImageOnChange} size={45} />
                <input
                  name="image"
                  className="hidden"
                  ref={imageRef}
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])} // Corrected this line
                />
              </div>
            ) : (
              <img className="h-16 w-16 rounded-full" src={data.img} alt="" />
            )}
          </div>
          <input
            className="border-[1px] rounded-md w-72 p-2 bg-inherit focus:outline-none"
            type="text"
            name="name"
            id="name"
            required
            placeholder="Name"
            value={data.name}
            onChange={onChange}
          />
          <input
            className="border-[1px] rounded-md w-72 p-2 bg-inherit focus:outline-none"
            type="email"
            name="email"
            id="email"
            required
            placeholder="Email"
            value={data.email}
            onChange={onChange}
          />
          <div className="flex justify-between items-center border-[1px] rounded-md w-72 p-2 bg-inherit">
            <input
              className="bg-inherit focus:placeholder:text-gray-300 focus:outline-none"
              type={passwordType}
              name="password"
              id="password"
              required
              placeholder="Password"
              value={data.password}
              onChange={onChange}
            />
            <span
              className="mx-2 cursor-pointer"
              onClick={handleTogglePasswordType}
            >
              {passwordType === "password" ? <BsEye /> : <BsEyeSlash />}
            </span>
          </div>
          <button
            className="border-[1px] flex justify-center rounded-md w-72 p-2"
            type="submit"
          >
            {loading ? (
              "Submit"
            ) : (
              <AiOutlineLoading3Quarters className="animate-spin my-1" />
            )}
          </button>
          <span>
            Already Registered? &nbsp;
            <Link className="text-blue-500 font-medium" to="/login">
              Log In
            </Link>
          </span>
        </form>
      </div>
    </>
  );
};

export default SignUp;
