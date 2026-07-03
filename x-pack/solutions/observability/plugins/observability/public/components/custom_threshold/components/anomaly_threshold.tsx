/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiStat } from '@elastic/eui';
import { i18n } from '@kbn/i18n';

export interface AnomalyThresholdProps {
  id: string;
  severity: string;
  severityThreshold: string;
}

export function AnomalyThreshold({ id, severity, severityThreshold }: AnomalyThresholdProps) {
  const title = (
    <EuiFlexGroup gutterSize="s" alignItems="center">
      <EuiFlexItem grow={false}>
        <EuiIcon type="warning" color="danger" aria-hidden={true} />
      </EuiFlexItem>
      <EuiFlexItem>
        {i18n.translate('xpack.observability.anomalyThreshold.apmAnomalyDetectedFlexItemLabel', {
          defaultMessage: 'APM Anomaly detected · Throughput',
        })}
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiStat
          title={severity}
          description={severityThreshold}
          titleElement="span"
          titleSize="s"
          reverse
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
  return (
    <EuiCallOut title={title} data-test-subj={`anomaly-threshold-${id}`} color="danger">
      {/* <EuiStat title={severity} description={severityThreshold} titleElement="span" reverse /> */}
    </EuiCallOut>
  );
}
