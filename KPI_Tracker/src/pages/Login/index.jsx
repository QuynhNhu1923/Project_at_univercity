import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faGoogle } from "@fortawesome/free-brands-svg-icons";
import all_icons from "./../../assets/icon/all_icon";
import Logo from "./../../components/Logo/Logo";
import { Link, useLocation } from "react-router-dom";

const LoginForm = () => {
    const location = useLocation();

    useEffect(() => {
        const sign_in_btn = document.querySelector("#sign-in-btn");
        const sign_up_btn = document.querySelector("#sign-up-btn");
        const container = document.querySelector(".container");

        const handleSignUp = () => {
            container.classList.add("sign-up-mode");
        };

        const handleSignIn = () => {
            container.classList.remove("sign-up-mode");
        };

        if (location.search.includes("mode=signup")) {
            handleSignUp();
        }

        sign_up_btn.addEventListener("click", handleSignUp);
        sign_in_btn.addEventListener("click", handleSignIn);

        return () => {
            sign_up_btn.removeEventListener("click", handleSignUp);
            sign_in_btn.removeEventListener("click", handleSignIn);
        };
    }, [location.search]);

    return (
        <div className="login">
            <div className="container">
                <div className="forms-container">
                    <div className="signin-signup">
                        <form action="#" className="sign-in-form">
                            <Logo />
                            <h2 className="title">Sign in</h2>
                            <div className="input-field">
                                <input
                                    type="text"
                                    required
                                    autoComplete="off"
                                />
                                <label htmlFor="username">Username</label>
                            </div>
                            <div className="input-field">
                                <input
                                    type="password"
                                    required
                                    autoComplete="off"
                                />
                                <label htmlFor="password">Password</label>
                            </div>
                            <Link to="/dashboard">
                                <button className="btn solid">Login</button>
                            </Link>
                            <p className="social-text">
                                Or Sign in with social platforms
                            </p>
                            <div className="social-media">
                                <button type="button" className="social-icon">
                                    <FontAwesomeIcon icon={faFacebookF} />
                                </button>
                                <button type="button" className="social-icon">
                                    <FontAwesomeIcon icon={faGoogle} />
                                </button>
                            </div>
                        </form>
                        <form action="#" className="sign-up-form">
                            <Logo />
                            <h2 className="title">Sign up</h2>
                            <div className="input-field">
                                <input
                                    type="text"
                                    required
                                    autoComplete="off"
                                />
                                <label htmlFor="username">Username</label>
                            </div>
                            <div className="input-field">
                                <input
                                    type="text"
                                    required
                                    autoComplete="off"
                                />
                                <label htmlFor="email">Email</label>
                            </div>
                            <div className="input-field">
                                <input
                                    type="password"
                                    required
                                    autoComplete="off"
                                />
                                <label htmlFor="password">Password</label>
                            </div>
                            <input
                                type="submit"
                                className="btn"
                                value="Sign up"
                            />
                            <p className="social-text">
                                Or Sign up with social platforms
                            </p>
                            <div className="social-media">
                                <button type="button" className="social-icon">
                                    <FontAwesomeIcon icon={faFacebookF} />
                                </button>
                                <button type="button" className="social-icon">
                                    <FontAwesomeIcon icon={faGoogle} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="panels-container">
                    <div className="panel left-panel">
                        <div className="content">
                            <h3>New here ?</h3>
                            <p>
                                Lorem ipsum, dolor sit amet consectetur
                                adipisicing elit. Debitis, ex ratione. Aliquid!
                            </p>
                            <button
                                className="btn transparent"
                                id="sign-up-btn"
                            >
                                Sign up
                            </button>
                        </div>
                        <img src={all_icons.login} className="image" alt="" />
                    </div>
                    <div className="panel right-panel">
                        <div className="content">
                            <h3>One of us ?</h3>
                            <p>
                                Lorem ipsum dolor sit amet consectetur
                                adipisicing elit. Nostrum laboriosam ad
                                deleniti.
                            </p>
                            <button
                                className="btn transparent"
                                id="sign-in-btn"
                            >
                                Sign in
                            </button>
                        </div>
                        <img src={all_icons.reg} className="image" alt="" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
