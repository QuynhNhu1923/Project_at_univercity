import React from "react";
import { Link } from "react-router-dom";
import Logo from "./../../components/Logo/Logo";
import all_imgs from "./../../assets/img/all_img";
import all_icons from "./../../assets/icon/all_icon";

const Info = () => {
    return (
        <div className="info">
            <div className="top-bar">
                <Logo />
                <div className="top-act">
                    <Link to="/login?mode=signup">
                        <button className="btn">Sign Up</button>
                    </Link>
                    <Link to="/login">
                        <button className="btn">Sign In</button>
                    </Link>
                </div>
            </div>
            <div className="info-hero">
                <div className="info-hero-left">
                    <h2>
                        <strong>Unlock your potential with KPI Tracker</strong>{" "}
                        - the ultimate tool to achieve success.
                    </h2>
                    <p>
                        Whether you're a driven student seeking to maximize your
                        learning outcomes or a dedicated educator aiming to
                        support your students' growth, the KPI Tracker is your
                        ultimate companion on the path to academic excellence
                    </p>
                    <div className="info-hero__group-btn">
                        <Link to="/login?mode=signup">
                            <button className="btn">Sign Up</button>
                        </Link>
                        <Link to="/login">
                            <button className="btn">Sign In</button>
                        </Link>
                    </div>
                </div>
                <div className="info-hero-right">
                    <img src={all_imgs.index_1} alt="" />
                </div>
                <img
                    src={all_imgs.index_2}
                    alt=""
                    className="background-info-img-1"
                />
                <img
                    src={all_imgs.index_3}
                    alt=""
                    className="background-info-img-2"
                />
            </div>
            <div className="index-feature grid wide">
                <div class="row">
                    <div class="col l-4 m-6 c-12">
                        <div className="flex-center">
                            <div className="index-feature-img">
                                <img src={all_icons.index_icon_1} alt="" />
                            </div>
                            <div>
                                <h3 className="index-feature-title">
                                    KPI Tracking
                                </h3>
                                <p className="index-feature-desc">
                                    Tracking process
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col l-4 m-6 c-12">
                        <div className="flex-center">
                            <div className="index-feature-img">
                                <img src={all_icons.index_icon_2} alt="" />
                            </div>
                            <div>
                                <h3 className="index-feature-title">
                                    Manage KPI
                                </h3>
                                <p className="index-feature-desc">
                                    Create, Edit and Delete
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col l-4 m-12 c-12">
                        <div className="flex-center">
                            <div className="index-feature-img">
                                <img src={all_icons.index_icon_3} alt="" />
                            </div>
                            <div>
                                <h3 className="index-feature-title">
                                    View Dashboard
                                </h3>
                                <p className="index-feature-desc">
                                    Schedule and more
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Info;
