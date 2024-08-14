import toast from "react-hot-toast";

export const handleDownload = async (selectedMedia, handleCloseModal) => {
  try {
    if (!selectedMedia) {
      throw new Error("Selected image URL is not valid.");
    }
    const response = await fetch(selectedMedia, {
      mode: "cors", // Ensure CORS mode is enabled
    });
    if (!response.ok) {
      throw new Error("Failed to fetch image.");
    }
    toast.loading("downloading...");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    // Determine the type of the media for setting the download attribute
    const mediaType = blob.type.split("/")[0]; // Extract "image" or "video"
    link.download = `downloaded-media.${mediaType === "image" ? "jpg" : "mp4"}`; // Set appropriate extension
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    handleCloseModal();
    toast.dismiss();
    toast.success("Media downloaded");
  } catch (error) {
    console.error("Error downloading the image:", error.message);
    if (error.code === "resource-exhausted") {
      console.error("Quota exceeded. Please try again later.");
    }
  }
};
