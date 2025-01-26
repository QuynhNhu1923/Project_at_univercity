const helpSider = (state = false, action) => {
  switch (action.type) {
    case "HELP_INFO_DASHBOARD":
      return action.open;
    case "HELP_CLOSE":
      return action.open;
    default:
      return state;
  }
}

export default helpSider;
