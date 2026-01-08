import { apiService } from "./api";

export const logisticsService = {
  // Calculate shipping price
  async calculatePrice(origin, destination, weight) {
    try {
      const response = await apiService.post("/api/shipping/calculate", {
        origin,
        destination,
        weight: parseFloat(weight),
      });
      return response;
    } catch (error) {
      console.error("Price calculation failed:", error);
      throw new Error("Failed to calculate shipping price");
    }
  },

  // Get warehouse locations
  async getWarehouseLocations() {
    try {
      const response = await apiService.get("/api/warehouses/locations");
      return response;
    } catch (error) {
      console.error("Failed to fetch warehouse locations:", error);
      throw new Error("Failed to fetch warehouse locations");
    }
  },

  // Get available services
  async getServices() {
    try {
      const response = await apiService.get("/api/services");
      return response;
    } catch (error) {
      console.error("Failed to fetch services:", error);
      throw new Error("Failed to fetch available services");
    }
  },

  // Submit quote request
  async submitQuoteRequest(formData) {
    try {
      const response = await apiService.post("/api/quotes/request", formData);
      return response;
    } catch (error) {
      console.error("Quote request failed:", error);
      throw new Error("Failed to submit quote request");
    }
  },

  // Track shipment
  async trackShipment(trackingNumber) {
    try {
      const response = await apiService.get(`/api/tracking/${trackingNumber}`);
      return response;
    } catch (error) {
      console.error("Tracking failed:", error);
      throw new Error("Failed to track shipment");
    }
  },
};
