let imageAcceptRoute=["image-pdf" , "bgImageRemoval" , "compress-image" , "image-format-converter"];


export function minetype_routename(route) {
    if (route === "excel-pdf") {
        return [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
            "application/vnd.ms-excel.template.macroEnabled.12",
            "text/csv"
        ];
    } else if (imageAcceptRoute.includes(route)) {
        return ["image/png", "image/jpeg", "image/jpg" , "image/tiff" , "image/webp" , "image/gif"];
    }
    return [];
}
