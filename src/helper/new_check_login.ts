import dotenv from 'dotenv';
import { readConnection } from '../config/db';
dotenv.config();
const MYSQL_ENCRIPTION_KEY = process.env.MYSQL_ENCRYPTION_KEY;

interface LoginData {
    email: string;
    password: string;
}

interface DoctorInfo {
    doctor_Id: number;
    is_intro_shown: boolean;
    fname: string;
    lname: string;
    prefix: string;
    doctor_number: string;
    doctor_photo: string;
    about_doctor: string;
    email: string;
    doctor_verified: boolean;
    is_doctor_profile_complete: boolean;
    is_clinic_profile_complete: boolean;
    is_surgery_experience_complite: boolean;
    is_medical_experience_complite: boolean;
    is_doctor_service_complite: boolean;
    is_social_complite: boolean;
    is_education_complite: boolean;
    mobile: string;
    mobile_country: number;
    phonecode: string;
    created_by: number;
    gender: string;
    is_doctor: boolean;
}

export async function new_check_login(data: LoginData): Promise<DoctorInfo | null> {
    console.log(data)
    const query = `
        SELECT tbl_doctor.doctor_Id, tbl_doctor.is_intro_shown, fname, lname, 
        IF(is_doctor = 0, '', 'Dr. ') as prefix, doctor_number, doctor_photo, about_doctor, email, 
        doctor_verified, is_doctor_profile_complete, is_clinic_profile_complete, is_surgery_experience_complite, 
        is_medical_experience_complite, is_doctor_service_complite, is_social_complite, is_education_complite, 
        mobile, mobile_country, tc.phonecode, created_by, gender, is_doctor
        FROM tbl_doctor
        LEFT JOIN tbl_country as tc ON tc.country_Id = tbl_doctor.mobile_country
        WHERE (mobile = ? OR email = ?)
        AND CONVERT(AES_DECRYPT(password, ?) USING utf8) = ?
        AND tbl_doctor.is_active = 1
        AND tbl_doctor.is_deleted = 0
        AND tbl_doctor.is_claimed = 1
        AND tbl_doctor.is_visit_doctor = 0
    `;

    const [rows]: any[] = await readConnection.select(query, [
        data.email, 
        data.email, 
        MYSQL_ENCRIPTION_KEY, 
        data.password,
    ]);
    console.log(rows);
    if (rows.length > 0) {
        let res: DoctorInfo = rows;
        console.log("new_check_login Last query:", query);
        return res;
    }

    console.log("new_check_login Last query:", query);
    return null;
}


/* 
tbl_doctor.doctor_Id, tbl_doctor.is_intro_shown,fname, lname, IF(is_doctor = 0,'','Dr. ') as prefix, doctor_number, doctor_photo, about_doctor,email, doctor_verified, is_doctor_profile_complete, is_clinic_profile_complete, is_surgery_experience_complite, is_medical_experience_complite, is_doctor_service_complite, is_social_complite,is_education_complite,mobile,mobile_country,tc.phonecode, created_by,gender,is_doctor   FROM tbl_doctor
*/