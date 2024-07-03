import dotenv from 'dotenv';
import { readConnection } from '../config/db';
import { getEmrCommission } from './getEmrCommission';
dotenv.config();

// getemr function -------
interface EmrRefer {
    patient_refer_Id: string;
    clinic_refer_Id: string;
    from_note: string;
    doctor_name: string;
    clinic_name: string;
    clinic_img: string;
    doctor_photo: string;
    commission?: number;
    total_bill?: number;
}

export const getEmrRefer = async (emrId: number, db: string = '_DB2'): Promise<EmrRefer[]> => {
    const sql = `
      SELECT trp.patient_refer_Id, trp.clinic_refer_Id, trp.from_note,
        IF(trp.from_doctor_Id != '', CONCAT(IF(td.is_doctor = 0,'','Dr. '), td.fname,' ',td.lname), CONCAT('Dr. ', trp.from_doctor_name)) AS doctor_name,
        IF(trp.from_clinic_Id != '', tc.clinic_name, trp.from_clinic_name) AS clinic_name,
        IF(tc.clinic_img = '', '', CONCAT('', tc.clinic_img)) AS clinic_img,
        IF(td.doctor_photo = '', '', CONCAT('', td.doctor_photo)) AS doctor_photo
      FROM tbl_refer_patient trp
      LEFT JOIN tbl_doctor td ON td.doctor_Id = trp.from_doctor_Id
      LEFT JOIN tbl_clinic tc ON tc.clinic_Id = trp.from_clinic_Id
      WHERE trp.is_active = 1 AND trp.is_deleted = 0 AND trp.to_emr_Id = ?
    `;
    const results: EmrRefer[] = await readConnection.select(sql, [emrId]) as EmrRefer[];
    
    const clinicReferIds = results.map(res => Number(res.clinic_refer_Id));
    // console.log("result for getemrrefer ==>>>",clinicReferIds);
    if (clinicReferIds.length > 0) {
        const commission = await getEmrCommission(emrId, clinicReferIds);
        results.forEach(res => {
            const clinicCommission = commission.commissions[res.clinic_refer_Id];
            if (Array.isArray(clinicCommission)) {
                res.commission = clinicCommission.reduce((sum, value) => sum + value, 0);
            }
            res.total_bill = commission.total_bill;
        });
    }

    return results;
};
