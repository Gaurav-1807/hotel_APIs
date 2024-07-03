import { readConnection } from "../config/db";

export async function getPatientBillPayment(emr_Id: number) {
    try {
      const query = `
        SELECT 
          (SUM(IF(tct.type = "CREDIT", tct.amount, 0)) - SUM(IF(tct.type = "DEBIT", tct.amount, 0))) AS total_bill,
          SUM(IF(ptm.payment_type_key = "discount", tep.amount, 0)) AS discount,
          (SUM(IF(ptm.payment_type_key = "payment", tep.amount, 0)) - SUM(IF(ptm.payment_type_key = "payment-return", tep.amount, 0))) AS total_payment
        FROM tbl_clinic_transaction AS tct
        LEFT JOIN tbl_emr_payment AS tep ON tep.emr_payment_Id = tct.emr_payment_Id AND tep.is_cancel = 0 AND tep.is_archived = 0
        LEFT JOIN payment_type_mst AS ptm ON ptm.payment_type_Id = tep.payment_type_Id
        WHERE tct.emr_Id = ? AND tct.is_deleted = 0 AND tct.is_archived = 0
      `;
  
      const rows = await readConnection.select(query, [emr_Id]);
    //   console.log("get_patient_bill_payment query result: ", rows);
      return rows;
    } catch (error) {
      console.error("Error in getPatientBillPayment: ", error);
      throw error;
    }
  }
  