// email verification
export const EmailVerification = async (email) => {
  if (!email) return;
  try {
    const apiURL = `https://validect-email-verification-v1.p.rapidapi.com/v1/verify?email=${email}`;

    const response = await fetch(apiURL, {
      method: "GET",
      headers: {
        "x-rapidapi-key": "6df67ca40emsh54451cad843c528p17f8b9jsn4d9fa3d544e6",
        "x-rapidapi-host": "validect-email-verification-v1.p.rapidapi.com",
      },
    });
    if (!response.ok) console.log("server error");
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
  }
};
