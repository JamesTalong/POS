import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../Images/logo.png";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import Loader from "../../components/loader/Loader";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [imgUrl, setImgUrl] = useState(null);
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [errEmail, setErrEmail] = useState("");
  const [errPassword, setErrPassword] = useState("");
  const [errCPassword, setErrCPassword] = useState("");

  const handleEmail = (e) => setEmail(e.target.value);
  const handlePassword = (e) => setPassword(e.target.value);
  const handleConfirmPassword = (e) => setCPassword(e.target.value);
  const handleFullName = (e) => setFullName(e.target.value);
  const handlePhone = (e) => setPhone(e.target.value);
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImgUrl(file ? URL.createObjectURL(file) : null);
  };

  const EmailValidation = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (checked) {
      if (!email) {
        setErrEmail("Enter your email");
        setIsLoading(false);
      } else if (!EmailValidation(email)) {
        toast.error("Enter a valid email");
        setErrEmail("Enter a valid email");
        setIsLoading(false);
      }

      if (!password) {
        setErrPassword("Create a password");
      } else if (password.length < 6) {
        toast.error("Passwords must be at least 6 characters");
        setErrPassword("Passwords must be at least 6 characters");
        setIsLoading(false);
      }

      if (!cPassword) {
        setErrCPassword("Confirm your password");
      } else if (password !== cPassword) {
        toast.error("Passwords do not match");
        setErrCPassword("Passwords do not match");
        setIsLoading(false);
      }

      if (
        email &&
        EmailValidation(email) &&
        password &&
        password.length >= 6 &&
        cPassword &&
        password === cPassword
      ) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;

          await setDoc(doc(db, "user", user.uid), {
            email: user.email,
            fullName,
            phone,
            imgUrl: imgUrl || null,
            admin: "No",
            createdAt: new Date(),
          });

          setEmail("");
          setPassword("");
          setCPassword("");
          setFullName("");
          setPhone("");
          setImgUrl(null);

          setIsLoading(false);
          toast.success("Registration Successful.");
          navigate("/signin");
        } catch (error) {
          toast.error(error.message);
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <>
      <ToastContainer />
      {isLoading && <Loader />}
      <div className="min-h-screen flex">
        <div className="flex items-center justify-center w-full lg:w-1/2 bg-orange-50 px-8 py-12">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-lg">
            <div className="text-center">
              <img
                className="mx-auto h-20 w-auto"
                src={logo}
                alt="Ichthus Technology Logo"
              />
              <h2 className="mt-4 text-3xl font-bold text-gray-900">
                Ichthus Technology
              </h2>
              <p className="mt-2 text-sm text-gray-600">Create your account</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={handleFullName}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhone}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Phone Number"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label htmlFor="imageUpload" className="sr-only">
                  Upload Image
                </label>
                <input
                  id="imageUpload"
                  name="imageUpload"
                  type="file"
                  onChange={handleImageUpload}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Upload Image"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmail}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Email address"
                />
                {errEmail && (
                  <p className="text-red-500 text-xs mt-1">{errEmail}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={handlePassword}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Password"
                />
                {errPassword && (
                  <p className="text-red-500 text-xs mt-1">{errPassword}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={cPassword}
                  onChange={handleConfirmPassword}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                  placeholder="Confirm Password"
                />
                {errCPassword && (
                  <p className="text-red-500 text-xs mt-1">{errCPassword}</p>
                )}
              </div>

              {/* CheckBox */}
              <div className="flex items-center gap-1">
                <input
                  onClick={() => setChecked(!checked)}
                  className="w-4 h-4 bg-white"
                  type="checkbox"
                />
                <p className="text-sm text-gray-600">
                  I agree to the{" "}
                  <span className="underline cursor-pointer">
                    terms and conditions
                  </span>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Sign Up
              </button>
              <p className="text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link to="/signin">
                  <span className="underline cursor-pointer text-blue-600">
                    Sign In
                  </span>
                </Link>
              </p>
            </form>
          </div>
        </div>
        {/* Right section with background image */}
        <div
          className="hidden lg:block lg:w-1/2 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://www.computersciencedegreehub.com/wp-content/uploads/2020/06/How-Much-Do-Network-Administrators-Earn-scaled.jpg')",
          }}
        ></div>
      </div>
    </>
  );
};

export default SignUp;
