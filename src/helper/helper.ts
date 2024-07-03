









































export function checkApiKeysV1(keys: string[], data: any) {
    let result: any = {};
    keys.forEach(key => {
        if (data[key]) {
            result[key] = data[key];
        }
    });
    return result;
}

export function validateAlphaSpace(value: string) {
    return /^[a-zA-Z\s]*$/.test(value);
}

export function xssClean(value: string) {
    // Implement XSS clean logic
    return value;
}

export function checkValidationV1(validation: any) {
    for (let key in validation) {
        const { rule, value } = validation[key];
        if (!rule(value)) {
            throw new Error(`Validation failed for ${key}`);
        }
    }
}

export function getDecodeIds(data: any) {
    // Implement your ID decoding logic
    return data;
}

export function getTimeDifference(dob: string) {
    // Implement age calculation
    return '';
}

export function logToDebugLog(message: string) {
    console.log(message);
}

export function respondErrorToApiV1(res: any, message: string, data: any) {
    res.status(400).json({ status: 'error', message, data });
}

export function respondSuccessToApiV1(res: any, message: string, data: any) {
    res.status(200).json({ status: 'success', message, data });
}

export function getEncodeIds(result: any) {
    // Implement your ID encoding logic
    return result;
}
