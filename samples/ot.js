/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// sample-metadata:
//   title: Observability (Tracing) with OpenTelemetry
//   usage: node observability.js trace <INSTANCE> <DATABASE> <PROJECT-ID>

'use strict';

// Setup OpenTelemetry and the trace exporter.
// [START spanner_trace_and_export_spans]
const {Resource} = require('@opentelemetry/resources');
const {NodeSDK} = require('@opentelemetry/sdk-node');
const {
  NodeTracerProvider,
  TraceIdRatioBasedSampler,
  // eslint-disable-next-line n/no-extraneous-require
} = require('@opentelemetry/sdk-trace-node');
// eslint-disable-next-line n/no-extraneous-require
const {BatchSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  // eslint-disable-next-line n/no-extraneous-require
} = require('@opentelemetry/semantic-conventions');

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'spanner-sample',
    [SEMRESATTRS_SERVICE_VERSION]: 'v1.0.0', // The version of your app running.,
  })
);

// Create the Google Cloud Trace exporter for OpenTelemetry.
const {
  TraceExporter,
} = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const exporter = new TraceExporter();

async function main() {
  const provider = new NodeTracerProvider({resource: resource});
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();

  const {Spanner} = require('../build/src');
  const spanner = new Spanner({
    projectId: 'span-cloud-testing',
    // observabilityConfig: {
    //   tracerProvider: provider,
    //   enableExtendedTracing: true,
    // },
  });

  
  const instance = spanner.instance('alka-testing');
  const database = instance.database('db-1');

//   const rows = await database.runStream('SELECT 1');
//   console.log(rows);
    // console.log(`Query: ${query.sql} returned ${rows.length} rows.`);
    // rows.forEach(row => console.log(row));

    const query = {
        sql: 'SELECT SingerId, AlbumId, AlbumTitle FROM Albums',
      };

    const [rows] = await database.run(query);

    rows.forEach(row => {
        const json = row.toJSON();
        console.log(
        `SingerId: ${json.SingerId}, AlbumId: ${json.AlbumId}, AlbumTitle: ${json.AlbumTitle}`
        );
    });

    provider.forceFlush();

  // [END spanner_trace_and_export_spans]
}

process.on('unhandledRejection', err => {
    console.error(err.message);
    process.exitCode = 1;
  });
  main(...process.argv.slice(2));