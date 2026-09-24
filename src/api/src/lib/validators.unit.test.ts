// On importe "describe" et "it" de node:test (notre test runner)
// "it" est remplaçable par "test" si voulu, c'est la même chose.
import { describe, it } from "node:test";

// On importe notre bibliothèque d'assertion (node:assert)
import assert from "node:assert";

// On importe la fonction que l'on souhaite tester
import { isValidPassword } from "./validators.ts";

describe("isValidPassword", () => {
  // Exemple de test unitaire, essayez de les écrires en anglais ! :)
  it("should return true when the password meet all requirements", () => {
    // On va utiliser la méthode AAA: Arrange, Act, Assert
    // Arrange: Mise en place des données nécessaire au test
    const password = "Azerty123!";

    // Act: Execution de la fonction à tester
    const result = isValidPassword(password);

    // Assert: Vérification du bon fonctionnement
    assert.strictEqual(result, true);
  });

  it("should return false when there is less than 8 characters", () => {
    // Arrange: Mise en place des données nécessaire au test
    const password = "Aa1!";

    // Act: Execution de la fonction à tester
    const result = isValidPassword(password);

    // Assert: Vérification du bon fonctionnement
    assert.strictEqual(result, false);
  });

  it("should return false when there is more than 16 characters", () => {
    // Arrange: Mise en place des données nécessaire au test
    const password = "AzertyAzertyAzertyAzerty1!";

    // Act: Execution de la fonction à tester
    const result = isValidPassword(password);

    // Assert: Vérification du bon fonctionnement
    assert.strictEqual(result, false);
  });

  it("should return false when there is no lowercase", () => {
    // Arrange: Mise en place des données nécessaire au test
    const password = "AAAAAAAA!1";

    // Act: Execution de la fonction à tester
    const result = isValidPassword(password);

    // Assert: Vérification du bon fonctionnement
    assert.strictEqual(result, false);
  });

  it("should return false when there is no uppercase", () => {
    // Arrange: Mise en place des données nécessaire au test
    const password = "aaaaaaaa!1";

    // Act: Execution de la fonction à tester
    const result = isValidPassword(password);

    // Assert: Vérification du bon fonctionnement
    assert.strictEqual(result, false);
  });

  it("should return false when there is no number", () => {
    // Arrange: Mise en place des données nécessaire au test
    const password = "Aaaaaaaa!!";

    // Act: Execution de la fonction à tester
    const result = isValidPassword(password);

    // Assert: Vérification du bon fonctionnement
    assert.strictEqual(result, false);
  });

  it("should return false when there is no special character", () => {
    // Arrange: Mise en place des données nécessaire au test
    const password = "Aaaaaaaa11";

    // Act: Execution de la fonction à tester
    const result = isValidPassword(password);

    // Assert: Vérification du bon fonctionnement
    assert.strictEqual(result, false);
  });
});
