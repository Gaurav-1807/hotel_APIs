import { check, body, validationResult } from "express-validator"
export const validationforproduct = [
    body("product_name").isLength({ min: 1, max: 55 }).withMessage('Product name must be between 1 and 55 characters'),
    body("addby").isLength({ min: 5, max: 15 }).withMessage('Added by must be between 5 and 15 characters'),
];