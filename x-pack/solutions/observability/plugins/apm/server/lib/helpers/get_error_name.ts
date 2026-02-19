/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Exception } from '@kbn/apm-types';
import type { FlattenedApmEvent } from '@kbn/apm-data-access-plugin/server/utils/utility_types';
import type { ProxiedApmEvent } from '@kbn/apm-data-access-plugin/server/utils/access_known_fields';
import { getErrorMessageFieldWithFallbacks } from '@kbn/discover-utils';
import { NOT_AVAILABLE_LABEL } from '../../../common/i18n';

export function getErrorName<T extends ProxiedApmEvent<Partial<FlattenedApmEvent>>>(
  event: T,
  exception: Exception
): string {
  const { value: errorMessage } = getErrorMessageFieldWithFallbacks({
    ...event,
    'exception.message': exception?.message || event['exception.message'],
  });

  return errorMessage || NOT_AVAILABLE_LABEL;
}
