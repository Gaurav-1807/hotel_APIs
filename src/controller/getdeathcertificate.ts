import { readConnection } from "../config/db";

interface DeathCertificateData {
    id: number;
    name: string;
}

interface ClinicPatientDeathReportData {
    q: string;
    page: number;
    from_date?: string;
    to_date?: string;
    offset: number;
    clinic_doctor_Id?: number;
    doctor_Id?: number;
    clinic_Id?: number;
}

const data: ClinicPatientDeathReportData = {
    q: "search query",
    page: 1,
    offset: 0,
    clinic_Id: 105
};

async function getDeathCertificates(
    data: ClinicPatientDeathReportData = {
        q: "search query",
        page: 1,
        offset: 0,
        clinic_Id: 105,
        clinic_doctor_Id: 218,
        doctor_Id: 184,

    },
    from_index: number = 0,
    order_by: string = "dc.created_on",
    order_by_dir: string = "DESC"
): Promise<DeathCertificateData[]> {
    try {
        const s3path = '/your-s3-bucket';
        console.log(data)
        if (!data.clinic_Id) {
            throw new Error('Clinic ID is required');
        }

        let query = `
        SELECT e.emr_Id, dc.patient_death_Id, e.emr_number, p.healcard_number, 
            CONCAT(p.fname, IF(p.mname IS NULL OR p.mname = '', '', CONCAT(' ', p.mname)), ' ', p.lname) AS patient_name,
            IF(p.patient_img = '', '', CONCAT('${s3path}/', p.patient_img)) AS patient_img,
            DATE_FORMAT(dc.death_date_time, '%Y-%m-%dT%TZ') AS death_date_time,
            dc.death_reason, DATE_FORMAT(dc.created_on, '%Y-%m-%dT%TZ') AS created_on,
            e.ipd_number, DATE_FORMAT(e.created_on, '%Y-%m-%dT%TZ') AS doa,
            GROUP_CONCAT(CONCAT(tcrc.room_cate_name, ', ', tcr.room_name, '-', tcrb.bed) SEPARATOR '|') AS ward,
            CONCAT('+', tcn.phonecode, ' ', p.mobile) AS mobile, 
            p.gender AS gender, p.dob,
            DATE_FORMAT(ter.discharge_at, '%Y-%m-%dT%TZ') AS discharge_at,
            DATE_FORMAT(ter.assign_at, '%Y-%m-%dT%TZ') AS assign_at
        FROM (
            SELECT MAX(patient_death_Id) AS patient_death_Id, patient_Id
            FROM tbl_patient_death
            GROUP BY patient_Id
        ) dc1
        LEFT JOIN tbl_patient_death dc ON dc.patient_death_Id = dc1.patient_death_Id
        LEFT JOIN tbl_emr e ON e.emr_Id = dc.emr_Id
        LEFT JOIN tbl_clinic_doctors cd ON cd.clinic_doctor_Id = dc.clinic_doctor_Id
        LEFT JOIN tbl_patient p ON p.patient_Id = dc.patient_Id
        LEFT JOIN tbl_country tcn ON p.mobile_country = tcn.country_Id
        LEFT JOIN tbl_emr_rooms ter ON ter.emr_Id = e.emr_Id AND ter.is_active = 1 AND ter.is_deleted = 0
        LEFT JOIN tbl_clinic_room tcr ON tcr.room_Id = ter.room_Id
        LEFT JOIN tbl_clinic_room_category tcrc ON tcrc.room_category_Id = ter.room_category_Id
        LEFT JOIN tbl_clinic_room_bed tcrb ON tcrb.room_bed_Id = ter.room_bed_Id
        WHERE cd.clinic_Id = ?
        AND dc.is_deleted = 0
        AND dc.is_active = 1
        `;

        const values: (string | number)[] = [data.clinic_Id];

        if (data.from_date && data.to_date) {
            query += ` AND DATE_FORMAT(dc.created_on, '%Y-%m-%dT%TZ') BETWEEN ? AND ?`;
            values.push(data.from_date, data.to_date);
        }

        if (data.q) {
            query += `
            AND (
                p.healcard_number LIKE ?
                OR e.emr_number LIKE ?
                OR dc.death_reason LIKE ?
                OR CONCAT(p.fname, IF(p.mname IS NULL, '', CONCAT(' ', p.mname)), ' ', p.lname) LIKE ?
            )
            `;
            const qParam = `%${data.q}%`;
            values.push(qParam, qParam, qParam, qParam);
        }
        query += `
        GROUP BY e.emr_Id
        ORDER BY ${order_by} ${order_by_dir}
        `;

        if (data.offset) {
            query += ` LIMIT ? OFFSET ?`;
            values.push(data.offset, from_index < 0 ? 0 : from_index);
        }

        try {
            const [rows] = await readConnection.select(query, values);

            if (!rows) {
                console.error('No data returned from query.');
                throw new Error('No data returned from query.');
            }

            const deathCertificates: DeathCertificateData[] = rows.map((row: any) => ({
                id: row.emr_Id,
                name: row.patient_name
                // Add other fields as needed
            }));

            return deathCertificates;
        } catch (error) {
            console.error('Error fetching death certificates:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error fetching death certificates:', error);
        throw error;
    }
}

export default getDeathCertificates;
