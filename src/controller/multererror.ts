import { Request, Response, NextFunction } from "express";
import multer from "multer";
class MulterError{
    public async multererror(err: Error ,req : Request , res : Response, next : NextFunction) : Promise<any> {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        }
        if (err.message) {
            return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: 'An unexpected error occurred' });
    }
}
export const multererror = new MulterError();