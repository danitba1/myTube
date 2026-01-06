export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  viewCount?: string;
  likeCount?: string;
  duration?: string;
}

// Helper function to format view count
export function formatViewCount(count: string | undefined): string {
  if (!count) return "0 צפיות";
  
  const num = parseInt(count, 10);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M צפיות`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K צפיות`;
  }
  return `${num} צפיות`;
}

// Helper function to format like count
export function formatLikeCount(count: string | undefined): string {
  if (!count) return "0";
  
  const num = parseInt(count, 10);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return count;
}

// Helper function to format relative time in Hebrew
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "לפני פחות מדקה";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `לפני ${diffInMinutes} דקות`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `לפני ${diffInHours} שעות`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `לפני ${diffInDays} ימים`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `לפני ${diffInWeeks} שבועות`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `לפני ${diffInMonths} חודשים`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `לפני ${diffInYears} שנים`;
}

// Helper to parse ISO 8601 duration to readable format
export function formatDuration(duration: string | undefined): string {
  if (!duration) return "";
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

