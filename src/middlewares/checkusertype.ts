import {Request , Response , NextFunction } from "express";

import jwt from "jsonwebtoken"
import { readConnection } from "../config/db";

const checkusertype =async (req : Request, res : Response , next : NextFunction) =>{
    const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
            const [key, value] = cookie.split("=").map(c => c.trim());
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);
        const specificCookie = cookies["cookie"];
        jwt.verify(specificCookie, 'my_token_key',async function(err, decoded) {
            const idfortoken = decoded;
            const userdata = await readConnection.select("SELECT * FROM user_details WHERE id = ?", [idfortoken])
            if (userdata[0].type == "admin") {
                next();
            } else {
               res.send("you have not authorized")
            }
            next()
          });
       
    } else {
        res.send("No cookies found");
    }
}

export default checkusertype