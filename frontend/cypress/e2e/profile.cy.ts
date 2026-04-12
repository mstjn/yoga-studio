describe("Profile Page", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("user@test.com");
    cy.get('input[type="password"]').type("test!1234");
    cy.contains("button", "Login").click();
    cy.url().should("include", "/sessions");
    cy.visit("/profile");
  });

  it("affiche les informations du profil", () => {
    cy.contains("My Profile");
    cy.contains("First Name");
    cy.contains("Last Name");
    cy.contains("Email");
    cy.contains("Account Type");
    cy.contains("Member Since");
  });

  it("affiche le badge User pour un utilisateur non admin", () => {
    cy.contains("User");
  });

  it("le bouton Back to Sessions redirige vers /sessions", () => {
    cy.contains("Back to Sessions").click();
    cy.url().should("include", "/sessions");
  });

  it("affiche le badge Administrator pour un admin", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("yoga@studio.com");
    cy.get('input[type="password"]').type("test!1234");
    cy.contains("button", "Login").click();
    cy.visit("/profile");
    cy.contains("Administrator");
  });
});
