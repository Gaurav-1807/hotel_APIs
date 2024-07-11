import { Request, Response, NextFunction } from "express";
import { readConnection } from "../config/db";
import bcrypt = require('bcrypt');
import generatetoken from '../middlewares/createtoken';
import { transporter } from '../helper/mail';
import { validationResult } from "express-validator";
const salt = 5

class CreateUser{
    public async createUser(req : Request , res : Response, next : NextFunction) : Promise<any> {
        const errors = validationResult(req);
        if (!errors.isEmpty()){return res.status(404).json({ message: errors.array() })}``
    
        const { user_name, Email, password, type } = req.body;
        try {
            if (type === "admin") {
                const email = await readConnection.select("SELECT * FROM adminuser_req_details WHERE Email = ?", [Email]) || await readConnection.select("SELECT * FROM user_details WHERE Email = ?", [Email])
                console.log(email)
                if (email.length == 0) {
                    const mailoption = {
                        from: Email,
                        to: "gauravambaliya77@gmail.com",
                        subject: "for authenticate admin",
                        html: `<h2>the user ${Email} want's to signup as a admin in your web . You want to gave them permission ?</h2> <a href=http://localhost:8080/authenticated>YES</a> <a href=http://localhost:8080/user/verify>NO</a>`
                    }
                    transporter.sendMail(mailoption, (err, info) => {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            bcrypt.hash(password, salt, async (err, hash) => {
                                const result = await readConnection.select("INSERT INTO adminuser_req_details (user_name, Email, password, type) VALUES (?, ?, ?, ?)", [user_name, Email, hash, "guest"]);
                                const createuserdata = await readConnection.select("SELECT * FROM adminuser_req_details WHERE Email = ?", [Email])
    
                                res.status(200).cookie("auth_req", createuserdata[0].req_id).send("successfully send a mail to mainadmin , wait for response !")
                                return;
                            })
                        }
                    })
                }
                else {
                    res.send("user already registred")
                }
            }
            else {
                const exituser = await readConnection.select("SELECT * FROM user_details WHERE Email = ?", [Email]);
                if (exituser.length == 0) {
                    bcrypt.hash(password, salt, async (err, hash) => {
                        const result = await readConnection.select("INSERT INTO user_details (user_name, Email, password, type) VALUES (?, ?, ?, ?)", [user_name, Email, hash, type]);
                        const data = await readConnection.select("SELECT * FROM user_details WHERE Email = ?", [Email])
                        // const idfortoken = data[0].id
                        const token = generatetoken(data[0].id)
                        console.log(token)
                        res.cookie("cookie", token).send({ message: "User created successfully", "token": token })
                    })
                }
                else {
                    res.send("user already exists")
                }
            }
    
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).send("Internal Server Error");
        }
    }
}
export const createUser = new CreateUser();

// public function check_login()
//     {
//         logto_debuglog("API - check_login");
//         $keys = array("password", "email");
//         $data = check_api_keys($keys, $this->mydata);
      
//         $validation = array(
//             "email"    => array(
//                 "rule"  => "trim|required",
//                 "value" => $data["email"],
//             ),
//             "password" => array(
//                 "rule"  => "trim|required",
//                 "value" => $data["password"],
//             ),
//         );
//         $this->check_validation($validation);
//         $auth   = $this->input->request_headers(); //get request data
        
//         // echo json_encode($auth,true); 
//        // exit;
//         $resp = $this->ds->new_check_login($data,$                       );
      
//         if (empty($resp)) {
//             logto_debuglog(" API - fail login ");
//             $err["password"] = "Your password is incorrect.";
//             respond_error_to_api("validation false", $err);
//         } else {
//             if(isset($auth['is_mobile']) && $auth['is_mobile'] == true)
//             {
//                 $resp['auth_token'] = $this->ds->set_mobile_auth($resp["doctor_Id"],$auth,"doctor");
//             }else
//             {
//                 $secretkey = time() . encodes($resp["doctor_Id"]);
//                 $payload   = array(
//                     "author" => encodes($resp["doctor_Id"]),
//                     "type"   => "doctor",
//                     "exp"    => date('Y-m-d H:i:s', time() + 24 * 60 * 60),
//                 );
//                 $payload        = json_encode($payload);
//                 $jwt            = JWT::encode($payload, $secretkey);
//                 $tmp["jwt"]     = $jwt;
//                 $tmp["jwt_key"] = $secretkey;
//                 if (startsWith($_SERVER['HTTP_HOST'], "172.16.16") == 1) {
//                     // header("Set-Cookie: ".COOKIE_DOCTOR."=" . encodes(json_encode($tmp)) . "; expires=" . (time() + (60 * 60 * 24)) . "; path=/; domain=.healcard.com; HttpOnly");
//                     if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')) {
//                         setcookie(COOKIE_DOCTOR, encodes(json_encode($tmp)), (time() + (60 * 60 * 24)), "/", ".healcard.com", 1, true);
//                     } else {
//                         setcookie(COOKIE_DOCTOR, encodes(json_encode($tmp)), (time() + (60 * 60 * 24)), "/", ".healcard.com", 0, true);
//                     }
//                 } else {
//                     // header("Set-Cookie: ".COOKIE_DOCTOR."=" . encodes(json_encode($tmp)) . "; expires=" . (time() + (60 * 60 * 24)) . "; path=/; domain=.healcard.com; HttpOnly;1");
//                     if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')) {
//                         setcookie(COOKIE_DOCTOR, encodes(json_encode($tmp)), (time() + (60 * 60 * 24)), "/", ".healcard.com", 1, true);
//                     } else {
//                         setcookie(COOKIE_DOCTOR, encodes(json_encode($tmp)), (time() + (60 * 60 * 24)), "/", ".healcard.com", 0, true);
//                     }
//                 }
//             }
//             $d                       = $resp;
//             $d["avg_review"]        = $this->ds->get_avg_review($resp["doctor_Id"]);
//             // $d["langauge_Id"]        = $this->ds->get_doctor_language($resp["doctor_Id"]);
//             $d["doctor_speciality"]  = $this->ds->get_doctor_speciality($resp["doctor_Id"]);
//             $speflag = $this->ds->get_doctor_speciality_flag(decodes($d["doctor_speciality"][0]['doctor_speciality_Id']));
//             $d["doctor_speciality"][0]["is_surgical"] = $speflag['is_surgical'];
//             $d["doctor_speciality"][0]["is_medical"] = $speflag['is_medical'];
           
//             $clinic             = $this->ds->get_clinic_doctor($resp["doctor_Id"]);
//             $d["clinic_count"]  = sizeof($clinic); 
//             //$d["Authorization"]      = $this->ds->set_auth($resp["doctor_Id"]);
//             $d["doctor_Id"] = encodes($resp["doctor_Id"]);

//             respond_success_to_api("success", $d);
//             logto_debuglog("check doctor login", $resp["doctor_Id"]);
//             unset($resp);
//             unset($d);
//         }
//         $this->resp_data($res);
//     }