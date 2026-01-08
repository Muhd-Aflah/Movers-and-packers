import { createContext, useContext, useReducer } from "react";

// Initial state
const initialState = {
  user: null,
  isLoading: false,
  error: null,
  theme: "light",
  language: "en",
  notifications: [],
};

// Action types
const actionTypes = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_USER: "SET_USER",
  LOGOUT: "LOGOUT",
  SET_THEME: "SET_THEME",
  SET_LANGUAGE: "SET_LANGUAGE",
  ADD_NOTIFICATION: "ADD_NOTIFICATION",
  REMOVE_NOTIFICATION: "REMOVE_NOTIFICATION",
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isLoading: false,
      };

    case actionTypes.LOGOUT:
      return {
        ...state,
        user: null,
      };

    case actionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    case actionTypes.SET_LANGUAGE:
      return {
        ...state,
        language: action.payload,
      };

    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case actionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };

    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    setLoading: (isLoading) => {
      dispatch({ type: actionTypes.SET_LOADING, payload: isLoading });
    },

    setError: (error) => {
      dispatch({ type: actionTypes.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    },

    setUser: (user) => {
      dispatch({ type: actionTypes.SET_USER, payload: user });
    },

    logout: () => {
      dispatch({ type: actionTypes.LOGOUT });
    },

    setTheme: (theme) => {
      dispatch({ type: actionTypes.SET_THEME, payload: theme });
    },

    setLanguage: (language) => {
      dispatch({ type: actionTypes.SET_LANGUAGE, payload: language });
    },

    addNotification: (notification) => {
      const id = Date.now().toString();
      dispatch({
        type: actionTypes.ADD_NOTIFICATION,
        payload: { ...notification, id },
      });
    },

    removeNotification: (id) => {
      dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: id });
    },
  };

  const value = {
    ...state,
    ...actions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
