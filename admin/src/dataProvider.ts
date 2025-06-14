import { DataProvider } from 'react-admin';

// Set the API URL based on your backend location
const API_URL = 'http://localhost:3000/api';

// Function to handle API responses and standardize error handling
const handleResponse = async (response: Response) => {
  console.log('Response status:', response.status);
  const text = await response.text();
  
  // Try to parse as JSON, but handle cases where response is not valid JSON
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('Invalid JSON response:', text);
    throw new Error('Invalid server response');
  }
  
  console.log('Response data:', data);
  
  if (response.status < 200 || response.status >= 300) {
    throw new Error(data.message || 'Unknown error');
  }
  
  return data;
};

// Helper function for API requests
const apiRequest = async (url: string, options: any = {}) => {
  // Default options
  const defaultOptions = {
    credentials: 'include' as RequestCredentials,
    headers: new Headers({ 'Content-Type': 'application/json' }),
  };
  
  // Merge options
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  console.log(`${options.method || 'GET'} ${url}`, finalOptions);
  
  try {
    const response = await fetch(url, finalOptions);
    return handleResponse(response);
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Helper to build query string
const buildQueryString = (params: Record<string, any>): string => {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      return `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');
};

// Custom data provider for our backend API structure
export const dataProvider: DataProvider = {  getList: async (resource, params) => {
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = 'id', order = 'ASC' } = params.sort || {};
    
    // Build query parameters
    const queryParams: Record<string, any> = {
      page,
      limit: perPage,
      // Add filters
      ...params.filter
    };
    
    // Handle sorting if needed
    if (field && field !== 'id') {
      queryParams.sortBy = field;
      queryParams.sortOrder = order.toLowerCase();
    }
    
    let url = '';
    
    if (resource === 'installers') {
      url = `${API_URL}/admin/installers`;
    } else if (resource === 'warranties') {
      url = `${API_URL}/admin/warranties`;
    } else {
      url = `${API_URL}/${resource}`;
    }
    
    const queryString = buildQueryString(queryParams);
    if (queryString) {
      url = `${url}?${queryString}`;
    }
    
    const response = await apiRequest(url);
    
    return {
      data: response.data.map((item: any) => ({ 
        ...item, 
        id: item.id 
      })),
      total: response.pagination?.total || response.data.length,
    };
  },

  getOne: async (resource, params) => {
    if (resource === 'installers') {
      // For installer details, we'll get their warranties too
      const url = `${API_URL}/admin/installers/${params.id}/warranties`;
      const response = await apiRequest(url);
      
      return {
        data: { 
          ...response.data.installer, 
          id: response.data.installer?.id,
          warranties: response.data.warranties
        }
      };
    } else if (resource === 'warranties') {
      // Since there's no direct endpoint to get a single warranty,
      // we'll fetch all warranties and find the one we need
      const url = `${API_URL}/admin/warranties`;
      const response = await apiRequest(url);
      
      const warranty = response.data.find((w: any) => w.id === params.id);
      if (!warranty) {
        throw new Error('Warranty not found');
      }
      
      return {
        data: { ...warranty, id: warranty.id }
      };
    }
    
    // Default case
    const url = `${API_URL}/${resource}/${params.id}`;
    const response = await apiRequest(url);
    
    return {
      data: { ...response.data, id: response.data.id }
    };
  },

  getMany: async (resource, params) => {
    // Since the backend doesn't support fetching multiple resources by ID in one request,
    // we'll use getList and filter the results
    const { ids } = params;
    
    let url = '';
    if (resource === 'installers') {
      url = `${API_URL}/admin/installers`;
    } else if (resource === 'warranties') {
      url = `${API_URL}/admin/warranties`;
    } else {
      url = `${API_URL}/${resource}`;
    }
    
    const response = await apiRequest(url);
    
    // Filter results to only include the requested IDs
    const filteredData = response.data.filter((item: any) => ids.includes(item.id));
    
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
      [target]: id,
      ...params.filter
    };
    
    let url = '';
    if (resource === 'installers') {
      url = `${API_URL}/admin/installers`;
    } else if (resource === 'warranties') {
      url = `${API_URL}/admin/warranties`;
    } else {
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
  },  update: async (resource, params) => {
    if (resource === 'warranties') {
      // For warranties, we have a specific endpoint for updating status
      // Check if we're updating status
      if (params.data.status) {
        // The correct endpoint is /warranties/:id/status, not /admin/warranties/:id/status
        const url = `${API_URL}/warranties/${params.id}/status`;
        console.log(`Updating warranty status at URL: ${url}`);
        console.log(`Status update payload:`, { status: params.data.status });
        
        const response = await apiRequest(url, {
          method: 'PATCH',
          body: JSON.stringify({ status: params.data.status }),
        });
        
        return {
          data: { ...params.data, id: params.id }
        };
      }
      
      // For other updates
      const url = `${API_URL}/admin/warranties/${params.id}`;
      const response = await apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(params.data),
      });
      
      return {
        data: { ...response.data, id: response.data.id }
      };
    }
    
    // Default case for other resources
    const url = `${API_URL}/${resource}/${params.id}`;
    const response = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    });
    
    return {
      data: { ...response.data, id: response.data.id }
    };
  },
  updateMany: async (resource, params) => {
    // The backend doesn't support batch updates, so we'll update one by one
    const { ids, data } = params;
    
    // Process updates sequentially
    await Promise.all(ids.map(async (id) => {
      // Need to include previousData for TypeScript
      // Get the current data first to use as previousData
      const { data: currentData } = await dataProvider.getOne(resource, { id });
      return dataProvider.update(resource, { id, data, previousData: currentData });
    }));
    
    return { data: ids };
  },

  create: async (resource, params) => {
    const url = `${API_URL}/${resource}`;
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });
    
    return {
      data: { ...response.data, id: response.data.id }
    };
  },

  delete: async (resource, params) => {
    const url = `${API_URL}/${resource}/${params.id}`;
    const response = await apiRequest(url, {
      method: 'DELETE',
    });
    
    return {
      data: { ...response.data, id: params.id }
    };
  },
  deleteMany: async (resource, params) => {
    // The backend doesn't support batch deletes, so we'll delete one by one
    const { ids } = params;
    
    // Process deletes sequentially
    await Promise.all(ids.map(async (id) => {
      // Need to include previousData for TypeScript
      // Get the current data first to use as previousData
      const { data: currentData } = await dataProvider.getOne(resource, { id });
      return dataProvider.delete(resource, { id, previousData: currentData });
    }));
    
    return { data: ids };
  },
};
