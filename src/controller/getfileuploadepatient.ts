


import dotenv from 'dotenv';
import { readConnection } from '../config/db';
dotenv.config();

interface NextVisitCard {
    next_visit_date: string;
    reminder_description: string;
    emr_detail_Id: string;
}

class EmrService {
    public static readonly CARDDATA: Record<number, string> = {
        3: "PatientBill",
        4: "ReferClinic",
        5: "LabReport",
        6: "Medicine",
        7: "VitalSign",
        9: "RoomAssign",
        10: "NextVisit",
        11: "Vaccine",
        12: "Attachment",
        16: "Note",
        15: "Files",
        17: "DoctorPrescription",
    };
    public static readonly NEXTVISITREMINDER_CARD_CATEGORY: number = 10;

    public static async getFileuploadedCards(emrId: string): Promise<NextVisitCard[]> {

        const MYSQL_ENCRYPTION_KEY = process.env.MYSQL_ENCRYPTION_KEY;
        let query = 'select tpec.pin_emr_card_Id,e.emr_Id,e.emr_number,e.ipd_number,e.doctor_Id,e.clinic_doctor_Id,e.patient_Id,(CASE WHEN (e.state = 1) THEN "Start" WHEN (e.state = 2) THEN "InProgress" WHEN (e.state=3) THEN "Completed" END) as state,JSON_EXTRACT(CONVERT(AES_DECRYPT(encripted_json_data, "' + MYSQL_ENCRYPTION_KEY + '") USING utf8),"$") as json_data,DATE_FORMAT((ed.card_date), "%Y-%m-%dT%TZ" ) as card_date,TRIM(BOTH """" FROM JSON_EXTRACT(CONVERT(AES_DECRYPT(encripted_json_data, "' + MYSQL_ENCRYPTION_KEY + '") USING utf8),"$.card_Id"))  as card_Id,TRIM(BOTH """" FROM JSON_EXTRACT(CONVERT(AES_DECRYPT(encripted_json_data, "' + MYSQL_ENCRYPTION_KEY + '") USING utf8),"$.card_category")) as card_category ,ed.card_category_Id,card.card_name, DATE_FORMAT(IFNULL(ed.created_on,e.created_on),"%Y-%m-%dT%TZ" ) as datetime, ed.doctor_Id as card_doctor_Id, ed.emr_detail_Id, card.is_static, ccm.card_category, ccm.card_logo, ccm.sort_description,ccm.sort_description as input_description, ccm.card_key,GROUP_CONCAT(DISTINCT dsm.doctor_speciality ORDER BY dsm.doctor_speciality_Id) AS doctor_speciality, GROUP_CONCAT(DISTINCT dsm.doctor_speciality_Id ORDER BY dsm.doctor_speciality_Id) AS doctor_speciality_Id, GROUP_CONCAT(DISTINCT dsm.speciality_img ORDER BY dsm.doctor_speciality_Id) AS speciality_img, tc.clinic_number, tc.clinic_img,td.doctor_number, td.email,td.mobile, td.mobile_country, cntry.phonecode, td.doctor_photo, CONCAT(IF(td.is_doctor = 0,"","Dr. "),td.fname," ",td.lname) as doctor_name, CONCAT(IF(tdd.is_doctor = 0,"","Dr. "),tdd.fname," ",tdd.lname) as owner_doctor, tdd.doctor_photo as owner_doctor_image, tdd.doctor_Id as owner_doctor_Id,ed.is_private,ed.file_url from tbl_pin_emr_card AS tpec LEFT JOIN tbl_emr_details ed ON tpec.emr_detail_Id = ed.emr_detail_Id AND ed.is_active = 1 AND ed.is_deleted = 0 AND ed.is_archived = 0 and ed.card_category_Id != ' + constant.OTHER_ATTACHMENT_CARD_CATEGORY + ' AND ed.card_category_Id != ' + constant.BILL_CARD_CATEGORY + ' LEFT JOIN tbl_emr_share AS tesm ON tesm.emr_Id = ed.emr_Id LEFT JOIN tbl_emr AS e ON e.emr_Id = ed.emr_Id AND e.is_deleted = 0 left join tbl_doctor as tdd on tdd.doctor_Id = ed.doctor_Id left join tbl_card as card on card.card_Id = TRIM(BOTH """" FROM JSON_EXTRACT(CONVERT(AES_DECRYPT(encripted_json_data, "' + process.env.ENCRYPTION_KEY + '") USING utf8),"$.card_Id")) and ed.is_deleted = 0 left join card_category_mst as ccm on ccm.card_category_Id = ed.card_category_Id left join tbl_clinic as tc on tc.clinic_Id = TRIM(BOTH """" FROM JSON_EXTRACT(CONVERT(AES_DECRYPT(encripted_json_data, "' + process.env.ENCRYPTION_KEY + '") USING utf8),"$[0].ReferClinic[0].clinic.id")) left join tbl_doctor as td on td.doctor_Id = TRIM(BOTH """" FROM JSON_EXTRACT(CONVERT(AES_DECRYPT(encripted_json_data, "' + process.env.ENCRYPTION_KEY + '") USING utf8),"$[0].ReferClinic[0].doctor.doctor_Id")) LEFT JOIN tbl_doctors_speciality AS tds ON tds.doctor_Id = td.doctor_Id AND tds.is_active = 1 AND tds.is_deleted = 0 LEFT JOIN doctor_speciality_mst AS dsm ON dsm.doctor_speciality_Id = tds.doctor_speciality_Id AND dsm.is_active = 1 AND dsm.is_deleted = 0 LEFT JOIN tbl_country AS cntry ON cntry.country_Id = td.mobile_country LEFT JOIN tbl_clinic_mobile AS tcb ON tcb.clinic_Id = TRIM( BOTH "" FROM JSON_EXTRACT( json_data,"$[0].carddata[0].clinic.id"))';


        if (is_private) {
            query += " where ed.is_private = 0 ";
        }
        if (history) {
            if (is_private) {
                query += " and e.emr_Id = " + data.emr_Id;
            } else {
                query += " where e.emr_Id = " + data.emr_Id;
            }

            if (is_billing_card_show) {
                query += " AND ed.card_category_Id != " + 3;
            } else if (only_billcard) {
                query += " AND ed.card_category_Id = " +3;
            }
            query += " GROUP BY ed.created_on";
        } else {
            query += " Where tpec.patient_Id = " + data.patient_Id + " AND tpec.clinic_Id = " + 105 + " AND tpec.is_active = 1 and tpec.is_deleted = 0";
        }

        query += " and e.is_deleted = 0";
        if (history == false) {
            query += " GROUP BY ed.emr_detail_Id HAVING ed.card_category_Id IS NOT NULL ORDER BY ed.card_date DESC";
        }
        // console.log(query)

        const results = await readConnection.select(query, [
            MYSQL_ENCRYPTION_KEY,
            MYSQL_ENCRYPTION_KEY,
            emrId,
        ]);
        // console.log('get_next_visit_cards ---->>>>', results);
        return results as NextVisitCard[];

    }
}

export { EmrService };
