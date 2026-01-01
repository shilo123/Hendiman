import axios from "axios";
import { URL } from "@/Url/url";

let categoriesCache = null;
let categoriesPromise = null;

export async function loadCategories() {
  // Return cached data if available
  if (categoriesCache) {
    return categoriesCache;
  }

  // Return existing promise if already loading
  if (categoriesPromise) {
    return categoriesPromise;
  }

  // Load categories from server
  categoriesPromise = axios
    .get(`${URL}/categories`)
    .then((response) => {
      if (response.data.success) {
        categoriesCache = { categories: response.data.categories || [] };
        return categoriesCache;
      }
      throw new Error("Failed to load categories");
    })
    .catch((error) => {
      categoriesPromise = null; // Reset promise on error
      return { categories: [] }; // Return empty array on error
    });

  return categoriesPromise;
}

// Export function to get categories synchronously (returns cached data or empty)
export function getCategories() {
  return categoriesCache || { categories: [] };
}

