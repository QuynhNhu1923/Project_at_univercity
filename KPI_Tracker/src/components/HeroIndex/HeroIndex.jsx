import React from "react";
import { Link } from "react-router-dom";
import all_imgs from './../../assets/img/all_img';

const HeroIndex = () => {
    return (
        <div className="index-hero">
            <div className="index-hero-left">
                <h2>
                    <strong>Unlock your potential with KPI Tracker</strong> -
                    the ultimate tool to achieve success.
                </h2>
                <p>
                    Whether you're a driven student seeking to maximize your
                    learning outcomes or a dedicated educator aiming to support
                    your students' growth, the KPI Tracker is your ultimate
                    companion on the path to academic excellence
                </p>
                <div className="index-hero__group-btn">
                <Link to="/login?mode=signup">
                        <button className="btn">Sign Up</button>
                    </Link>
                    <Link to="/login">
                        <button className="btn">Sign In</button>
                    </Link>
                </div>
            </div>
            <div className="index-hero-right">
                <img src={all_imgs.index_1} alt="" />
            </div>
            <img src={all_imgs.index_2} alt="" className="background-index-img-1"/>
            <img src={all_imgs.index_3} alt="" className="background-index-img-2"/>
        </div>
    );
};

export default HeroIndex;
