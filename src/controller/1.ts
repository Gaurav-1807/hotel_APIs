import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getClinicDoctorId, getFrontRecentList,get_time_difference, getPatientBillPayment, getEmrFlags, getDoctorPrivateNote, getEmrOtherRefer, getEmrRefer, getPatientPackage, getNextVisitCards } from '../services/patientService'; // Assuming you have these services

const sort_by_arr: { [key: string]: string } = {
  name: 'tp.fname',
  datetime: 'datetime'
};

const frontDeskPatientList = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const data = req.body;
  data.Id = req.body.Id;
  data.doctor_Id = req.body.doctor_Id;
  data.clinic_doctor_Id = req.body.clinic_doctor_Id;

  try {
    const clinicDoctor = await getClinicDoctorId(data.clinic_doctor_Id);
    data.clinic_Id = clinicDoctor.clinic_Id;

    if (data.sort_by && !sort_by_arr[data.sort_by]) {
      console.log("API - Invalid Sort By");
      return res.status(400).json({ message: 'Invalid Sort By' });
    }

    data.offset = data.offset === '' ? 10 : parseInt(data.offset);
    const page_no = parseInt(data.page_no);
    const from_index = ((page_no - 1) * data.offset) === 0 ? '-1' : ((page_no - 1) * data.offset).toString();
    const sort_by = data.sort_by ? sort_by_arr[data.sort_by] : 'tp.fname';
    const sort_by_direction = data.sort_by_direction ? data.sort_by_direction : 'DESC';

    const count = await getFrontRecentList(data, true);
    const resp = await getFrontRecentList(data, false, sort_by, sort_by_direction, from_index);

    const results = await Promise.all(resp.map(async (val: any) => {
      val.is_expired = val.is_expired === '1';

      const pay = await getPatientBillPayment(val.emr_Id);
      val.total_bill = pay.total_bill || "0";
      val.total_payment = pay.total_payment || "0";
      val.discount = pay.discount || "0";
      val.total_bill_amount = parseFloat(val.total_bill) + parseFloat(val.total_payment) + parseFloat(val.discount);

      if (val.dob) {
        val.age = get_time_difference(val.dob); // Assuming you have this function
      }
      val.assign_at = val.room_start_date ? val.room_start_date.split('||')[0] : '';
      val.discharge_at = val.room_end_date ? val.room_end_date.split('||').pop() : '';
      val.ward = val.ward;
      val.is_room = val.ward !== '' ? 1 : 0;

      const emr_flags = await getEmrFlags(val.emr_Id);
      val.is_discharge_card = emr_flags.is_discharge_card;
      val.is_medical_certificate = emr_flags.is_medical_certificate;
      val.is_death_certificate = emr_flags.is_death_certificate;
      val.is_mediclaim = emr_flags.is_mediclaim;
      val.is_emr_refer = emr_flags.is_emr_refer;
      val.is_mlc = emr_flags.is_mlc;

      const prvt_note_data = { doctor_Id: data.doctor_Id, patient_Id: val.patient_Id };
      val.is_private_note = await getDoctorPrivateNote(prvt_note_data) ? 1 : 0;
      val.is_bed_icon = val.room_start_date ? 1 : 0;

      const shareData = val.share_staff_Id ? val.share_staff_Id.split('#||#').map((v: string, k: number) => ({
        clinic_doctor_Id: v,
        doctor_name: val.doctor_name.split('#||#')[k]
      })) : [];

      const other_refer = await getEmrOtherRefer(val.emr_Id) || {};
      val.refer_data = {
        doctor: await getEmrRefer(val.emr_Id),
        other: other_refer
      };

      val.shared_primary_doctor = shareData;

      const package_data = {
        clinic_Id: data.clinic_Id,
        patient_Id: val.patient_Id,
        is_package: 'ACTIVE'
      };
      val.package_data = await getPatientPackage(package_data);

      const nextVisitCard = await getNextVisitCards(val.emr_Id);
      val.nextVisitData = nextVisitCard.length > 0 ? nextVisitCard : [];

      return val;
    }));

    const totalPages = Math.ceil(count / data.offset);

    const return_array = {
      total_records: count,
      total_pages: totalPages,
      page_no: page_no,
      offset: data.offset,
      result_count: results.length,
      result: results
    };

    if (results.length === 0) {
      console.log("API - data not found");
      return res.status(200).json({ message: 'data not found', data: {} });
    } else {
      return res.status(200).json({ message: 'success', data: return_array });
    }
  } catch (error) {
    console.error("API - Error:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export { frontDeskPatientList };
