const API_DOMAIN = "https://backup-db.vercel.app/";

export const get = async (path) => {
  try {
      const response = await fetch(API_DOMAIN + path);

      if (!response.ok) {
          const errorText = await response.text(); // Read response as text in case of an error
          throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;
  } catch (error) {
      console.error("Fetch error:", error);
      throw error; // Rethrow the error to be handled by the calling function
  }
};

export const post = async (path, data) => {
  try {
    const response = await fetch(`${API_DOMAIN}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    return response; // Trả về phản hồi để xử lý trong `postKpis`
  } catch (error) {
    console.error('Error in POST request:', error);
    throw error; // Ném lỗi để xử lý ở cấp cao hơn
  }
};


export const del = async (path, id) => {
  const url = `${API_DOMAIN}${path}/${id}`;
  try {
    const response = await fetch(url, {
      method: "DELETE"
    });
    
    // Check if the response status indicates a successful deletion
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error while deleting resource at ${url}:`, error);
    return { error: error.message };
  }
};


export const patch = async(path,options) => {
  const response = await fetch(API_DOMAIN + path,{
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(options)
  })
  const result = response.json();
  return result;
}

export const patch1 = async (path, data) => {
  try {
    const response = await fetch(`${API_DOMAIN}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    return response; // Trả về phản hồi để xử lý trong `postKpis`
  } catch (error) {
    console.error('Error in POST request:', error);
    throw error; // Ném lỗi để xử lý ở cấp cao hơn
  }
};
