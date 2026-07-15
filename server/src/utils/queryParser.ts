export const parseString = (queryValue: any): string => {
  if (Array.isArray(queryValue)) {
    return String(queryValue[0] || '');
  }
  return queryValue ? String(queryValue) : '';
};

export const parseOptionalString = (queryValue: any): string | undefined => {
  if (queryValue === undefined || queryValue === null) {
    return undefined;
  }
  if (Array.isArray(queryValue)) {
    return queryValue[0] ? String(queryValue[0]) : undefined;
  }
  const str = String(queryValue);
  return str.trim() === '' ? undefined : str;
};

export const parseNumber = (queryValue: any, defaultValue: number): number => {
  if (queryValue === undefined || queryValue === null) {
    return defaultValue;
  }
  let strVal = '';
  if (Array.isArray(queryValue)) {
    strVal = String(queryValue[0] || '');
  } else {
    strVal = String(queryValue);
  }
  
  const parsed = parseInt(strVal, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};
