const AuthReducer = (state, action) => {
  switch (action.type) {
    case "SIGNUP": {
      return {
        currentUser: action.payload,
      };
    }
    case "LOGIN": {
      return {
        currentUser: action.payload,
      };
    }
    case "LOGOUT": {
      return {
        currentUser: null,
      };
    }
    case "DELETE": {
      return {
        currentUser: null,
      };
    }
    default:
      return state;
  }
};

export default AuthReducer;
