export const classifyQuoteResponse = (data) => {
  if (data?.manualEstimateRequired === true &&
    data?.pricingAvailable === false &&
    data?.pricingStatus === "manual_review" &&
    data?.serviceMode === "full_service") return "manual_review";
  if (data?.pricingAvailable === true && data?.breakdown && Number.isFinite(data?.total)) return "priced";
  return "invalid";
};

export const getQuoteErrorFeedback = (error) => {
  const code = error?.code;
  const missing = Array.isArray(error?.details?.missing) ? error.details.missing : [];
  const invalid = Array.isArray(error?.details?.invalid) ? error.details.invalid : [];

  if (code === "PRICING_NOT_CONFIGURED") {
    const configuration = [...missing.map((item) => `missing ${item}`), ...invalid.map((item) => `invalid ${item}`)];
    return {
      description: configuration.length
        ? `SwiftMove pricing is not configured for this quote (${configuration.join(", ")}). Please contact SwiftMove support to update the backend pricing settings.`
        : "SwiftMove pricing is not configured for this quote. Please contact SwiftMove support to check the backend pricing settings.",
      retryable: false,
      editAddresses: false,
    };
  }

  if (code === "LOCATION_NOT_FOUND" || code === "ROUTE_NOT_FOUND") {
    return {
      description: code === "LOCATION_NOT_FOUND"
        ? "We couldn’t resolve one or both addresses. Review the pickup and delivery details and try again."
        : "We couldn’t find a drivable route between these addresses. Review the pickup and delivery details and try again.",
      retryable: false,
      editAddresses: true,
    };
  }

  if (code === "DISTANCE_PROVIDER_NOT_CONFIGURED") {
    return { description: "The routing service is not configured. Please contact SwiftMove support.", retryable: false, editAddresses: false };
  }

  if (code === "DISTANCE_PROVIDER_ERROR" || (!code && error?.status === undefined)) {
    return {
      description: "The route service could not calculate a distance right now. Your booking details are saved; you can retry shortly.",
      retryable: true,
      editAddresses: false,
    };
  }

  if (error?.status === 429) {
    return { description: "Too many quote attempts were made. Please wait before requesting another estimate.", retryable: false, editAddresses: false };
  }

  return {
    description: error?.message || "We couldn’t prepare the estimate. Review your move details and try again.",
    retryable: Number(error?.status) >= 500,
    editAddresses: false,
  };
};
