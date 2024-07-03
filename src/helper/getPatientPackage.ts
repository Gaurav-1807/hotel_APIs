import dotenv from 'dotenv';
import { readConnection } from '../config/db';
dotenv.config();




// getPatientPackage function ====
interface PatientPackageData {
    clinic_Id: string;
    patient_Id: string;
    from_date?: string;
    to_date?: string;
    offset?: number;
    is_package?: string;
}

interface PatientPackage {
    clinic_package_Id: string;
    package_date: string;
    package: string;
    package_visit: number;
    package_expiry_date: string;
    patient_visits: number;
    package_status: string;
}


export const getPatientPackage = async (data: PatientPackageData, from_index: number = 0): Promise<PatientPackage[]> => {
    let query = `
      SELECT
        cp.clinic_package_Id,
        DATE_FORMAT(cp.package_date, '%Y-%m-%dT%TZ') as package_date,
        ds.doctor_service as package,
        cp.total_visit as package_visit,
        cp.expiry_date as package_expiry_date,
        COUNT(cpd.clinic_package_detail_Id) as patient_visits,
        (
          CASE
            WHEN (cp.total_visit = 0 AND cp.expiry_date IS NULL) THEN 'ACTIVE'
            WHEN (COUNT(cpd.clinic_package_detail_Id) < cp.total_visit AND (cp.expiry_date >= CURDATE() OR cp.expiry_date IS NULL)) THEN 'ACTIVE'
            WHEN (cp.total_visit != 0 AND COUNT(cpd.clinic_package_detail_Id) = cp.total_visit) THEN 'COMPLETED'
            WHEN (COUNT(cpd.clinic_package_detail_Id) < cp.total_visit AND cp.total_visit != 0 AND CURDATE() > cp.expiry_date) THEN 'EXPIRED'
            ELSE 'ACTIVE'
          END
        ) AS package_status
      FROM tbl_clinic_package cp
      LEFT JOIN tbl_clinic_package_detail cpd ON cpd.clinic_package_Id = cp.clinic_package_Id AND cpd.is_active = 1 AND cpd.is_deleted = 0
      LEFT JOIN doctor_service_mst ds ON ds.doctor_service_Id = cp.service_Id
      WHERE cp.clinic_Id = ?
        AND cp.patient_Id = ?
        AND cp.is_active = 1
        AND cp.is_deleted = 0
    `;

    const params: (string | number)[] = [data.clinic_Id, data.patient_Id];

    if (data.from_date && data.to_date) {
        query += ' AND DATE(cp.package_date) BETWEEN ? AND ?';
        params.push(data.from_date, data.to_date);
    }

    query += ' GROUP BY cp.clinic_package_Id';

    if (data.is_package) {
        query += ' HAVING package_status = ?';
        params.push(data.is_package);
    }

    query += ' ORDER BY cp.package_date DESC';

    const offset = data.offset;
    if (offset !== undefined) {
        query += ' LIMIT ? OFFSET ?';
        params.push(offset, from_index < 0 ? 0 : from_index);
    }

    const [results] = await readConnection.select(query, params);

    // console.log('getPatientPackage query results:', results);

    return results;
};