import React, { useContext, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsEye, BsEyeSlash } from "react-icons/bs";

const Login = () => {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordType, setPasswordType] = useState("password");

  const handleTogglePasswordType = () => {
    if (passwordType === "password") {
      setPasswordType("text");
    } else {
      setPasswordType("password");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(false);
    await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);
        setIsLoading(true);
        navigate("/");
        dispatch({ type: "LOGIN", payload: user });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
        setLoading(false);
        setError("Invalid credentials");
      });
  };
  return (
    <div
      className={`flex flex-col items-center justify-center h-[100vh] w-full text-white bg-neutral-900 space-y-3`}
    >
      <h1 className="text-2xl font-semibold my-3">Log In</h1>
      <form onSubmit={handleLogin} className="flex flex-col space-y-4">
        <input
          className="border-[1px] rounded-md w-72 p-2 bg-inherit focus:outline-none"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
        />
        <div className="flex items-center justify-between w-72 border-[1px] rounded-md">
          <input
            className="rounded-md w-72 p-2 bg-inherit focus:outline-none"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            type={passwordType}
            placeholder="Password"
          />
          <span className="mx-4" onClick={handleTogglePasswordType}>
            {passwordType === "password" ? <BsEye /> : <BsEyeSlash />}
          </span>{" "}
        </div>
        {loading && <span className="text-sm w-fit text-red-600">{error}</span>}
        <button className="flex justify-center border-[1px] rounded-md w-72 p-2" type="submit">
          {isLoading ? (
            "Submit"
          ) : (
            <AiOutlineLoading3Quarters className="animate-spin my-1" />
          )}
        </button>
        <span>
          New User? &nbsp;{" "}
          <Link className="text-blue-500 font-medium" to="/signup">
            Create Account
          </Link>
        </span>
      </form>
    </div>
  );
};

export default Login;
