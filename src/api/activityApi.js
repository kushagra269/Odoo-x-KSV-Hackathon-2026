import http, { useMocks } from "./http";
import { mockApi } from "./mockApi";

export const activityApi = {
  getAll: async (filter) => {
    if (useMocks) return mockApi.getActivity(filter);
    const params = filter && filter !== "all" ? { entity_type: filter } : {};
    const { data } = await http.get("/activity", { params });
    return data;
  },
};
