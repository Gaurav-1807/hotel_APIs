import { Request, Response, NextFunction} from 'express';
import getDeathCertificates from './getdeathcertificate'; // Adjust import path as necessary

interface CustomRequest extends Request {
    user: {
        SID: number;
        GID: number;
        clinic_Id: number;
    };
}

interface ClinicPatientDeathReportData {
    q: string;
    page: number;
    from_date?: string;
    to_date?: string;
    offset: number;
    clinic_doctor_Id?: number;
    doctor_Id?: number;
    clinic_Id?: number;
}

// // Validation middleware
// export const validateClinicPatientDeathReport = [
//     body('q').optional().isString(),
//     body('page').notEmpty().isNumeric(),
//     body('from_date').optional().isString(),
//     body('to_date').optional().isString(),
//     body('offset').optional().isNumeric()
// ];

export async function getClinicPatientDeathReport(req: Request, res: Response) {
    // Check for validation errors
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }

    const { q, page, from_date, to_date, offset }: ClinicPatientDeathReportData = req.body;

    const data: ClinicPatientDeathReportData = { q, page, from_date, to_date, offset };
    console.log(data);
    // Type assertion to use CustomRequest
    const customReq = req as CustomRequest;

    data.clinic_doctor_Id = req.body.clinic_doctor_Id;
    data.doctor_Id = req.body.doctor_Id;

    try {
        // Fetch clinic_Id based on clinic_doctor_Id
        const clinicDetails = 105; // Ensure to handle undefined clinic_doctor_Id
        data.clinic_Id = clinicDetails;

        // Ensure clinic_Id is defined
        if (!data.clinic_Id) {
            return res.status(400).json({ error: 'Clinic ID is required' });
        }

        const pageNumber = data.page;
        const fromIndex = (pageNumber - 1) * data.offset;

        // Fetching the data as an array of DeathCertificateData
        const respData = await getDeathCertificates(data, fromIndex);
        const totalRecord = respData.length;
        const totalPages = data.offset ? Math.ceil(totalRecord / data.offset) : 0;

        const responseData = {
            total_record: totalRecord,
            total_pages: totalPages,
            page_no: pageNumber,
            offset: data.offset,
            result_count: respData.length,
            record: respData
        };
        console.log(responseData);
        res.status(200).json({
            status: 'success',
            data: responseData
        });
        console.log(responseData);
        return responseData
    } catch (error) {
        console.error('Error retrieving death certificates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}