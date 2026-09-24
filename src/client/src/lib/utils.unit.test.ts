// On importe notre test runner
import { describe, it } from "node:test";

// On importe notre bibliothèque d'assertion
import assert from "node:assert";

// On importe la fonction
import { toReadableDate } from './utils.ts';

describe("toReadableDate", () => {
    it("should return the good date in french format", () => {
        // Arrange
        const date = new Date("2026-01-01T00:00:00Z")

        // Act
        const result = toReadableDate(date)

        // Assert
        assert.strictEqual(result, "jeudi 1 janvier 2026")
    })
})