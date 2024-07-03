import { body, ValidationChain } from 'express-validator';

export const frontDeskPatientListValidator: ValidationChain[] = [
    body('q')
        .trim()
        .custom(value => {
            if (!/^[a-zA-Z\s]*$/.test(value)) {
                throw new Error('Invalid value for q');
            }
            return true;
        })
        .optional(),
    body('sort_by')
        .trim()
        .escape()
        .optional(),
    body('sort_by_direction')
        .trim()
        .isIn(['DESC', 'ASC'])
        .optional(),
    body('page_no')
        .trim()
        .isInt({ min: 1 })
        .withMessage('page_no must be a positive integer')
        .toInt(),  
    body('limit')
        .trim()
        .isInt({ min: 1 })
        .withMessage('offset must be a positive integer')
        .optional()
        .toInt(),  // Convert to integer
];
