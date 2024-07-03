import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";
import bcrypt from 'bcrypt';
import generatetoken from '../middlewares/createtoken';
// import { validationResult } from "express-validator";

const saltRounds = 5;

interface Employee {
    user_name: string;
    email: string;
    password: string;
    address: string;
    mobile_no: string;
    phone_code: string;
    country_code: string;
    state: string;
    city: string;
    employe_type: string;
}

class CreateEmployee {
    public async createemployee(req: Request, res: Response, next: NextFunction): Promise<any> {
        // const errors = validationResult(req);
        // if (!errors.isEmpty())
        //     return res.status(404).json({ message: errors.array() });

        const { user_name, email, password, address, mobile_no, phone_code, country_code, state, city, employe_type }: Employee = req.body;
        if (!password) {
            return res.status(400).send({ message: "Password is required" });
        }
        try {
            const existingUser = await readConnection.select("SELECT * FROM tbl_employe_details WHERE email = ?", [email]);
            if (existingUser.length == 0) {
                bcrypt.hash(password, saltRounds, async (err, hash) => {
                    if (err) {
                        console.error("Error hashing password:", err);
                        return res.status(500).send("Internal Server Error");
                    }
                    const result = await readConnection.select(
                        "INSERT INTO tbl_employe_details (user_name, email, password, address, mobile_no, phone_code, country_code, state, city, employe_type) VALUES (?,?,?,?,?,?,?,?,?,?)",
                        [user_name, email, hash, address, mobile_no, phone_code, country_code, state, city, employe_type]
                    );
                    const userData = await readConnection.select("SELECT * FROM tbl_employe_details WHERE email = ?", [email]);
                    const token = generatetoken(userData[0].id);
                    res.cookie("emp_id", token).send({ message: "User created successfully", token });
                });
            } else {
                res.status(409).send("User already exists");
            }
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).send("Internal Server Error");
        }
    }
}

export const createemployee = new CreateEmployee();
