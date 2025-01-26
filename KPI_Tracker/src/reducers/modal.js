const modal = (state = false, action) => {
  switch (action.type) {
    case "UPDATE_MODAL":
      return action.value;
    case "CLOSE_MODAL":
      return action.value;
    default:
      return state;
  }
}

export default modal;
