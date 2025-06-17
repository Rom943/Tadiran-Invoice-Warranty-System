import { DataProvider } from "react-admin";

// Set the API URL based on your backend location
const API_URL = "https://tadiran-invoice-warranty-system.onrender.com/api";

// Function to handle API responses and standardize error handling
const handleResponse = async (response: Response) => {
  const text = await response.text();

  // Try to parse as JSON, but handle cases where response is not valid JSON
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Invalid JSON response:", text);
    throw new Error("Invalid server response");
  }

  if (response.status < 200 || response.status >= 300) {
    throw new Error(data.message || "Unknown error");
  }

  return data;
};

// Helper function for API requests
const apiRequest = async (url: string, options: any = {}) => {
  // Default options
  const defaultOptions = {
    credentials: "include" as RequestCredentials,
    headers: new Headers({ "Content-Type": "application/json" }),
  };
  console.log(options);
  // Merge options
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    return handleResponse(response);
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// Helper to build query string
const buildQueryString = (params: Record<string, any>): string => {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (typeof value === "object") {
        return `${key}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      return `${key}=${encodeURIComponent(value)}`;
    })
    .join("&");
};

// Custom data provider for our backend API structure
export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = "id", order = "ASC" } = params.sort || {};

    // Build query parameters
    const queryParams: Record<string, any> = {
      page,
      limit: perPage,
      // Add filters
      ...params.filter,
    };

    // Handle sorting if needed
    if (field && field !== "id") {
      queryParams.sortBy = field;
      queryParams.sortOrder = order.toLowerCase();
    }

    let url = "";

    if (resource === "installers") {
      url = `${API_URL}/admin/installers`;
    } else if (resource === "warranties") {
      url = `${API_URL}/admin/warranties`;
    } else if (resource === "registrationKeys") {
      url = `${API_URL}/keys`;
    } else if (resource === "admins") {
      url = `${API_URL}/admin/admins`;
    } else {
      url = `${API_URL}/${resource}`;
    }

    const queryString = buildQueryString(queryParams);
    if (queryString) {
      url = `${url}?${queryString}`;
    }

    const response = await apiRequest(url);
    console.log(response);

    return {
      data: response.data.map((item: any) => ({
        ...item,
        id: item.id,
      })),
      total: response.pagination?.total || response.data.length,
    };
  },

  getOne: async (resource, params) => {
    if (resource === "installers") {
      // For installer details, we'll get their warranties too
      const url = `${API_URL}/admin/installers/${params.id}/warranties`;
      const response = await apiRequest(url);

      return {
        data: {
          ...response.data.installer,
          id: response.data.installer?.id,
          warranties: response.data.warranties,
        },
      };
    } else if (resource === "warranties") {
      const url = `${API_URL}/admin/warranties`; // Fetching all to find one

      try {
        const response = await apiRequest(url);

        if (!response || !response.data || !Array.isArray(response.data)) {
          throw new Error(
            "Invalid response structure when fetching warranties for getOne"
          );
        }

        const warranty = response.data.find((w: any) => w.id === params.id);

        if (!warranty) {
          console.error(
            `dataProvider.getOne (warranties) - Warranty with id ${params.id} not found in list.`
          );
          throw new Error("Warranty not found");
        }

        return {
          data: { ...warranty, id: warranty.id }, 
        };
      } catch (error) {
        console.error(
          `dataProvider.getOne (warranties) - Error fetching warranty id ${params.id}:`,
          error
        );
        throw error; 
      }
    }

    // Default case for other resources

    const url = `${API_URL}/${resource}/${params.id}`;
    const response = await apiRequest(url);

    return {
      data: { ...response.data, id: response.data.id },
    };
  },

  getMany: async (resource, params) => {
    // Since the backend doesn't support fetching multiple resources by ID in one request,
    // we'll use getList and filter the results
    const { ids } = params;

    let url = "";
    if (resource === "installers") {
      url = `${API_URL}/admin/installers`;
    } else if (resource === "warranties") {
      url = `${API_URL}/admin/warranties`;
    } else if (resource === "registrationKeys") {
      url = `${API_URL}/admin/keys`;
    } else {
      url = `${API_URL}/${resource}`;
    }

    const response = await apiRequest(url);

    // Filter results to only include the requested IDs
    const filteredData = response.data.filter((item: any) =>
      ids.includes(item.id)
    );

    return {
      data: filteredData.map((item: any) => ({ ...item, id: item.id })),
    };
  },

  getManyReference: async (resource, params) => {
    const { target, id } = params;
    const { page, perPage } = params.pagination;

    // Build query params
    const queryParams: Record<string, any> = {
      page,
      limit: perPage,
      [target]: id, // e.g., installerId=123
    };

    let url = "";
    if (resource === "warranties" && target === "installerId") {
      // This is a specific case for fetching warranties related to an installer
      url = `${API_URL}/admin/installers/${id}/warranties`; // Assuming this endpoint exists
    } else {
      // Generic case, might need adjustment based on your API structure
      url = `${API_URL}/${resource}`;
    }

    const queryString = buildQueryString(queryParams);
    if (queryString) {
      url = `${url}?${queryString}`;
    }

    const response = await apiRequest(url);

    return {
      data: response.data.map((item: any) => ({ ...item, id: item.id })),
      total: response.pagination?.total || response.data.length,
    };
  },

  update: async (resource, params) => {
    let url = "";
    if (resource === "warranties") {
      url = `${API_URL}/warranties/${params.id}`;
    } else if (resource === "installers") {
      // Example: might be different if you update installers differently
      url = `${API_URL}/admin/installers/${params.id}`;
    } else {
      url = `${API_URL}/${resource}/${params.id}`;
    }
    const { data } = params;

    try {
      const response = await fetch(url, {
        method: "PUT",
        credentials: "include" as RequestCredentials,
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify(data),
      });

      return handleResponse(response);
    } catch (error) {
      console.error(
        `dataProvider.update - Error updating resource ${resource} with id ${params.id}:`,
        error
      );
      throw error;
    }
  },

  updateMany: async (resource, params) => {
    console.warn('updateMany called but not implemented.');
    return { data: params.ids };
  },

  create: async (resource, params) => {
    let url = "";
    console.log("dataProvider.create - resource:", resource, "params:", params);
    if (resource === "registrationKeys") {
      console.log("registrationKeys")
      // Special handling for creating registration keys
      url = `${API_URL}/keys`; // Assuming this is the endpoint

      try {
        const response = await fetch(url, {
          method: "POST",
          credentials: "include" as RequestCredentials,
          headers: new Headers({ "Content-Type": "application/json" }),
        });

        return handleResponse(response);
      } catch (error) {
        console.error(`dataProvider.create (registrationKeys) - Error:`, error);
        throw error;
      }
    } 
    else if (resource === "admins") {
      url = `${API_URL}/admin/register`;
      console.log("Creating admin user with params:", params.data);
      try {
        const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify(params.data),
          headers: new Headers({ "Content-Type": "application/json" }),
          credentials: "include" as RequestCredentials, // Include cookies for session management
        });
        // The backend returns the created admin user in response.data
        return handleResponse(response);
      } catch (error) {
        console.error(`dataProvider.create (admins) - Error:`, error);
        throw error;
      }
    } else {
      // Default create logic for other resources
      url = `${API_URL}/${resource}`;

      try {
        const response = await apiRequest(url, {
          method: "POST",
          body: JSON.stringify(params.data),
        });

        return { data: { ...response.data, id: response.data.id } };
      } catch (error) {
        throw error;
      }
    }
  },

  delete: async (resource, params) => {
    const url = `${API_URL}/keys/${params.id}`;

    try {
      await apiRequest(url, { method: "DELETE" });

      // React Admin expects the deleted record (or at least its ID) in the response.
      // If previousData is available and conforms to RecordType, it's a good candidate.
      // Otherwise, just returning the id is often sufficient if the full record isn't returned by the API.
      return {
        data: params.previousData
          ? params.previousData
          : ({ id: params.id } as any),
      };
    } catch (error) {
      console.error(
        `dataProvider.delete - Error deleting resource ${resource} with id ${params.id}:`,
        error
      );
      throw error;
    }
  },

  deleteMany: async (resource, params) => {
    const { ids } = params;

    const responses = await Promise.all(
      ids.map((id) =>
        apiRequest(`${API_URL}/${resource}/${id}`, { method: "DELETE" })
      )
    );

    // React Admin expects an array of IDs of the deleted records.
    return { data: ids };
  },
};

export default dataProvider;
