import contactModel from "../model/contactModel.js";

//Creating contact Message
export const createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.json({
        success: false,
        message: "All fields are required",
      });
    }

    //Create Contact

    const contact = new contactModel({
      name,
      email,
      phone,
      message,
    });

    // Save in MongoDb

    await contact.save();

    return res.json({
      success: true,
      message: "Your message has be sent sucessfully.",
      contact,
    });
  } catch (error) {
    console.log("Error", error);

    return res.json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};
