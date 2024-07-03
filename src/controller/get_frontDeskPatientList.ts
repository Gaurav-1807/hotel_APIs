import { EmrService } from '../helper/getNextVisitCards';
import { getTimeDifference } from '../helper/get_time_difference';
import { get_Emr_Flags } from '../helper/get_emr_flags';
import { getEmrOtherRefer } from '../helper/EmrOtherRefer';
import { getEmrRefer } from '../helper/getEmrRefer';

import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getDoctorPrivateNote } from '../helper/get_doctor_private_note';
import { getFrontResentList } from '../helper/get_front_resent_list';
import { getPatientBillPayment } from '../helper/get_patient_bill_payment';
import { getPatientPackage } from '../helper/getPatientPackage';
import { getClinicId } from './get_clinicId';

export const frontDeskPatientList = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const data = req.body;
        data.doctor_Id = req.body.doctor_Id;
        data.clinic_doctor_Id = req.body.clinic_doctor_Id;
        const resultclinic_Id = await getClinicId(data.doctor_Id , data.clinic_doctor_Id);
        // console.log(resultclinic_Id)
        data.clinic_Id = resultclinic_Id[0].clinic_Id
        const sort_by_arr: Record<string, string> = {
            "name": "tp.fname",
            "datetime": "datetime"
        };
        
        // console.log(data);
        if (!data.sort_by && !sort_by_arr.hasOwnProperty(data.sort_by)) {
            res.status(400).json({
                message: 'Invalid Sort By',
                data: {}
            });
            return;
        }

        const page_no = data.page_no
        const sort_by = sort_by_arr.hasOwnProperty(data.sort_by) ? sort_by_arr[data.sort_by] : "patient_Id";
        const sort_by_direction = (sort_by && (data.sort_by_direction === "ASC" || data.sort_by_direction === "DESC")) ? data.sort_by_direction : "DESC";
        const totalcount = await getFrontResentList(data, true, data.sort_by, data.sort_by_direction);
        const count = totalcount.length
        const resp = await getFrontResentList(data, false, sort_by, sort_by_direction , data.limit);
        const result = [];
        let i = 0;

        while (i < resp.length) {
            const val = resp[i];
            val.is_expired = val.is_expired === '1';
            const pay = await getPatientBillPayment(val.emr_Id);
            val.total_bill = pay[0].total_bill ?? "0";
            val.total_payment = pay[0].total_payment ?? "0";
            val.discount = pay[0].discount ?? "0";
            val.total_bill_amount = val.total_bill + val.total_payment + val.discount;

            if (val.dob !== "") {
                val.age = getTimeDifference(val.dob);
            } else {
                val.age = null;
            }
            // console.log(val.room_start_date, val.room_end_date)
            if (val.room_start_date != null && val.room_end_date != null && val.room_start_date != 0 && val.room_end_date != 0) {
                val.assign_at = val.room_start_date.split("||")[0];
                val.discharge_at = val.room_end_date.split("||").pop();
                val.ward = val.ward;
                val.is_room = val.ward !== "" ? 1 : 0;
            }
            else {
                val.assign_at = 0;
                val.discharge_at = 0;
                val.ward = val.ward;
                val.is_room = val.ward !== "" ? 1 : 0;
            }
            // console.log(val.room_start_date, val.room_end_date)
            const emr_flags = await get_Emr_Flags(val.emr_Id);
            // console.log(emr_flags)
            val.is_discharge_card = emr_flags.is_discharge_card;
            val.is_medical_certificate = emr_flags.is_medical_certificate;
            val.is_death_certificate = emr_flags.is_death_certificate;
            val.is_mediclaim = emr_flags.is_mediclaim;
            val.is_emr_refer = emr_flags.is_emr_refer;
            val.is_mlc = emr_flags.is_mlc;
            const doctor_Id = data.doctor_Id;
            const patient_Id = val.patient_Id;
            val.is_private_note = (await getDoctorPrivateNote(doctor_Id, patient_Id)) !== null ? 1 : 0;
            val.is_bed_icon = val.room_start_date !== "" ? 1 : 0;
            const shareData: any[] = [];
            if (val.share_staff_Id != "" && val.share_staff_Id != null && val.doctor_name != null && val.doctor_name != "") {
                val.share_staff_Id.split("#||#").forEach((v: string, k: number) => {
                    shareData[k] = {
                        clinic_doctor_Id: v,
                        doctor_name: val.doctor_name.split("#||#")[k],
                    };
                });
            }
            const other_refer = await getEmrOtherRefer(val.emr_Id) ?? {};
            val.refer_data = {
                doctor: await getEmrRefer(val.emr_Id),
                other: other_refer,
            };
            val.shared_primary_doctor = shareData;
            const packageData = {
                clinic_Id: data.clinic_Id,
                patient_Id: val.patient_Id,
                is_package: "ACTIVE",
            };
            val.package_data = await getPatientPackage(packageData);
            val.nextVisitCard = await EmrService.getNextVisitCards(val.emr_Id) ?? [];
            result.push(val);
            i++;
        }
        const totalPages = Math.ceil( count / data.limit);
        const return_array = {
            total_records:count,
            total_pages: totalPages,
            page_no: page_no,
            offset: data.offset,
            result_count: result.length,
            result: result,
        };
        if (result.length === 0) {
            res.status(400).json({
                message: 'Data not found',
                data: {}
            });
        } else {
            res.status(200).json({
                message: 'Success',
                data: return_array
            });
        }
    } catch (error) {
        console.error(error)
        res.send(error)
        // next(error);
    }
};
