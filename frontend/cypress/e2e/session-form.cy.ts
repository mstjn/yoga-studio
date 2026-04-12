describe("Session Form Page", () => {
  beforeEach(() => {
    // Le formulaire est réservé aux admins
    cy.visit("/login");
    cy.get('input[type="email"]').type("yoga@studio.com");
    cy.get('input[type="password"]').type("test!1234");
    cy.contains("button", "Login").click();
    cy.url().should("include", "/sessions");
  });

  it("affiche le formulaire de création", () => {
    cy.visit("/sessions/create");
    cy.contains("Create New Session");
    cy.get('input[name="name"]').should("exist");
    cy.get('input[name="date"]').should("exist");
    cy.get('select[name="teacherId"]').should("exist");
    cy.get('textarea[name="description"]').should("exist");
  });

  it("crée une session et redirige vers /sessions", () => {
    cy.visit("/sessions/create");
    cy.get('input[name="name"]').type("Test Yoga Session");
    cy.get('input[name="date"]').type("2026-06-01");
    cy.get('select[name="teacherId"]').select(1);
    cy.get('textarea[name="description"]').type("Une session de yoga pour les débutants");
    cy.contains("button", "Create Session").click();
    cy.url().should("include", "/sessions");
  });

  it("affiche le formulaire d'édition avec les données existantes", () => {
    cy.visit("/sessions/edit/1");
    cy.contains("Edit Session");
    cy.get('input[name="name"]').should("not.have.value", "");
  });

  it("modifie une session et redirige vers /sessions", () => {
    cy.visit("/sessions/edit/1");
    cy.get('input[name="name"]').clear().type("Session modifiée");
    cy.contains("button", "Update Session").click();
    cy.url().should("include", "/sessions");
  });

  it("le bouton Cancel redirige vers /sessions", () => {
    cy.visit("/sessions/create");
    cy.contains("button", "Cancel").click();
    cy.url().should("include", "/sessions");
  });

  it("un utilisateur non admin est redirigé vers /sessions", () => {
    // On se reconnecte en tant que user normal
    cy.visit("/login");
    cy.get('input[type="email"]').type("user@test.com");
    cy.get('input[type="password"]').type("test!1234");
    cy.contains("button", "Login").click();
    cy.visit("/sessions/create");
    cy.url().should("include", "/sessions");
    cy.url().should("not.include", "/create");
  });
});
