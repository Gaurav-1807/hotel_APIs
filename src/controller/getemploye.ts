import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";

class EmployeDetails{
    public async employedetails(req : Request , res : Response, next : NextFunction) : Promise<any> {
        const employedata = await readConnection.select("select * from tbl_employe_details",[])
        res.send(employedata)
    }   
}
export const employedetails = new EmployeDetails();