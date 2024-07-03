import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";
import { transporter } from "../helper/mail";
class AuthenticateUser{
    public async authenticateuser(req : Request , res : Response, next : NextFunction) : Promise<any> {
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
                console.log(data)
                if (data.length == 0) {
                    res.send("response already sent to the client")
                }
                else {
                    const mailoption = {
                        from: "gauravambaliya77@gmail.com",
                        to: data[0].Email,
                        subject: "for authenticate admin",
                        html: `<h2>the user ${data[0].Email} request for a create account as a admin was accpet by mainadmin , Thank You !</h2>`
                    }
                    transporter.sendMail(mailoption, async (err, info) => {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            const { req_id, user_name, Email, password } = data[0]
    
                            const userdata = await readConnection.select("INSERT INTO user_details (user_name, Email, password, type) VALUES (?, ?, ?, ?)", [user_name, Email, password, "admin"]) && await readConnection.select("DELETE FROM adminuser_req_details WHERE req_id = ?", [req_id])
                            res.send(`user ${data[0].Email} for admin is acccept by main admin`)
    
                        }
                    })
                }
    
            } else {
                console.log("Specific cookie not found");
            }
        } else {
            res.send("cookie not found")
        }
    }
}
export const authenticateuser = new AuthenticateUser();