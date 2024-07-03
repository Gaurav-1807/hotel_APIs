import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";
import fs from 'fs';
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken"
class AddProducts{
    public async addproducts(req : Request , res : Response, next : NextFunction) : Promise<any> {
        try {
            const errors = validationResult(req.body);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: errors.array() });
            }
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                return res.status(401).json({ error: 'No cookie found' });
            }
            const cookieValue = cookieHeader.split('=')[1];
            jwt.verify(cookieValue, 'my_token_key', async (err, decoded: any) => {
                if (err) {
                    return res.status(401).json({ error: 'Invalid token' });
                }
                const { product_name, addby } = req.body;
                try {
                    const user = await readConnection.select("SELECT * FROM user_details WHERE id = ?", [decoded]);
                    if (user.length === 0) {
                        return res.status(400).send({ error: 'Invalid u_id, does not exist in user_details' });
                    }
                    const filePath = req.file?.path;
                    if (!filePath) {
                        return res.status(400).send({ error: 'Image file not found' });
                    }
                    const query = "INSERT INTO product_details (product_name, addby, u_id, image) VALUES (?, ?, ?, ?)";
                    await readConnection.select(query, [product_name, addby, decoded, filePath]);
                    return res.status(200).send({ message: 'Product added successfully' });
                } catch (dbError) {
                    if (req.file) {
                        fs.unlink(req.file.path, (err) => {
                            if (err) console.error("Error deleting the file:", err);
                        });
                    }
                    return res.status(500).send({ error: 'Error inserting product into database', err: dbError });
                }
            });
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }
}
export const addproducts = new AddProducts();