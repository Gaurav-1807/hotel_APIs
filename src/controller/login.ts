import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";
import bcrypt = require('bcrypt');
import generatetoken from '../middlewares/createtoken';
class LoginUser{
    public async loginuser(req : Request , res : Response, next : NextFunction) : Promise<any> {
        try {
            console.log(req.body);
            const { Email, password } = req.body
            const data = await readConnection.select("select * from user_details WHERE Email = ?", [Email])
            if (!data) {
                res.status(400).send("Email not found");
            }
            bcrypt.compare(password, data[0].password, (err, result) => {
                if (err) {
                    res.status(500).send(err.message);
                    return;
                }
                if (result) {
                    const token = generatetoken(data[0].id)
                    console.log(token)
                    res.status(200).cookie("cookie", token).send({ mesage: data, token: token });
                }
                else {
                    res.status(400).send("Password not incorrect");
                }
            })
        }
        catch (error) {
            res.status(500).send("Internal Server Error");
        }
    }
}
export const loginuser = new LoginUser();