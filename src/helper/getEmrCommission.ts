import dotenv from 'dotenv';
// import { readConnection } from '../config/db';
dotenv.config();

import { readConnection } from "../config/db";

// getEmrCommission function ===
export interface ClinicServicePrice {
    clinic_service_price_Id: string;
    service_id: string;
    bill_total: number;
}

export interface Commission {
    clinic_service_price_Id: string;
    clinic_refer_Id: string;
    commission: number;
    amount: number;
}

export interface ReferCommission {
    total_bill: number;
    commissions: Record<string, number[]>;
}


export const getEmrCommission = async (
    emrId: number,
    clinicReferIds: number[]
): Promise<ReferCommission> => {
    try {
        const query1 = `
        SELECT
          csp.clinic_service_price_Id,
          ct.service_Id as service_id,
          ct.amount as bill_total
        FROM
          tbl_emr e
          LEFT JOIN tbl_clinic_bill_mst cbm ON cbm.emr_Id = e.emr_Id AND cbm.is_active = 1 AND cbm.is_deleted = 0
          LEFT JOIN tbl_clinic_transaction ct ON ct.clinic_bill_Id = cbm.clinic_bill_Id AND ct.is_deleted = 0 AND ct.is_archived = 0
          LEFT JOIN tbl_refer_patient trp ON e.emr_Id = trp.to_emr_Id AND trp.is_deleted = 0 AND trp.is_active = 1
          LEFT JOIN tbl_clinic_service_price csp ON csp.clinic_Id = cbm.clinic_Id AND ct.service_Id = csp.service_Id
        WHERE
          trp.clinic_refer_Id IN (?)
          AND e.emr_Id = ?
          AND e.is_active = 1
          AND e.is_deleted = 0
        GROUP BY
          ct.transaction_Id;
      `;

        const res = await readConnection.select(query1, [clinicReferIds, emrId]);

        const filter: ClinicServicePrice[] = res.map((val: any) => ({
            clinic_service_price_Id: val.clinic_service_price_Id,
            service_id: val.service_id,
            bill_total: val.bill_total,
        }));

        const last: Record<string, number> = filter.reduce((acc: any, curr: any) => {
            acc[curr.clinic_service_price_Id] = (acc[curr.clinic_service_price_Id] || 0) + curr.bill_total;
            return acc;
        }, {});

        const referCommission: ReferCommission = {
            total_bill: Object.values(last).reduce((sum, val) => sum + val, 0),
            commissions: {},
        };

        if (Object.keys(last).length > 0) {
            const query2 = `
          SELECT
            tcsp.clinic_service_price_Id,
            trp.clinic_refer_Id,
            ct.amount,
            ct.commission
          FROM
            tbl_clinic_service_price tcsp
            LEFT JOIN tbl_clinic_transaction ct ON ct.service_Id = tcsp.service_Id
            LEFT JOIN tbl_refer_patient trp ON trp.to_emr_Id = ct.emr_Id AND trp.is_deleted = 0 AND trp.is_active = 1
          WHERE
            tcsp.clinic_service_price_Id IN (?)
            AND ct.emr_Id = ?
            AND ct.is_deleted = 0
            AND ct.is_archived = 0
            AND ct.emr_payment_Id IS NULL;`;
            const commission = await readConnection.select(query2, [Object.keys(last), emrId]);
            commission.forEach((co: Commission) => {
                if (last[co.clinic_service_price_Id]) {
                    if (co.commission !== 0) {
                        if (!referCommission.commissions[co.clinic_refer_Id]) {
                            referCommission.commissions[co.clinic_refer_Id] = [];
                        }
                        referCommission.commissions[co.clinic_refer_Id].push(co.amount * co.commission / 100);
                    } else {
                        if (!referCommission.commissions[co.clinic_refer_Id]) {
                            referCommission.commissions[co.clinic_refer_Id] = [];
                        }
                        referCommission.commissions[co.clinic_refer_Id].push(0);
                    }
                }
            });
        }
        return referCommission;
    } catch (error) {
        console.error("Error fetching EMR commission:", error);
        throw error;
    }
};

