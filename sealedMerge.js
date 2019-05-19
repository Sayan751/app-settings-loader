function sealedMerge(base, customization) {
    const merged = {};
    for (const key of Object.keys(base)) {
        const customizedValue = customization[key];
        const isValueCustomized = key in customization;
        const baseValue = base[key];
        const isSameType = isValueCustomized && Object.getPrototypeOf(baseValue) === Object.getPrototypeOf(customizedValue);

        if (!isValueCustomized || !isSameType) {
            merged[key] = baseValue;
        } else if (isSameType) {
            if (Array.isArray(customizedValue) || typeof customizedValue !== "object") {
                merged[key] = customizedValue;
            } else {
                merged[key] = sealedMerge(baseValue, customizedValue);
            }
        }
    }
    return merged;
}

module.exports.sealedMerge = sealedMerge;