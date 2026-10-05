import { body,validationResult } from "express-validator"

export const validateRegister = [
    body("name")
    .notEmpty()
    .withMessage("Name is required"),

    body("email")
    .isEmail()
    .withMessage("Email should valid"),

    body("password")
    .isLength({min:6})
    .withMessage("Password require 6 character"),
(req, res, next)=>{

    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.json({success:false, message:error.array()})

    }    
    next()
}
]