import { readConnection } from "../config/db";


interface EmrOtherRefer {
    emr_other_refer_Id: number;
    refer_type: string;
    other_refer_type: string;
    name: string;
    mobile: string;
}

export const getEmrOtherRefer = async (emrId: number): Promise<EmrOtherRefer | null> => {
    try {
        const query = `
      SELECT
        emr_other_refer_Id,
        pCase(refer_type) as refer_type,
        pCase(other_refer_type) as other_refer_type,
        name,
        mobile
      FROM
        tbl_emr_other_refer
      WHERE
        is_active = 1
        AND is_deleted = 0
        AND emr_Id = ?
      LIMIT 1;`;

        const  rows  = await readConnection.select(query, [emrId]);
      // console.log(rows);
        if (rows.length === 0) {
            return null;
        }

        const res: EmrOtherRefer = rows[0];
        // console.log("getEmrOtherRefer ----->>>>",res)
        return res;
    } catch (err) {
        console.error('Error executing query', err);
        throw err;
    }
};
