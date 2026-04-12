describe("Register Page", () => {
  beforeEach(() => {
    cy.visit("/register");
  });

  it("affiche le formulaire d'inscription", () => {
    cy.contains("Register for Yoga Studio");
    cy.get('input[name="firstName"]').should("exist");
    cy.get('input[name="lastName"]').should("exist");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="password"]').should("exist");
    cy.get('button[type="submit"]').should("exist");
  });

  it("inscription réussie et redirection vers /sessions", () => {
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="email"]').type(`john_${Date.now()}@test.com`); // permet de faire un user unique a chaque fois
    cy.get('input[name="password"]').type("test!1234");
    cy.contains("button", "Register").click();
    cy.url().should("include", "/sessions");
  });

  it("affiche une erreur si l'email est déjà utilisé", () => {
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="email"]').type("user@test.com");
    cy.get('input[name="password"]').type("test!1234");
    cy.contains("button", "Register").click();
    cy.contains("Email already exists");
  });
});
