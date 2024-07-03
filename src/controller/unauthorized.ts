import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";
import { transporter } from "../helper/mail";
class UnauthorizedUser{
    public async unauthorizeduser(req : Request , res : Response, next : NextFunction) : Promise<any> {
        const cookieHeader = req.headers.cookie;
        if (cookieHeader) {
            const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
                const [key, value] = cookie.split("=").map(c => c.trim());
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);
            const result = cookies.auth_req
            if (result) {
                const data = await readConnection.select("SELECT * FROM adminuser_req_details WHERE req_id = ?", [result])
                const mailoption = {
                    from: "gauravambaliya77@gmail.com",
                    to: data[0].Email,
                    subject: "for authenticate admin",
                    html: `<h2>the user ${data[0].Email} request for a create account as a admin was reject by mainadmin you have continue as a gauest, Thank You !</h2>`
                }
                transporter.sendMail(mailoption, async (err, info) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        res.send(`user ${data[0].Email} for admin is reject by main admin`)
                    }
                })
            } else {
                console.log("Specific cookie not found");
            }
        } else {
            res.send("cookie not found")
        }
    }
}
export const unauthorizeduser = new UnauthorizedUser();