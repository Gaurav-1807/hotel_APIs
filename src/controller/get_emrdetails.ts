import { Request, Response } from "express";
import { readConnection } from "../config/db";

export async function getemrdetails(req: Request, res: Response) {
    const page = parseInt(req.body.page as string) || 1;
    const limit = parseInt(req.body.limit as string) || 10;
    const offset = (page - 1) * limit;
    try {
        const totalRecordsResult = await readConnection.select("SELECT COUNT(*) AS count FROM tbl_emr  ", []);
        const totalRecords = totalRecordsResult[0].count;
        const totalPages = Math.ceil(totalRecords / limit);
        const alldetails = await readConnection.select("SELECT * FROM tbl_emr LIMIT ? OFFSET ?", [limit, offset]);

        res.status(200).send({
            totalPages,
            totalRecords,
            resultCount: alldetails.length,
            currentPage: page,
            data: alldetails
        });
    } catch (error) {
        res.status(500).send({ "message": "Internal Server Error", "error": error });
    }
}
