import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";
import bcrypt = require('bcrypt');
import generatetoken from '../middlewares/createtoken';
import { transporter } from '../helper/mail';
import { validationResult } from "express-validator";
const salt = 5

class CreateUser{
    public async createUser(req : Request , res : Response, next : NextFunction) : Promise<any> {
        const errors = validationResult(req);
        if (!errors.isEmpty()){return res.status(404).json({ message: errors.array() })}``
    
        const { user_name, Email, password, type } = req.body;
        try {
            if (type === "admin") {
                const email = await readConnection.select("SELECT * FROM adminuser_req_details WHERE Email = ?", [Email]) || await readConnection.select("SELECT * FROM user_details WHERE Email = ?", [Email])
                console.log(email)
                if (email.length == 0) {
                    const mailoption = {
                        from: Email,
                        to: "gauravambaliya77@gmail.com",
                        subject: "for authenticate admin",
                        html: `<h2>the user ${Email} want's to signup as a admin in your web . You want to gave them permission ?</h2> <a href=http://localhost:8080/authenticated>YES</a> <a href=http://localhost:8080/user/verify>NO</a>`
                    }
                    transporter.sendMail(mailoption, (err, info) => {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            bcrypt.hash(password, salt, async (err, hash) => {
                                const result = await readConnection.select("INSERT INTO adminuser_req_details (user_name, Email, password, type) VALUES (?, ?, ?, ?)", [user_name, Email, hash, "guest"]);
                                const createuserdata = await readConnection.select("SELECT * FROM adminuser_req_details WHERE Email = ?", [Email])
    
                                res.status(200).cookie("auth_req", createuserdata[0].req_id).send("successfully send a mail to mainadmin , wait for response !")
                                return;
                            })
                        }
                    })
                }
                else {
                    res.send("user already registred")
                }
            }
            else {
                const exituser = await readConnection.select("SELECT * FROM user_details WHERE Email = ?", [Email]);
                if (exituser.length == 0) {
                    bcrypt.hash(password, salt, async (err, hash) => {
                        const result = await readConnection.select("INSERT INTO user_details (user_name, Email, password, type) VALUES (?, ?, ?, ?)", [user_name, Email, hash, type]);
                        const data = await readConnection.select("SELECT * FROM user_details WHERE Email = ?", [Email])
                        // const idfortoken = data[0].id
                        const token = generatetoken(data[0].id)
                        console.log(token)
                        res.cookie("cookie", token).send({ message: "User created successfully", "token": token })
                    })
                }
                else {
                    res.send("user already exists")
                }
            }
    
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).send("Internal Server Error");
        }
    }
}
export const createUser = new CreateUser();





