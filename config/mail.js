import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "prathiksh545@gmail.com",
    pass: "eemq cmtl gyur wujb",
  },
});

export const sendEmail = async (to, subject, text) => {
  try {
    transport.sendMail({
      from: "prathiksh545@gmail.com",
      to,
      subject,
      text,
    });
    console.log("email sent successfully");
  } catch (error) {
    console.log(error);
  }
};
