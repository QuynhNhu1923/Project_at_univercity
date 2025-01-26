const target = (state = [], action) => {
  switch (action.type) {
    case "ADD_TARGET":
      if (state === null) {
        return [action.value];
      }
      return [
        ...state,
        action.value
      ];
    case "CLOSE_MODAL_TARGET":
      return [];
    case "OPEN_KPI":
      return action.value;
    case "REMOVE_TARGET":
      return state.filter(target => target.name !== action.payload);
    default:
      return state;
  }
}

export default target;
