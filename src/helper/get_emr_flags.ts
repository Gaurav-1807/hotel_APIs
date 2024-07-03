import { readConnection } from "../config/db";

interface EmrFlags {
  is_discharge_card: number;
  is_medical_certificate: number;
  is_death_certificate: number;
  is_mediclaim: number;
  is_emr_refer: number;
  is_mlc: number;
}

export const get_Emr_Flags = async (emrId: number): Promise<EmrFlags> => {
  try {
    const query = `
      SELECT
        CASE WHEN count(dc.discharge_certificate_Id) > 0 THEN 1 ELSE 0 END as is_discharge_card,
        CASE WHEN count(mc.medical_certificate_Id) > 0 THEN 1 ELSE 0 END as is_medical_certificate,
        CASE WHEN count(pd.patient_death_Id) > 0 THEN 1 ELSE 0 END as is_death_certificate,
        e.is_mediclaim as is_mediclaim,
        CASE WHEN (count(rp.patient_refer_Id) > 0 OR count(orp.emr_other_refer_Id) > 0) THEN 1 ELSE 0 END as is_emr_refer,
        e.is_mlc as is_mlc
      FROM
        tbl_emr e
      LEFT JOIN
        tbl_discharge_certificate dc ON dc.emr_Id = e.emr_Id AND dc.is_active = 1 AND dc.is_deleted = 0
      LEFT JOIN
        tbl_medical_certificate mc ON mc.emr_Id = e.emr_Id AND mc.is_active = 1 AND mc.is_deleted = 0
      LEFT JOIN
        tbl_patient_death pd ON pd.emr_Id = e.emr_Id AND pd.is_active = 1 AND pd.is_deleted = 0
      LEFT JOIN
        tbl_refer_patient rp ON rp.to_emr_Id = e.emr_Id AND rp.is_active = 1 AND rp.is_deleted = 0
      LEFT JOIN
        tbl_emr_other_refer orp ON orp.emr_Id = e.emr_Id AND orp.is_active = 1 AND orp.is_deleted = 0
      WHERE
        e.emr_Id = ?
      GROUP BY
        e.is_mediclaim, e.is_mlc;`;

    const  rows  = await readConnection.select(query, [emrId]);
    // console.log(rows);
    if (rows.length == 0) {
      throw new Error(`No EMR flags found for emr_Id ${emrId}`);
    }
    
    const result: EmrFlags = rows[0];
    // console.log("getEmrFlags --->>>>",result);
    return result;
  } catch (error) {
    console.error('Error retrieving EMR flags:', error);
    throw error;
  }
};
