const helpReducer = (state = false, action) => {
  switch (action.type) {
    case "HELP_SIDER":
      return action.open;
    case "HELP_SIDER_CLOSE":
      return action.open;
    default:
      return state;
  }
}

export default helpReducer;