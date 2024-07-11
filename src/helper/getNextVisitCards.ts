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

  public static async getNextVisitCards(emrId: string): Promise<NextVisitCard[]> {
    const query = `SELECT
                      JSON_EXTRACT(
                          CONVERT(
                              AES_DECRYPT(
                                  encripted_json_data,
                                ?
                              ) USING 'utf8'
                          ),
                          '$.${EmrService.CARDDATA[EmrService.NEXTVISITREMINDER_CARD_CATEGORY]}[0].reminder_date'
                      ) AS reminder_date,
                      JSON_EXTRACT(
                          CONVERT(
                              AES_DECRYPT(
                                  encripted_json_data,
                                   ?
                              ) USING 'utf8'
                          ),
                          '$.${EmrService.CARDDATA[EmrService.NEXTVISITREMINDER_CARD_CATEGORY]}[0].reminder_description'
                      ) AS reminder_description,
                      ted.emr_detail_Id
                  FROM
                      tbl_emr_details AS ted
                  WHERE
                      ted.card_category_Id = ${EmrService.NEXTVISITREMINDER_CARD_CATEGORY} AND ted.emr_Id = ?  AND ted.is_active = 1 AND ted.is_deleted = 0
                  GROUP BY
                      ted.emr_detail_Id
                  ORDER BY
                      reminder_date ASC`
    // console.log(query)
  
    const MYSQL_ENCRYPTION_KEY = process.env.MYSQL_ENCRYPTION_KEY;
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
