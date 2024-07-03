// Middleware to fetch data and set clinic_doctor_Id
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const getData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const cookieHeader = req.headers.cookie;

        if (cookieHeader) {
            const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
                const [key, value] = cookie.split("=").map(c => c.trim());
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            const specificCookie = cookies["cookie"];

            if (specificCookie) {
                jwt.verify(specificCookie, 'my_token_key', async function (err, decoded) {
                    if (err) {
                        return res.status(401).send("Invalid token");
                    }
                    req.body.clinic_doctor_Id = 218; 
                    req.body.doctor_Id = 184; 
                    next();
                });
            } else {
                 res.status(400).send("Specific cookie not found");
            }
        } else {
             res.status(400).send("No cookies found");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
         res.status(500).send("Internal Server Error: " + error);
    }
};

export default getData;
