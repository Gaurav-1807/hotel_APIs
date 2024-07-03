import nodemailer from "nodemailer"
export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "gauravambaliya77@gmail.com",
        pass: "pauk vizl olsa fbwz"
    }
})