/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

jest.mock('./get_log_field_with_fallback', () => {
  const actual = jest.requireActual('./get_log_field_with_fallback');
  return {
    ...actual,
    getLogFieldWithFallback: jest.fn(actual.getLogFieldWithFallback),
  };
});

import { fieldConstants } from '..';
import { getErrorMessageFieldWithFallbacks } from './get_error_message_field_with_fallbacks';
import { getLogFieldWithFallback } from './get_log_field_with_fallback';

const allErrorFields = [
  fieldConstants.ERROR_LOG_MESSAGE_FIELD,
  fieldConstants.ERROR_MESSAGE_FIELD,
  fieldConstants.EXCEPTION_MESSAGE_FIELD,
  fieldConstants.ERROR_EXCEPTION_MESSAGE,
  fieldConstants.OTEL_ATTRIBUTES_EXCEPTION_MESSAGE,
] as const;

type ErrorField = (typeof allErrorFields)[number];

const buildDoc = (opts: { excludedFields: ErrorField[] } = { excludedFields: [] }) => {
  const { excludedFields } = opts;

  const doc: Partial<Record<ErrorField, string>> = {
    [fieldConstants.ERROR_LOG_MESSAGE_FIELD]: 'error log message',
    [fieldConstants.ERROR_MESSAGE_FIELD]: 'error message',
    [fieldConstants.EXCEPTION_MESSAGE_FIELD]: 'exception message',
    [fieldConstants.ERROR_EXCEPTION_MESSAGE]: 'error exception message',
    [fieldConstants.OTEL_ATTRIBUTES_EXCEPTION_MESSAGE]: 'otel attributes exception message',
  };

  for (const field of excludedFields) {
    delete doc[field];
  }

  return doc;
};

describe('getErrorMessageFieldWithFallbacks', () => {
  let mockedGetLogFieldWithFallback: jest.Mock;

  beforeEach(() => {
    mockedGetLogFieldWithFallback = getLogFieldWithFallback as jest.Mock;
    mockedGetLogFieldWithFallback.mockClear();
  });

  it('should return error.log.message when all fields are present', () => {
    const doc = buildDoc();

    const result = getErrorMessageFieldWithFallbacks(doc);
    expect(result).toEqual({
      field: 'error.log.message',
      value: 'error log message',
    });
  });

  it('should return error.message when error.log.message is absent', () => {
    const doc = buildDoc({ excludedFields: [fieldConstants.ERROR_LOG_MESSAGE_FIELD] });

    const result = getErrorMessageFieldWithFallbacks(doc);
    expect(result).toEqual({
      field: 'error.message',
      value: 'error message',
    });
  });

  it('should return exception.message when error.log.message and error.message are absent', () => {
    const doc = buildDoc({
      excludedFields: [fieldConstants.ERROR_LOG_MESSAGE_FIELD, fieldConstants.ERROR_MESSAGE_FIELD],
    });

    const result = getErrorMessageFieldWithFallbacks(doc);
    expect(result).toEqual({
      field: 'exception.message',
      value: 'exception message',
    });
  });

  it('should return error.exception.message when the three higher priority fields are absent', () => {
    const doc = buildDoc({
      excludedFields: [
        fieldConstants.ERROR_LOG_MESSAGE_FIELD,
        fieldConstants.ERROR_MESSAGE_FIELD,
        fieldConstants.EXCEPTION_MESSAGE_FIELD,
        // attributes.exception.message must also be excluded: the exception.message lookup falls
        // back to it via the OTel attributes prefix, so keeping it would prevent error.exception.message from winning
        fieldConstants.OTEL_ATTRIBUTES_EXCEPTION_MESSAGE,
      ],
    });

    const result = getErrorMessageFieldWithFallbacks(doc);
    expect(result).toEqual({
      field: 'error.exception.message',
      value: 'error exception message',
    });
  });

  it('should resolve exception.message lookup to attributes.exception.message via OTel attributes prefix fallback', () => {
    // The field lookup for exception.message automatically probes attributes.exception.message
    // as an OTel fallback. When exception.message is absent but attributes.exception.message is
    // present, that OTel fallback wins over the lower-ranked error.exception.message.
    const doc = buildDoc({
      excludedFields: [
        fieldConstants.ERROR_LOG_MESSAGE_FIELD,
        fieldConstants.ERROR_MESSAGE_FIELD,
        fieldConstants.EXCEPTION_MESSAGE_FIELD,
      ],
    });

    const result = getErrorMessageFieldWithFallbacks(doc);
    expect(result).toEqual({
      field: 'attributes.exception.message',
      value: 'otel attributes exception message',
    });
  });

  it('should return attributes.exception.message when all higher priority fields are absent', () => {
    const doc = buildDoc({
      excludedFields: [
        fieldConstants.ERROR_LOG_MESSAGE_FIELD,
        fieldConstants.ERROR_MESSAGE_FIELD,
        fieldConstants.EXCEPTION_MESSAGE_FIELD,
        fieldConstants.ERROR_EXCEPTION_MESSAGE,
      ],
    });

    const result = getErrorMessageFieldWithFallbacks(doc);
    expect(result).toEqual({
      field: 'attributes.exception.message',
      value: 'otel attributes exception message',
    });
  });

  it('should return undefined field when no error message fields are present', () => {
    const doc = buildDoc({
      excludedFields: [
        fieldConstants.ERROR_LOG_MESSAGE_FIELD,
        fieldConstants.ERROR_MESSAGE_FIELD,
        fieldConstants.EXCEPTION_MESSAGE_FIELD,
        fieldConstants.ERROR_EXCEPTION_MESSAGE,
        fieldConstants.OTEL_ATTRIBUTES_EXCEPTION_MESSAGE,
      ],
    });

    const result = getErrorMessageFieldWithFallbacks(doc);
    expect(result).toEqual({
      field: undefined,
      value: undefined,
    });
  });

  it('should forward includeFormattedValue option', () => {
    const doc = buildDoc();
    getErrorMessageFieldWithFallbacks(doc, { includeFormattedValue: true });

    expect(mockedGetLogFieldWithFallback).toHaveBeenCalledTimes(1);
    expect(mockedGetLogFieldWithFallback).toHaveBeenCalledWith(
      doc,
      expect.any(Array),
      expect.objectContaining({ includeFormattedValue: true })
    );
  });

  it('should not includeFormattedValue by default', () => {
    const doc = buildDoc();
    getErrorMessageFieldWithFallbacks(doc);

    expect(mockedGetLogFieldWithFallback).toHaveBeenCalledTimes(1);
    expect(mockedGetLogFieldWithFallback).toHaveBeenCalledWith(
      doc,
      expect.any(Array),
      expect.objectContaining({ includeFormattedValue: false })
    );
  });
});
