const { sealedMerge } = require("../sealedMerge");

describe("sealedMerge", () => {
    [
        // the basic case
        {
            base: { prop1: "a", prop2: "b", prop3: true },
            customization: { prop1: "c", prop2: "d", prop3: false },
            expected: { prop1: "c", prop2: "d", prop3: false }
        },
        // unknown property in customization
        {
            base: { prop1: "a", prop2: "b" },
            customization: { prop1: "c", prop2: "d", prop3: "e" },
            expected: { prop1: "c", prop2: "d" }
        },
        // incomplete customization
        {
            base: { prop1: "a", prop2: "b", prop3: "e" },
            customization: { prop1: "c", prop2: "d" },
            expected: { prop1: "c", prop2: "d", prop3: "e" }
        },
        // customization has different type of value
        {
            base: { prop1: "a", prop2: "b", prop3: "e" },
            customization: { prop1: 1, prop2: "d" },
            expected: { prop1: "a", prop2: "d", prop3: "e" }
        },
        // array
        {
            base: { prop1: "a", prop2: [1, 2, 3] },
            customization: { prop2: [4, 5, 6] },
            expected: { prop1: "a", prop2: [4, 5, 6] }
        },
        // nested objects
        {
            base: { prop1: "a", prop2: { a: 1, b: { c: 1, d: 2 } }, prop3: { e: 1, f: { g: 1, h: 2 } } },
            customization: { prop2: { b: { d: 3 } }, prop3: { e: 11, f: { g: "a" } } },
            expected: { prop1: "a", prop2: { a: 1, b: { c: 1, d: 3 } }, prop3: { e: 11, f: { g: 1, h: 2 } } }
        },
    ].map(({ base, customization, expected }) =>
        it(`merges customization to base keeping the schema of base - base: ${JSON.stringify(base)}, customization: ${JSON.stringify(customization)}, expected: ${JSON.stringify(expected)}`, () => {
            expect(sealedMerge(base, customization)).toEqual(expected);
        })
    );
});