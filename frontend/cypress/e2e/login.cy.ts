describe("Login Page", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("affiche le formulaire de connexion", () => {
    cy.contains("Login to Yoga Studio");
    cy.get('input[type="email"]').should("exist");
    cy.get('input[type="password"]').should("exist");
    cy.get('button[type="submit"]').should("exist");
  });

  it("la connexion est réussie", () => {
     cy.get('input[type="email"]').type("user@test.com")
     cy.get('input[type="password"]').type("test!1234")
     cy.contains('button', 'Login').click()
     cy.url().should('include', '/sessions')
  })

  it("la connexion à échouée", () => {
     cy.get('input[type="email"]').type("wrong@email.com")
     cy.get('input[type="password"]').type("wrongpassword")
     cy.contains('button', 'Login').click()
     cy.contains("Invalid credentials")
  })
});
