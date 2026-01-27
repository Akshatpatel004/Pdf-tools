export function minetype_routename(route) {
    let a;
    if (route === "excel-pdf") {
        a = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            "application/vnd.ms-excel.sheet.macroEnabled.12" ||
            "application/vnd.ms-excel.sheet.binary.macroEnabled.12" ||
            "application/vnd.ms-excel" ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.template" ||
            "application/vnd.ms-excel.template.macroEnabled.12" ||
            "text/csv";
    }else if (route === "image-pdf") {
        a = "image/png" || "image/jpeg" || "image/jpg";
    }
    
    return a;
}