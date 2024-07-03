import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";

interface Result {
    id: String;
    username: String;
    salary: Number;
}
class MaxandMinSalary {
    public async maxandminsalary(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            let query = `SELECT 
                            ed.emp_id,
                            ed.user_name,
                            ed.email,
                            ed.address,
                            ed.create_dt,
                            ed.mobile_no,
                            ed.phone_code,
                            ed.country_code,
                            ed.state,
                            ed.city,
                            ed.employe_type,
                            es.salary
                        FROM 
                         tbl_employe_details ed
                        JOIN 
                            tbl_employe_salary es ON ed.emp_id = es.emp_id
                        WHERE 
                            es.salary = (SELECT MAX(salary) FROM tbl_employe_salary)
                        UNION
                        SELECT 
                            ed.emp_id,
                            ed.user_name,
                            ed.email,
                            ed.address,
                            ed.create_dt,
                            ed.mobile_no,
                            ed.phone_code,
                            ed.country_code,
                            ed.state,
                            ed.city,
                            ed.employe_type,
                            es.salary
                        FROM 
                            tbl_employe_details ed
                        JOIN 
                            tbl_employe_salary es ON ed.emp_id = es.emp_id
                        WHERE 
                            es.salary = (SELECT MIN(salary) FROM tbl_employe_salary);`
            const data = await readConnection.select(query, [])
            const salaryData: Result[] = [];
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                salaryData.push({
                    id: row.emp_id,
                    username: row.user_name,
                    salary: row.salary
                });
            }
            res.send(salaryData)
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).send("Internal Server Error");
        }
    }
}
export const maxandminsalary = new MaxandMinSalary();