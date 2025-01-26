// actions/Sider.js
export const CHANGE_SIDER = 'CHANGE_SIDER';

export const changeSider = (key) => {
    return (dispatch) => {
        localStorage.setItem('siderKey', key);
        dispatch({
            type: CHANGE_SIDER,
            payload: key
        });
    }
};
