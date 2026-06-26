import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges Tailwind utility classes.
 * Useful for building reusable dynamic components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
