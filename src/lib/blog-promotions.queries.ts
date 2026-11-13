import { queryOptions } from "@tanstack/react-query";
import { getHomeBlogPromotions, getProductBlogPromotions } from "./blog-promotions.functions";

export const homeBlogPromotionsQuery = () => queryOptions({
  queryKey: ["blog-promotions", "home"],
  queryFn: () => getHomeBlogPromotions(),
  staleTime: 5 * 60 * 1000,
});

export const productBlogPromotionsQuery = (categoryName: string | null, title = '') => queryOptions({
  queryKey: ["blog-promotions", "product", categoryName, title],
  queryFn: () => getProductBlogPromotions({ data: { categoryName, title } }),
  staleTime: 5 * 60 * 1000,
});
