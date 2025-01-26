import React from "react";
import all_icons from './../../assets/icon/all_icon';

const Logo = (props) => {
    return (
        <div className="logo">
            <img
                src={all_icons.logo}
                alt="logo"
                className="logo__img"
            />
            {!props.collapsed && (
                <img 
                    src={all_icons.logo_name} 
                    alt="KPI Tracker" 
                    className="logo__img" 
                />
            )}
        </div>
    );
};

export default Logo;
