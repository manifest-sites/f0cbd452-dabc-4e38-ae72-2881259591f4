export function createEntityClient(entityName, schema) {
      
    const baseUrl = `https://manifestcrm-backend.onrender.com/api/manifest-user-01/entities/${entityName}`;

    return {
      list: async (sort) => {
        const url = new URL(baseUrl);
        if (sort) url.searchParams.set("sort", sort);
        const res = await fetch(url);
        return res.json();
      },
      get: async (id) => {
        const res = await fetch(`${baseUrl}/${id}`);
        return res.json();
      },
      create: async (data) => {
        const res = await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return res.json();
      },
      // Add update() using PUT
      update: async (id, data) => {
        const res = await fetch(`${baseUrl}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return res.json();
      },
      // Add delete() using DELETE
      delete: async (id) => {
        const res = await fetch(`${baseUrl}/${id}`, {
          method: "DELETE",
        });
        return res.json();
      },
    };
  }
  