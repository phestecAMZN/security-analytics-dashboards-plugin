/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PLUGIN_NAME,
  TWENTY_SECONDS_TIMEOUT,
  TEST_INDEX,
  TEST_DETECTOR,
  TEST_FIELD_MAPPINGS,
  TEST_DOCUMENT,
} from '../support/constants';

describe('Findings', () => {
  before(() => {
    // Delete any existing indices
    cy.deleteAllIndices();

    // Create test index
    cy.createIndex('cypress-test-windows', TEST_INDEX);

    // Create test detector - TODO - get createDetector issues resolved.
    // cy.createDetector('test_detector', TEST_DETECTOR);

    // Create detector manually

    // Visit Detectors page
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/detectors`);

    cy.wait(10000);

    // Locate Create detector button click to start
    cy.contains('Create detector').click({ force: true });

    // Check to ensure process started
    cy.contains('Define detector');

    // Enter a name for the detector in the appropriate input
    cy.get(`input[placeholder="Enter a name for the detector."]`).type('test detector{enter}');

    // Select our pre-seeded data source (cypress-test-windows)
    cy.get(`[data-test-subj="define-detector-select-data-source"]`).type(
      'cypress-test-windows{enter}'
    );

    // Select threat detector type (Windows logs)
    cy.get(`input[id="windows"]`).click({ force: true });

    // Wait for detector rules to load - timeout on click above ineffective
    cy.wait(10000);

    // Click Next button to continue
    cy.get('button').contains('Next').click({ force: true }, { timeout: 2000 });

    // Check that correct page now showing
    cy.contains('Required field mappings');

    // Select appropriate names to map fields to
    for (let field_name in TEST_FIELD_MAPPINGS) {
      const mappedTo = TEST_FIELD_MAPPINGS[field_name];

      cy.contains('tr', field_name).within(() => {
        cy.get(`[data-test-subj="detector-field-mappins-select"]`).select(mappedTo);
      });
    }

    // Continue to next page
    cy.get('button').contains('Next').click({ force: true }, { timeout: 2000 });

    // Check that correct page now showing
    cy.contains('Set up alerts');

    // Type name of new trigger
    cy.get(`input[placeholder="Enter a name for the alert condition."]`).type('test_trigger');

    // Type in (or select) tags for the alert condition
    cy.get(`[data-test-subj="alert-tags-combo-box"]`).type('attack.defense_evasion{enter}');

    // Select applicable severity levels
    cy.get(`[data-test-subj="security-levels-combo-box"]`).click({ force: true });
    cy.contains('1 (Highest)').click({ force: true });

    // Continue to next page
    cy.contains('Next').click({ force: true });

    // Confirm page is reached
    cy.contains('Review and create');

    // Confirm field mappings registered
    cy.contains('Field mapping');
    for (let field in TEST_FIELD_MAPPINGS) {
      const mappedTo = TEST_FIELD_MAPPINGS[field];

      cy.contains(field);
      cy.contains(mappedTo);
    }

    // Create the detector
    cy.get('button').contains('Create').click({ force: true });

    cy.wait(10000);
  });

  beforeEach(() => {
    // Visit Findings page
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/findings`);

    //wait for page to load
    cy.wait(10000);

    // Check that correct page is showing
    cy.contains('Findings');
  });

  it('displays findings based on recently ingested data', () => {
    // Ingest a new document
    cy.ingestDocument('cypress-test-windows', TEST_DOCUMENT);

    // wait for detector interval to pass
    cy.wait(60000);

    // Click refresh
    cy.get('button').contains('Refresh').click();

    // Check for non-empty findings list
    cy.contains('No items found').should('not.exist');

    // Check for expected findings
    cy.contains('USB Device Plugged');
    cy.contains('test detector');
    cy.contains('Windows');
    cy.contains('Low');

    cy.get(`[data-test-subj="findings-table-finding-id"]`).click();
    cy.contains('Finding details');
  });

  after(() => {
    // Visit Detectors page
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/detectors`);

    cy.wait(10000);

    // Click on detector to be removed
    cy.contains('test detector').click({ force: true });

    // Click "Actions" button, the click "Delete"
    cy.contains('Actions').click({ force: true });
    cy.contains('Delete').click({ force: true });
  });
});
