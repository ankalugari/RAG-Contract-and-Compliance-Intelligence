export function normalizeMetadata(metadata = {}) {
  return {
    contractType: metadata.contractType || '',
    parties: Array.isArray(metadata.parties)
      ? metadata.parties
      : [],
    effectiveDate: metadata.effectiveDate || '',
    expirationDate: metadata.expirationDate || '',
    governingLaw: metadata.governingLaw || '',
    jurisdiction: metadata.jurisdiction || '',
    status: metadata.status || '',
    tags: Array.isArray(metadata.tags)
      ? metadata.tags
      : []
  };
}

export function normalizeFilters(filters = {}) {
  return {
    contractType: filters.contractType || '',
    party: filters.party || '',
    tag: filters.tag || '',
    governingLaw: filters.governingLaw || '',
    jurisdiction: filters.jurisdiction || '',
    status: filters.status || '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || ''
  };
}

export function matchesMetadata(metadata = {}, filters = {}) {
  const data = normalizeMetadata(metadata);
  const filter = normalizeFilters(filters);

  if (
    filter.contractType &&
    data.contractType.toLowerCase() !==
      filter.contractType.toLowerCase()
  ) {
    return false;
  }

  if (
    filter.party &&
    !data.parties.some((party) =>
      party.toLowerCase().includes(
        filter.party.toLowerCase()
      )
    )
  ) {
    return false;
  }

  if (
    filter.tag &&
    !data.tags.some((tag) =>
      tag.toLowerCase().includes(
        filter.tag.toLowerCase()
      )
    )
  ) {
    return false;
  }

  if (
    filter.governingLaw &&
    !data.governingLaw
      .toLowerCase()
      .includes(filter.governingLaw.toLowerCase())
  ) {
    return false;
  }

  if (
    filter.jurisdiction &&
    !data.jurisdiction
      .toLowerCase()
      .includes(filter.jurisdiction.toLowerCase())
  ) {
    return false;
  }

  if (
    filter.status &&
    data.status.toLowerCase() !==
      filter.status.toLowerCase()
  ) {
    return false;
  }

  if (
    filter.dateFrom &&
    data.effectiveDate &&
    data.effectiveDate < filter.dateFrom
  ) {
    return false;
  }

  if (
    filter.dateTo &&
    data.expirationDate &&
    data.expirationDate > filter.dateTo
  ) {
    return false;
  }

  return true;
}
