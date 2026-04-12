describe("Sessions Page", () => {
  beforeEach(() => {
    // On se connecte avant chaque test 
    cy.visit("/login");
    cy.get('input[type="email"]').type("user@test.com");
    cy.get('input[type="password"]').type("test!1234");
    cy.contains("button", "Login").click();
    cy.url().should("include", "/sessions");
  });

  it("affiche la liste des sessions", () => {
    cy.contains("Yoga Sessions");
  });

  it("affiche au moins une session", () => {
    cy.contains("View Details").should("exist");
  });

  it("un utilisateur non admin ne voit pas le bouton Create Session", () => {
    cy.contains("Create Session").should("not.exist");
  });

  it("un admin voit le bouton Create Session", () => {
    // On se déconnecte et on se reconnecte en tant qu'admin
    cy.visit("/login");
    cy.get('input[type="email"]').type("yoga@studio.com");
    cy.get('input[type="password"]').type("test!1234");
    cy.contains("button", "Login").click();
    cy.contains("Create Session").should("exist");
  });

  it("le bouton View Details redirige vers le détail d'une session", () => {
    cy.contains("View Details").first().click();
    cy.url().should("include", "/sessions/");
  });
});
