import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeMetadata,
  normalizeFilters,
  matchesMetadata
} from './metadata.js';

test('normalizeMetadata returns correct default values', () => {
  const result = normalizeMetadata();

  assert.deepEqual(result, {
    contractType: '',
    parties: [],
    effectiveDate: '',
    expirationDate: '',
    governingLaw: '',
    jurisdiction: '',
    status: '',
    tags: []
  });
});

test('normalizeMetadata keeps contract metadata', () => {
  const result = normalizeMetadata({
    contractType: 'NDA',
    parties: ['ABC Company'],
    effectiveDate: '2026-01-01',
    expirationDate: '2027-01-01',
    governingLaw: 'India',
    jurisdiction: 'Bangalore',
    status: 'Active',
    tags: ['Confidential']
  });

  assert.equal(result.contractType, 'NDA');
  assert.equal(result.parties[0], 'ABC Company');
  assert.equal(result.governingLaw, 'India');
  assert.equal(result.status, 'Active');
});

test('normalizeFilters returns correct filter values', () => {
  const result = normalizeFilters({
    contractType: 'NDA',
    party: 'ABC',
    tag: 'Confidential',
    governingLaw: 'India',
    jurisdiction: 'Bangalore',
    status: 'Active',
    dateFrom: '2026-01-01',
    dateTo: '2027-01-01'
  });

  assert.equal(result.contractType, 'NDA');
  assert.equal(result.party, 'ABC');
  assert.equal(result.tag, 'Confidential');
  assert.equal(result.status, 'Active');
});

test('matchesMetadata returns true when filters match', () => {
  const metadata = {
    contractType: 'NDA',
    parties: ['ABC Company'],
    effectiveDate: '2026-01-01',
    expirationDate: '2027-01-01',
    governingLaw: 'India',
    jurisdiction: 'Bangalore',
    status: 'Active',
    tags: ['Confidential']
  };

  const filters = {
    contractType: 'NDA',
    party: 'ABC',
    status: 'Active'
  };

  assert.equal(
    matchesMetadata(metadata, filters),
    true
  );
});

test('matchesMetadata returns false when contract type does not match', () => {
  const metadata = {
    contractType: 'Employment Agreement',
    parties: ['ABC Company'],
    status: 'Active',
    tags: []
  };

  const filters = {
    contractType: 'NDA'
  };

  assert.equal(
    matchesMetadata(metadata, filters),
    false
  );
});

test('matchesMetadata returns false when party does not match', () => {
  const metadata = {
    contractType: 'NDA',
    parties: ['ABC Company'],
    status: 'Active',
    tags: []
  };

  const filters = {
    party: 'XYZ Company'
  };

  assert.equal(
    matchesMetadata(metadata, filters),
    false
  );
});

test('matchesMetadata returns false when status does not match', () => {
  const metadata = {
    contractType: 'NDA',
    parties: ['ABC Company'],
    status: 'Expired',
    tags: []
  };

  const filters = {
    status: 'Active'
  };

  assert.equal(
    matchesMetadata(metadata, filters),
    false
  );
});

test('matchesMetadata matches tags', () => {
  const metadata = {
    contractType: 'NDA',
    parties: [],
    status: 'Active',
    tags: ['Confidential', 'Legal']
  };

  const filters = {
    tag: 'Confidential'
  };

  assert.equal(
    matchesMetadata(metadata, filters),
    true
  );
});

test('matchesMetadata matches date range', () => {
  const metadata = {
    contractType: 'NDA',
    parties: [],
    effectiveDate: '2026-01-01',
    expirationDate: '2027-01-01',
    status: 'Active',
    tags: []
  };

  const filters = {
    dateFrom: '2025-01-01',
    dateTo: '2028-01-01'
  };

  assert.equal(
    matchesMetadata(metadata, filters),
    true
  );
});
