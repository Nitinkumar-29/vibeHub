import React, { useContext, useEffect, useRef, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
    mobileNumber: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [file, setFile] = useState("");
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [passwordType, setPasswordType] = useState("password");
  const [loading, setLoading] = useState(true);

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
          // setError(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log("File available at", downloadURL);
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
        timeStamp: serverTimestamp(),
      });
      setData({
        name: "",
        email: "",
        password: "",
        mobileNumber: "",
        address: "",
      });
      setLoading(true);
      setFile("");
      dispatch({ type: "SIGNUP", payload: response.user });
      console.log(response.user, data);
      navigate("/profile");
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
            placeholder="Name"
            value={data.name}
            onChange={onChange}
          />
          <input
            className="border-[1px] rounded-md w-72 p-2 bg-inherit focus:outline-none"
            type="email"
            name="email"
            id="email"
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
          <input
            className="border-[1px] rounded-md w-72 p-2 bg-inherit focus:outline-none"
            type="text"
            name="address"
            id="address"
            placeholder="Address"
            value={data.address}
            onChange={onChange}
          />
          <input
            className="border-[1px] rounded-md w-72 p-2 bg-inherit focus:outline-none"
            type="phone"
            name="mobileNumber"
            id="mobileNumber"
            placeholder="Mobile Number"
            value={data.mobileNumber}
            onChange={onChange}
          />
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
