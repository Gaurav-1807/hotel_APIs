import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";
import  jwt  from "jsonwebtoken";
class UserDetails{
    public async userdetails(req : Request , res : Response, next : NextFunction) : Promise<any> {
        const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.split("=").map(c => c.trim());
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);

        const specificCookie = cookies["cookie"];
        let decode = jwt.verify(specificCookie, "my_token_key") as { data: { idfortoken: number }, iat: number, exp: number };
        const idfortoken = decode.data.idfortoken;

        const userdata = await readConnection.select("SELECT * FROM user_details WHERE id = ?", [idfortoken])
        res.send(userdata)
        if (specificCookie) {
            console.log(specificCookie);
        } else {
            console.log("Specific cookie not found");
        }
    } else {
        console.log("No cookies found");
    }
    }
}
export const userdetails = new UserDetails();