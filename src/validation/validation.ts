import { check , body , validationResult } from "express-validator";

 const validationschema = [
    body("user_name").trim().isLength({min : 5}).isLength({max :15}),
    body('Email').isEmail(),
    body('password')
        .trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^[a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]+$/).withMessage('Password must contain only alphanumeric and special characters'),
    body("type")
    .isIn(['admin', 'user', 'guest'])
    .withMessage('type must be admin | user | guest'),
]
export default validationschema











// const generic_IdsVaild = (generic_Ids: any) => {
//     console.log(generic_Ids)
//     if (generic_Ids.length > 0) {
//         let key = 0
//         while (key < generic_Ids.length) {
//             let value = generic_Ids[key]
//             console.log("value-->", value)
//             if (!value.hasOwnProperty('generic_Id')) {
//                 throw new Error('generic Id key is missing position of ' + key);
//             }
//             if (value['generic_Id'] && value['generic_Id'].trim() != "") {
//                 let letter = false;
//                 let number = false;
//                 for (const char of value['generic_Id']) {
//                     if (!/[A-Za-z]/.test(char)) { letter = true }
//                     if (!/[0-9]/.test(char)) { number = true }
//                     if (letter && number) {
//                         return true
//                     }
//                 }
//             } else {
//                 throw new Error('generic Id is Not Empty postion of ' + key);
//             } key++
//         }
//     } else {
//         return true
//     }
// };

// exports.addGenericMedicine = () => {
//     return [
//         check('medicine_type_Id')
//             .trim()
//             .notEmpty()
//             .withMessage('Medicine Type Id is required')
//             .custom((val) => { let letter = false; let number = false; for (const char of val) { if (!/[A-Za-z]/.test(char)) { letter = true } if (!/[0-9]/.test(char)) { number = true } if (letter && number) { return true } } })
//             .withMessage('Medicine Type Id have only alpha numeric characters')
//             .escape(),

//         check('name')
//             .trim()
//             .notEmpty()
//             .withMessage('name is required')
//             .escape(),

//         check('generic_Ids').custom(generic_IdsVaild),
//     ]
// }

