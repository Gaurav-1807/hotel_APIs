import { readConnection } from "../config/db";


interface getclinicId {
    clinic_Id: number;
}

export const getClinicId = async (doctorId: number, clinic_doctor_Id: number): Promise<getclinicId[]> => {
  try {
    const query = `
      SELECT
        clinic_Id
      FROM
        tbl_clinic_doctors
      WHERE
        doctor_Id = ?
        AND clinic_doctor_Id = ? `

    const  rows  = await readConnection.select(query, [doctorId, clinic_doctor_Id]);
    const res: getclinicId[] = rows;
    // console.log("get clinic ID ====>>>",rows);
    return res;
  } catch (err) {
    console.error('Error executing query', err);
    throw err;
  }
};
