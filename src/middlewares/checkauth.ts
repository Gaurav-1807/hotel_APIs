// Middleware to fetch data and set clinic_doctor_Id
import { Request, Response, NextFunction } from "express";

export const chechauth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        req.body.clinic_doctor_Id = 218; 
        req.body.doctor_Id = 184; 
        next();
    } catch (error) {
        console.error("Error fetching data:", error);
         res.status(500).send("Internal Server Error: " + error);
    }
};


