
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict, Timestamp } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(timestamp: Timestamp | Date | undefined): string {
  if (!timestamp) return "";
  
  const date = timestamp instanceof Date ? timestamp : (timestamp as any).toDate(); // Firestore Timestamp specific
  if (!date || isNaN(date.getTime())) return "";

  return formatDistanceToNowStrict(date, { addSuffix: true });
}
