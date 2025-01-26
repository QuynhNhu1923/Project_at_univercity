const initialState = localStorage.getItem('siderKey') || '1';


const sider = (state = initialState, action) => {
  switch (action.type) {
    case "SIDER":
      return action.value;
    default:
      return state;
  }
}

export default sider;