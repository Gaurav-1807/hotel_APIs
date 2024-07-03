import { readConnection } from "../config/db";

interface GetFrontResentListData {
    q: string;
    doctor_Id: string;
    clinic_doctor_Id: number;
    clinic_Id: number;
    limit: number;
    page_no : number;
}

export async function getFrontResentList(
    data: GetFrontResentListData,
    count: boolean = false,
    orderBy: string = "",
    orderByDir: string = "",
    limit: number = 0
) {
    try {
        const page = data.page_no || 1;
        const offset = (page - 1) * limit;
        let query = `
            SELECT 
                GROUP_CONCAT(DATE_FORMAT(ter.assign_at, '%Y-%m-%dT%TZ') SEPARATOR '||') AS room_start_date,
                GROUP_CONCAT(IFNULL(DATE_FORMAT(ter.discharge_at, '%Y-%m-%dT%TZ'), '') SEPARATOR '||') AS room_end_date,
                GROUP_CONCAT(DISTINCT CONCAT(tcrc.room_cate_name, ', ', tcr.room_name, '-', tcrb.bed) SEPARATOR '|') AS current_ward,
                GROUP_CONCAT(DISTINCT CONCAT(tcrcw.room_cate_name, ', ', tcrw.room_name, '-', tcrbw.bed) SEPARATOR '|') AS ward,
                DATE_FORMAT(e.emr_start, '%Y-%m-%dT%TZ') AS datetime,
                tes2.share_role, e.emr_Id, e.emr_number, e.ipd_number,
                DATE_FORMAT(e.emr_start, '%Y-%m-%dT%TZ') AS emr_start,
                DATE_FORMAT(e.emr_end, '%Y-%m-%dT%TZ') AS emr_end,
                tp.fname, tp.lname, tp.mname, tp.healcard_number, tp.patient_Id,
                tp.email, tp.address, tp.city, bgm.blood_group_Id, bgm.blood_group,
                IF(tp.patient_img = '', '', CONCAT('S3PATH', '/', tp.patient_img)) AS patient_img,
                e.state AS emr_state, tp.mobile, tcn.country_name AS country, tcn.phonecode,
                tp.gender, tp.dob, ip.intervention_Id, ts.state_name AS state,
                GROUP_CONCAT(tes1.clinic_doctor_Id SEPARATOR '#||#') AS share_staff_Id,
                GROUP_CONCAT(CONCAT(IF(td.is_doctor = 0, '', 'Dr. '), td.fname, ' ', td.lname) SEPARATOR '#||#') AS doctor_name,
                IF(trp.from_doctor_name != '', CONCAT('Dr. ', trp.from_doctor_name), CONCAT(IF(tdd.is_doctor = 0, '', 'Dr. '), tdd.fname, ' ', tdd.lname)) AS refer_doctor,
                trp.patient_refer_Id,
                IF(tps.expire_date IS NULL OR (CURDATE() > DATE(tps.expire_date)), 1, 0) AS is_expired,
                tps.expire_date
            FROM tbl_clinic_doctors AS cd
            JOIN tbl_emr AS e ON cd.clinic_doctor_Id = e.clinic_doctor_Id
            LEFT JOIN tbl_refer_patient AS trp ON trp.to_emr_Id = e.emr_Id AND trp.is_deleted = 0 AND trp.is_active = 1
            LEFT JOIN tbl_doctor AS tdd ON tdd.doctor_Id = trp.from_doctor_Id
            LEFT JOIN tbl_intervention_procedure AS ip ON ip.emr_Id = e.emr_Id
            LEFT JOIN tbl_emr_rooms AS ter ON ter.emr_Id = e.emr_Id AND ter.is_active = 1 AND ter.is_deleted = 0
            LEFT JOIN tbl_clinic_room AS tcrw ON tcrw.room_Id = ter.room_Id
            LEFT JOIN tbl_clinic_room_category AS tcrcw ON tcrcw.room_category_Id = ter.room_category_Id
            LEFT JOIN tbl_clinic_room_bed AS tcrbw ON tcrbw.room_bed_Id = ter.room_bed_Id
            LEFT JOIN tbl_emr_rooms AS er ON er.emr_Id = e.emr_Id AND er.is_occupied = 1 AND er.is_active = 1 AND er.is_deleted = 0
            LEFT JOIN tbl_clinic_room AS tcr ON tcr.room_Id = er.room_Id
            LEFT JOIN tbl_clinic_room_category AS tcrc ON tcrc.room_category_Id = er.room_category_Id
            LEFT JOIN tbl_clinic_room_bed AS tcrb ON tcrb.room_bed_Id = er.room_bed_Id
            LEFT JOIN tbl_emr_share AS tes ON tes.emr_Id = e.emr_Id
            LEFT JOIN tbl_emr_share AS tes2 ON tes2.emr_Id = e.emr_Id AND tes2.clinic_doctor_Id = ?
            LEFT JOIN tbl_emr_share AS tes1 ON tes1.emr_Id = tes.emr_Id AND tes1.is_primary = 1
            LEFT JOIN tbl_clinic_doctors AS tcd ON tcd.clinic_doctor_Id = tes1.clinic_doctor_Id
            LEFT JOIN tbl_doctor AS td ON td.doctor_Id = tcd.doctor_Id
            LEFT JOIN tbl_patient AS tp ON tp.patient_Id = e.patient_Id
            LEFT JOIN (SELECT patient_Id, MAX(expire_date) AS expire_date FROM tbl_patient_subscription WHERE is_active = 1 AND is_deleted = 0 GROUP BY patient_Id) AS tps ON tps.patient_Id = e.patient_Id
            LEFT JOIN tbl_state AS ts ON ts.state_Id = tp.state_Id
            LEFT JOIN tbl_city AS tct ON tct.city_Id = tp.city_Id
            LEFT JOIN blood_group_mst AS bgm ON tp.blood_group_Id = bgm.blood_group_Id
            LEFT JOIN tbl_country AS tcn ON tcn.country_Id = tp.mobile_country
            WHERE e.is_deleted = 0 AND e.state != 3
        `;

        const queryParams: any[] = [data.clinic_doctor_Id];

        if (data.q !== "") {
            query += `
                AND (
                    CONCAT(tp.fname, IF(tp.mname IS NULL, "", CONCAT(" ", tp.mname)), " ", tp.lname) LIKE ?
                    OR tp.healcard_number LIKE ?
                    OR e.emr_number LIKE ?
                    OR e.ipd_number LIKE ?
                )
            `;
            queryParams.push(`%${data.q}%`, `%${data.q}%`, `%${data.q}%`, `%${data.q}%`);
        }

        if (data.doctor_Id !== "") {
            query += ` AND tes.clinic_doctor_Id = ?`;
            queryParams.push(data.clinic_doctor_Id);
        } else {
            query += ` AND tes.clinic_doctor_Id = ? AND cd.clinic_Id = ?`;
            queryParams.push(data.clinic_doctor_Id, data.clinic_Id);
        }
        query += ` GROUP BY tp.patient_Id`;

        if (orderBy !== "") {
            query += ` ORDER BY ${orderBy} ${orderByDir}`;
        }

        if (limit > 0) {
            query += " LIMIT ? OFFSET ?";
            queryParams.push(limit, offset);
        }

        const rows = await readConnection.select(query, queryParams);
        // console.log("getFrontResentList ----->>>>>",rows );
        return rows;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
