describe("Session Detail Page", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("user@test.com");
    cy.get('input[type="password"]').type("test!1234");
    cy.contains("button", "Login").click();
    cy.url().should("include", "/sessions");
    cy.visit("/sessions/1");
  });

  it("affiche les détails de la session", () => {
    cy.contains("Details");
    cy.contains("Date:");
    cy.contains("Teacher:");
    cy.contains("Participants:");
    cy.contains("Description");
  });

  it("un utilisateur non admin voit le bouton Join ou Leave", () => {
    cy.contains(/Join Session|Leave Session/).should("exist");
  });

  it("le bouton Back to Sessions redirige vers /sessions", () => {
    cy.contains("Back to Sessions").click();
    cy.url().should("include", "/sessions");
  });

  it("un admin voit les boutons Edit et Delete", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("yoga@studio.com");
    cy.get('input[type="password"]').type("test!1234");
    cy.contains("button", "Login").click();
    cy.visit("/sessions/1");
    cy.contains("Edit").should("exist");
    cy.contains("Delete").should("exist");
  });
});
