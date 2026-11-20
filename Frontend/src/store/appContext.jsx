import { createContext, useContext, useEffect, useReducer } from "react";

const getInitialThemePreference = () => {
  if (typeof window === "undefined") return "system";
  try {
    const savedTheme = window.localStorage.getItem("swiftmove-theme");
    if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  } catch {
    // Fall back to the system setting when browser storage is unavailable.
  }
  return "system";
};

const resolveTheme = (preference) => {
  if (preference === "dark" || preference === "light") return preference;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
};

const createInitialState = () => {
  const themePreference = getInitialThemePreference();
  const theme = typeof window === "undefined" ? "light" : resolveTheme(themePreference);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }
  return {
    user: null,
    isLoading: false,
    error: null,
    theme,
    themePreference,
    language: "en",
    notifications: [],
  };
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
        themePreference: action.payload,
      };

    case "SYSTEM_THEME_CHANGED":
      return { ...state, theme: action.payload };

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
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  useEffect(() => {
    const isDark = state.theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    try {
      if (state.themePreference === "system") window.localStorage.removeItem("swiftmove-theme");
      else window.localStorage.setItem("swiftmove-theme", state.themePreference);
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
    if (state.themePreference !== "system" || !window.matchMedia) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event) => {
      dispatch({ type: "SYSTEM_THEME_CHANGED", payload: event.matches ? "dark" : "light" });
    };
    if (media.addEventListener) media.addEventListener("change", handleSystemThemeChange);
    else media.addListener?.(handleSystemThemeChange);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", handleSystemThemeChange);
      else media.removeListener?.(handleSystemThemeChange);
    };
  }, [state.theme, state.themePreference]);

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
      dispatch({ type: actionTypes.SET_THEME, payload: theme === "dark" ? "dark" : "light" });
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
