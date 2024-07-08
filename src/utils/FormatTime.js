export const formatTime = (timestamp) => {
  const currentTime = new Date();
  let postTime;

  // Check the type of timestamp and convert it to a JavaScript Date object
  if (typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
    // Firestore timestamp with seconds and nanoseconds
    postTime = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  } else if (typeof timestamp === 'number') {
    if (timestamp.toString().length === 13) {
      // UNIX timestamp in milliseconds
      postTime = new Date(timestamp);
    } else if (timestamp.toString().length === 10) {
      // UNIX timestamp in seconds
      postTime = new Date(timestamp * 1000);
    } else {
      // Assuming it's a number representing milliseconds
      postTime = new Date(timestamp);
    }
  } else {
    // Assume it's a JavaScript Date object or ISO string
    postTime = new Date(timestamp);
  }

  const timeDifference = Math.floor((currentTime - postTime) / 1000); // in seconds

  if (timeDifference < 60) {
    return `${timeDifference} seconds ago`;
  } else if (timeDifference < 3600) {
    const minutes = Math.floor(timeDifference / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (timeDifference < 86400) {
    const hours = Math.floor(timeDifference / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (timeDifference < 7 * 86400) {
    const days = Math.floor(timeDifference / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    return postTime.toLocaleDateString("en-US", options);
  }
};
