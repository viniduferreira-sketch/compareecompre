import { queryOptions } from "@tanstack/react-query";
import { getHomeBlogPromotions, getProductBlogPromotions } from "./blog-promotions.functions";

export const homeBlogPromotionsQuery = () => queryOptions({
  queryKey: ["blog-promotions", "home"],
  queryFn: () => getHomeBlogPromotions(),
  staleTime: 5 * 60 * 1000,
});

export const productBlogPromotionsQuery = (categoryName: string | null) => queryOptions({
  queryKey: ["blog-promotions", "product", categoryName],
  queryFn: () => getProductBlogPromotions({ data: { categoryName } }),
  staleTime: 5 * 60 * 1000,
});
