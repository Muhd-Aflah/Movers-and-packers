import { apiRequest } from "./api";

export const moveService = {
  createMove: async (moveData) => {
    return apiRequest("/api/moves", {
      method: "POST",
      body: JSON.stringify(moveData),
    });
  },
};