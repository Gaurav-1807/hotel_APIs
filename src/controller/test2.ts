// interface MyData {
//     q: string;
//     sort_by: string;
//     sort_by_direction: string;
//     page_no: string;
//     offset: string;
//     Id: string;
// }

// interface ThisContext {
//     mydata: MyData;
//     GID: string;
//     SID: string;
//     mdlcommon: {
//         getClinicDoctorId: (clinicDoctorId: string) => { row_array: () => { clinic_Id: string } };
//     };
//     mdlemr: {
//         get_front_resent_list: (data: any, countOnly: boolean, sort_by?: string, sort_by_direction?: string, from_index?: number) => { num_rows: () => number, result_array: () => any[] };
//         get_patient_bill_payment: (emr_Id: string) => { row_array: () => { total_bill: string, total_payment: string, discount: string } };
//         get_emr_flags: (emr_Id: string) => { [key: string]: boolean };
//         get_emr_refer: (emr_Id: string) => any;
//         get_emr_other_refer: (emr_Id: string) => any;
//         get_patient_package: (packageData: any) => { result_array: () => any[] };
//     };
//     mdlcard: {
//         get_next_visit_cards: (emr_Id: string) => any;
//     };
//     mpd: {
//         get_doctor_private_note: (noteData: any) => { row_array: () => any };
//     };
//     mpfd: {
//         get_emr_flags: (emr_Id: string) => { [key: string]: boolean };
//     };
//     load: {
//         model: (modelName: string, alias: string) => void;
//     };
//     check_validation_v1: (validation: any) => void;
// }

function frontDeskPatientList(this: ThisContext): void {
    const keys = ["q", "sort_by", "sort_by_direction", "page_no", "offset"];
    let data = check_api_keys_v1(keys, this.mydata);

    const validation = {
        "sort_by_direction": {
            "rule": "trim|in_list[DESC,ASC]",
            "value": data["sort_by_direction"]
        },
        "q": {
            "rule": "trim|callback_validateAlphaSpace",
            "numeric": data["q"]
        },
        "sort_by": {
            "rule": "trim|xss_clean",
            "value": data["sort_by"]
        },
        "page_no": {
            "rule": "trim|required|numeric",
            "value": data["page_no"]
        },
        "offset": {
            "rule": "trim|numeric",
            "value": data["offset"]
        }
    };

    this.check_validation_v1(validation);
    data["Id"] = this.mydata["Id"];
    data["doctor_Id"] = this.GID;
    data["clinic_doctor_Id"] = this.SID;
    data["clinic_Id"] = this.mdlcommon.getClinicDoctorId(data["clinic_doctor_Id"]).row_array()['clinic_Id'];

    const sort_by_arr: { [key: string]: string } = {
        "name": "tp.fname",
        "datetime": "datetime"
    };

    if (data["sort_by"] && !Object.keys(sort_by_arr).includes(data["sort_by"])) {
        respond_error_to_api_v1("Invalid Sort By", []);
        return;
    }

    data["offset"] = data["offset"] === '' ? 10 : data["offset"];
    const page_no = parseInt(data["page_no"]);
    const from_index = (page_no - 1) * data['offset'] === 0 ? -1 : (page_no - 1) * data['offset'];
    const sort_by = sort_by_arr[data["sort_by"]] || "tp.fname";
    const sort_by_direction = (sort_by && (data["sort_by_direction"] === "ASC" || data["sort_by_direction"] === "DESC")) ? data["sort_by_direction"] : "DESC";

    const count = this.mdlemr.get_front_resent_list(data, true).num_rows();
    const resp = this.mdlemr.get_front_resent_list(data, false, sort_by, sort_by_direction, from_index).result_array();

    resp.forEach((val : any, key : any) => {
        resp[key]["is_expired"] = val['is_expired'] === '1';
        const pay = this.mdlemr.get_patient_bill_payment(val["emr_Id"]).row_array();
        resp[key]['total_bill'] = pay["total_bill"] ?? "0";
        resp[key]['total_payment'] = pay["total_payment"] ?? "0";
        resp[key]['discount'] = pay["discount"] ?? "0";
        resp[key]['total_bill_amount'] = resp[key]['total_bill'] + resp[key]['total_payment'] + resp[key]['discount'];

        if (val["dob"] !== "") {
            resp[key]["age"] = get_time_difference(val["dob"]);
        }

        delete resp[key]['room_start_date'];
        delete resp[key]['room_end_date'];
        resp[key]['assign_at'] = val['room_start_date'].split("||")[0];
        resp[key]['discharge_at'] = val['room_end_date'].split("||")[1];
        resp[key]['ward'] = val['ward'];
        resp[key]['is_room'] = val['ward'] !== "" ? 1 : 0;

        this.load.model("service/v1/Model_doctor_patient_desk", "mpd");
        this.load.model("service/v1/Model_doctor_front_desk", "mpfd");

        const emr_flags = this.mpfd.get_emr_flags(val["emr_Id"]);
        resp[key]['is_discharge_card'] = emr_flags["is_discharge_card"];
        resp[key]['is_medical_certificate'] = emr_flags["is_medical_certificate"];
        resp[key]['is_death_certificate'] = emr_flags["is_death_certificate"];
        resp[key]['is_mediclaim'] = emr_flags["is_mediclaim"];
        resp[key]['is_emr_refer'] = emr_flags["is_emr_refer"];
        resp[key]['is_mlc'] = emr_flags["is_mlc"];

        const prvt_note_data = { "doctor_Id": data["doctor_Id"], "patient_Id": val["patient_Id"] };
        resp[key]['is_private_note'] = this.mpd.get_doctor_private_note(prvt_note_data).row_array() !== "" ? 1 : 0;
        resp[key]['is_bed_icon'] = val['room_start_date'] !== "" ? 1 : 0;

        const shareData: any[] = [];
        if (val["share_staff_Id"] !== "") {
            const share_staff_Id = val["share_staff_Id"].split("#||#");
            const doctor_name = val["doctor_name"].split("#||#");
            share_staff_Id.forEach((v:any, k:any) => {
                shareData[k] = {
                    "clinic_doctor_Id": v,
                    "doctor_name": doctor_name[k]
                };
            });
        }

        const other_refer = this.mdlemr.get_emr_other_refer(val["emr_Id"]);
        resp[key]["refer_data"] = {
            "doctor": this.mdlemr.get_emr_refer(val["emr_Id"]),
            "other": other_refer === "" ? {} : other_refer
        };

        resp[key]['shared_primary_doctor'] = shareData;

        const package_data = { "clinic_Id": data["clinic_Id"], "patient_Id": val["patient_Id"], "is_package": "ACTIVE" };
        resp[key]["package_data"] = this.mdlemr.get_patient_package(package_data).result_array();

        const nextVisitCard = this.mdlcard.get_next_visit_cards(val["emr_Id"]);
        resp[key]["nextVisitData"] = (nextVisitCard) ? nextVisitCard : [];
    });

    const totalPages = Math.ceil(count / data["offset"]);
    const return_array = {
        "total_records": count,
        "total_pages": totalPages,
        "page_no": page_no,
        "offset": parseInt(data["offset"]),
        "result_count": resp.length,
        "result": getEncodesids(resp)
    };

    if (resp.length === 0) {
        respond_success_to_api_v1("data not found", {});
    } else {
        respond_success_to_api_v1("success", return_array);
    }
}
