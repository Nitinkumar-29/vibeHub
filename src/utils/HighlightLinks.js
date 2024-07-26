export const HighLightLinks = (text) => {
  // Regex to match URLs including those that start with "www." or include domains like "vercel.app"
  const urlPattern =
    /(?:\b(?:https?:\/\/|ftp:\/\/|file:\/\/|www\.)\S+|\b\S+\.[a-z]{2,})(?=\b|$)/gi;

  return text.replace(urlPattern, (url) => {
    // Ensure URLs are prefixed with 'http://' if they don't already include 'http', 'https', or 'ftp'
    const formattedUrl =
      !/^https?:\/\//i.test(url) &&
      !/^ftp:\/\//i.test(url) &&
      !/^file:\/\//i.test(url) &&
      !/^www\./i.test(url)
        ? `http://${url}`
        : url;

    // Skip converting if the URL contains only punctuation characters (e.g., "hello.....")
    if (/^[\W_]+$/.test(url)) {
      return url;
    }

    return `<a href="${formattedUrl}" target="_blank" class="text-blue-300">${url}</a>`;
  });
};
