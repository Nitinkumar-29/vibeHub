import emailjs from "emailjs-com"

export const sendFollowRequestEmail = async(data) => {
    const { to_email,to_name,from_name, } = data;
    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID
    const templateId = process.env.REACT_APP_EMAILJS_PUBLIC_KEY
    const publicKey = process.env.REACT_APP_EMAILJS_FOLLOW_REQUEST_TEMPLATE_ID

    const templateParams = {
        from_name,
        to_name,
        to_email
    }
    emailjs.send(serviceId, publicKey , templateParams, templateId)
}