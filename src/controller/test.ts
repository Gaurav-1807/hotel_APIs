import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
// import getDeathCertificates from './getdeathcertificate'; // Adjust import path as necessary
import { readConnection } from '../config/db';

// Define CustomRequest interface to include user information
interface CustomRequest extends Request {
    user: {
        SID: number;
        GID: number;
        clinic_Id: number;
    };
}

interface ClinicPatientDeathReportData {
    q?: string;
    page: number;
    from_date?: string;
    to_date?: string;
    offset: number;
    clinic_doctor_Id?: number;
    doctor_Id?: number;
    clinic_Id?: number;
}

export const validateClinicPatientDeathReport = [
    body('q').optional().isString(),
    body('page').notEmpty().isNumeric(),
    body('from_date').optional().isString(),
    body('to_date').optional().isString(),
    body('offset').optional().isNumeric()
];

export async function getClinicPatientDeathReport(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const { page, from_date, to_date, offset, clinic_doctor_Id, doctor_Id }: ClinicPatientDeathReportData = req.body;
    console.log("req.boy --->",req.body);
    const {q} = req.params;
    const data: ClinicPatientDeathReportData = { q , page, from_date, to_date, offset, clinic_doctor_Id, doctor_Id };
    console.log("data --->",data);
    const customReq = req as CustomRequest;
    data.clinic_Id = 105;
    try {
        console.log(data.clinic_Id)
        if (!data.clinic_Id) {
            return res.status(400).json({ error: 'Clinic ID is required' });
        }    
        const pageNumber = data.page;
        const fromIndex = (pageNumber - 1) * data.offset;
        const respData = await getDeathCertificates(data, fromIndex);
        const totalRecord = respData.length;
        const totalPages = data.offset ? Math.ceil(totalRecord / data.offset) : 0;
        const responseData = {
            total_record: totalRecord,
            total_pages: totalPages,
            page_no: pageNumber,
            offset: data.offset,
            result_count: respData.length,
            record: respData
        };
        console.log(responseData)
        res.status(200).json({
            status: 'success',
            data: responseData
        });
     
    } catch (error) {
        console.error('Error retrieving death certificates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

interface DeathCertificateData {
    id: number;
    name: string;
}


async function getDeathCertificates(
    data: ClinicPatientDeathReportData,
    from_index: number = 0,
    order_by: string = "dc.created_on",
    order_by_dir: string = "DESC"
): Promise<DeathCertificateData[]> {
    try {
        console.log("at getdata --->",data);
        if (!data.clinic_Id) {
            throw new Error('Clinic ID is required');
        }

        let query = `
        SELECT e.emr_Id, dc.patient_death_Id, e.emr_number, p.healcard_number, 
            CONCAT(p.fname, IF(p.mname IS NULL OR p.mname = '', '', CONCAT(' ', p.mname)), ' ', p.lname) AS patient_name,
            IF(p.patient_img = '', '', CONCAT(' ', p.patient_img)) AS patient_img,
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
            // values.push(qParam, qParam, qParam, qParam);
            values.push(qParam , qParam, qParam , qParam)
        }
        console.log("before ofset",values)
        query += `
        GROUP BY e.emr_Id
        ORDER BY ${order_by} ${order_by_dir}
        `;

        if (data.offset) {
            query += ` LIMIT ? OFFSET ?`;
            values.push(data.offset, from_index < 0 ? 0 : from_index);
           
        }
        console.log("offset -->",data.offset, from_index < 0 ? 0 : from_index)
        try {
            console.log("after offset",values)
            const  rows = await readConnection.select(query, values);
           console.log(rows)
            if (!rows) {
                console.log('No data returned from query.');
                throw new Error('No data returned from query.');
            }
    
            const deathCertificates: DeathCertificateData[] = rows.map((row: any) => ({
                id: row.emr_Id,
                name: row.patient_name
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

export default getClinicPatientDeathReport;

