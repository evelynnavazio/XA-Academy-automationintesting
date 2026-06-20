/// <reference types="cypress" />

// =============================================================================
// myTestRestfulBooker.cy.js
// =============================================================================
// Test suite for: Shady Meadows B&B — https://automationintesting.online/
//
// DATA STRATEGY
// Test data lives in fixture files under cypress/fixtures/:
// - booking.json
// - contact.json
// - admin.json
// - rooms.json
// =============================================================================

// Avoid current application exception
Cypress.on('uncaught:exception', () => {
  return false
})

// =============================================================================
// SECTION 1 — HOME PAGE
// =============================================================================

describe('1 — Home Page', () => {
  beforeEach(() => {
    cy.visit('https://automationintesting.online/')
  })

  it('TC-1.0 — should load the home page with main content visible', () => {
    cy.contains('Welcome to Shady Meadows B&B').should('be.visible')
    cy.get('nav').should('exist')
    cy.get('#contact').should('exist')
  })
})

// =============================================================================
// SECTION 2 — BOOKING FLOW
// =============================================================================

describe('2 — Booking', () => {
  beforeEach(() => {
    cy.visit('https://automationintesting.online/')
  })

  it('TC-2.0 — should display available rooms on the home page', () => {
    cy.intercept('GET', '**/api/room').as('getRooms')

    cy.reload()
    cy.wait('@getRooms')

    cy.get('a[href*="/reservation/"]', { timeout: 10000 })
      .should('have.length.at.least', 1)

    cy.contains('a.btn.btn-primary', 'Book now')
      .should('be.visible')
  })

  it('TC-3.0 — should open the booking form when clicking Book now for a room', () => {
    cy.intercept('GET', '**/api/room').as('getRooms')

    cy.reload()
    cy.wait('@getRooms')

    cy.contains('a.btn.btn-primary', 'Book now')
      .first()
      .click()

    cy.url().should('include', '/reservation/')

    cy.contains('Reserve Now', { matchCase: false })
      .should('be.visible')
  })

  it.only('TC-6.0 — should display validation errors when submitting an empty booking form', () => {
    cy.contains('a.btn.btn-primary', 'Book now', { timeout: 10000 })
      .first()
      .click()

    cy.url().should('include', '/reservation/')

    cy.contains('Reserve Now', { matchCase: false })
      .click()

    cy.get('.alert-danger').should('be.visible')
    cy.contains('Booking Confirmed').should('not.exist')
  })

  it('TC-7.0 — should show validation error for an invalid email address', () => {
    cy.fixture('booking').then((bookingData) => {
      const guest = bookingData.invalidEmail

      cy.contains('a.btn.btn-primary', 'Book now', { timeout: 10000 })
        .first()
        .click()

      cy.url().should('include', '/reservation/')

      cy.selectBookingDates(guest.checkin, guest.checkout)

      cy.contains('Reserve Now', { matchCase: false })
        .click()

      cy.fillBookingForm(guest)

      cy.contains('Reserve Now', { matchCase: false })
        .last()
        .click()

      cy.contains('must be a well-formed email address').should('be.visible')
      cy.contains('Booking Confirmed').should('not.exist')
    })
  })

  it('TC-9.0 — should display all expected validation messages for invalid inputs', () => {
    cy.contains('a.btn.btn-primary', 'Book now', { timeout: 10000 })
      .first()
      .click()

    cy.url().should('include', '/reservation/')

    cy.contains('Reserve Now', { matchCase: false })
      .click()

    cy.get('.alert-danger').within(() => {
      cy.contains('Firstname should not be blank').should('be.visible')
      cy.contains('Lastname should not be blank').should('be.visible')
      cy.contains('must not be null').should('be.visible')
    })
  })
})

// =============================================================================
// SECTION 3 — CONTACT FORM
// =============================================================================

describe('3 — Contact Form', () => {
  beforeEach(() => {
    cy.visit('https://automationintesting.online/#contact')
  })

  it('TC-18.0 — should submit the contact form and show a confirmation message', () => {
    cy.fixture('contact').then((contactData) => {
      const data = contactData.validContact

      cy.fillContactForm(data)
      cy.get('[data-testid="submitContact"]').click()

      cy.contains(data.subject, { timeout: 8000 }).should('be.visible')
      cy.contains('Thanks for getting in touch').should('be.visible')
    })
  })

  it('TC-17.0 — should show validation errors when submitting an empty contact form', () => {
    cy.get('[data-testid="submitContact"]').click()

    cy.get('.alert-danger').should('be.visible')
    cy.contains('must not be blank').should('be.visible')
  })
})

// =============================================================================
// SECTION 4 — ADMIN PANEL
// =============================================================================

describe('4 — Admin Panel', () => {
  it('TC-19.0 — should log in to the admin panel with valid credentials', () => {
    cy.fixture('admin').then((adminData) => {
      cy.adminLogin(adminData.validAdmin)

      cy.url().should('include', '/admin')
      cy.contains('Rooms', { timeout: 8000 }).should('be.visible')
    })
  })

  it('TC-20.0 — should reject invalid admin credentials', () => {
    cy.fixture('admin').then((adminData) => {
      cy.adminLogin(adminData.invalidAdmin)

      cy.contains('Invalid credentials').should('be.visible')
      cy.url().should('include', '/admin')
    })
  })

  it('TC-21.0 — should display a completed booking record in admin', () => {
    cy.fixture('booking').then((bookingData) => {
      cy.fixture('admin').then((adminData) => {
        const guest = bookingData.anotherGuest
        const guestLastName = guest.lastname || guest.lastName

        cy.visit('https://automationintesting.online/')

        cy.contains('a.btn.btn-primary', 'Book now', { timeout: 10000 })
          .first()
          .click()

        cy.url().should('include', '/reservation/')

        cy.selectBookingDates(guest.checkin, guest.checkout)

        cy.contains('Reserve Now', { matchCase: false })
          .click()

        cy.fillBookingForm(guest)

        cy.contains('Reserve Now', { matchCase: false })
          .last()
          .click()

        cy.contains('Booking Confirmed', { timeout: 10000 })
          .should('be.visible')

        cy.adminLogin(adminData.validAdmin)

        cy.contains('Bookings').click()

        cy.contains(guestLastName, { timeout: 8000 })
          .should('be.visible')
      })
    })
  })

  it('TC-22.0 — should display a submitted contact message in admin inbox', () => {
    cy.fixture('contact').then((contactData) => {
      cy.fixture('admin').then((adminData) => {
        const data = contactData.validContact

        cy.visit('https://automationintesting.online/#contact')

        cy.fillContactForm(data)
        cy.get('[data-testid="submitContact"]').click()

        cy.contains('Thanks for getting in touch', { timeout: 8000 })
          .should('be.visible')

        cy.adminLogin(adminData.validAdmin)

        cy.contains('Inbox').click()

        cy.contains(data.subject, { timeout: 8000 })
          .should('be.visible')
      })
    })
  })
})