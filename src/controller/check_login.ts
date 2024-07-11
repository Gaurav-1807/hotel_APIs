import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken"
import { new_check_login } from "../helper/new_check_login";
interface DoctorInfo {

}
class CheckLogin {
    public async checklogin(req: Request, res: Response, next: NextFunction): Promise<any> {
        const data = req.body;
        try {
            console.log(data)
            const auth = req.headers;

            const resp = await new_check_login(data);

            if (!resp) {
                console.log("API - fail login");
                res.status(400).json({ error: "validation false", details: { password: "Your password is incorrect." } });
            } else {
                if (auth.is_mobile) {
                    let auth_token = await setMobileAuth(resp.doctor_Id, auth, "doctor");
                } else {
                    const secretKey = Date.now().toString() + encodes(resp.doctor_Id.toString());
                    const payload = {
                        author: encodes(resp.doctor_Id.toString()),
                        type: "doctor",
                        exp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                    };
                    const jwtToken = jwt.sign(payload, secretKey);
                    const tmp = { jwt: jwtToken, jwt_key: secretKey };

                    const cookieOptions = {
                        maxAge: 24 * 60 * 60 * 1000,
                        httpOnly: true,
                        domain: process.env.DOMAIN,
                        secure: req.secure
                    };
                    const COOKIE_DOCTOR: any = process.env.COOKIE_DOCTOR
                    res.cookie(COOKIE_DOCTOR, encodes(JSON.stringify(tmp)), cookieOptions);
                }

               

                res.status(200).json({ message: "success", data: resp });
                console.log("check doctor login", resp.doctor_Id);
            }


        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
export const checklogin = new CheckLogin();0