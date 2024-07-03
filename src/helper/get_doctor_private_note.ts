import { readConnection } from "../config/db";


interface PatientDoctorNote {
  patient_note_Id: number;
  patient_note: string;
  emr_Id: number;
  patient_Id: number;
}

export const getDoctorPrivateNote = async (doctorId: number, patientId: number): Promise<PatientDoctorNote[]> => {
  try {
    const query = `
      SELECT
        patient_note_Id,
        patient_note,
        emr_Id,
        patient_Id
      FROM
        tbl_patient_doctor_note
      WHERE
        doctor_Id = ?
        AND patient_Id = ?
        AND is_active = 1
        AND is_deleted = 0
      ORDER BY
        patient_note_Id DESC;`;

    const  [rows]  = await readConnection.select(query, [doctorId, patientId]);
    const res: PatientDoctorNote[] = rows;
    // console.log("getDoctorPrivateNote ---->>>>>",res);
    return res;
  } catch (err) {
    console.error('Error executing query', err);
    throw err;
  }
};
