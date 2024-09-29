// P_1 - P_62
// create array with 62 elements

export function getFields() {
    const obj = Object.fromEntries(Array.from({ length: 62 }, (_, i) => i + 1).map((i) => ([[`P_${i}`], ''])));

    obj['P_21'] = '1';
    obj['P_22'] = '1';

    console.log(obj);
}