/**
 * Copyright 2023 Google LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// [START spanner_create_instance_with_autoscaling_config]

'use strict';

async function createInstanceWithAutoscalingConfig(instanceID, projectID) {
  // Imports the Google Cloud client library
  const {protos} = require('@google-cloud/spanner');
  const {InstanceAdminClient} = require('@google-cloud/spanner/build/src/v1');

  // creates an instance admin client
  const instanceAdminClient = new InstanceAdminClient({
    projectId: projectID,
  });
  
  const autoscalingConfig =
    protos.google.spanner.admin.instance.v1.AutoscalingConfig.create({
      // Only one of minNodes/maxNodes or minProcessingUnits/maxProcessingUnits
      // can be set. Both min and max need to be set and
      // maxNodes/maxProcessingUnits can be at most 10X of
      // minNodes/minProcessingUnits.
      autoscalingLimits:
        protos.google.spanner.admin.instance.v1.AutoscalingConfig.AutoscalingLimits.create(
          {
            minNodes: 1,
            maxNodes: 2,
          }
        ),
      // highPriorityCpuUtilizationPercent and storageUtilizationPercent are both
      // percentages and must lie between 0 and 100.
      autoscalingTargets:
        protos.google.spanner.admin.instance.v1.AutoscalingConfig.AutoscalingTargets.create(
          {
            highPriorityCpuUtilizationPercent: 65,
            storageUtilizationPercent: 95,
          }
        ),
    });
  // Creates a new instance with autoscalingConfig
  try {
    const [operation] = await instanceAdminClient.createInstance({
      instanceId: instanceID,
      instance: {
        config: instanceAdminClient.instanceConfigPath(
          projectID,
          'regional-us-central1'
        ),
        displayName: 'Display name for the instance.',
        autoscalingConfig: autoscalingConfig,
      },
      parent: instanceAdminClient.projectPath(projectID),
    });

    console.log(`Waiting for operation on ${instanceID} to complete...`);
    await operation.promise();
    console.log(`Created instance ${instanceID}.`);
    const [metadata] = await instanceAdminClient.getInstance({
      name: instanceAdminClient.instancePath(
        projectID,
        instanceID,
      ),
    });
    console.log(
        `Autoscaling configurations of ${instanceID} are:  ` +
        '\n' +
        `Min nodes: ${metadata.autoscalingConfig.autoscalingLimits.minNodes} ` +
        'nodes.' +
        '\n' +
        `Max nodes: ${metadata.autoscalingConfig.autoscalingLimits.maxNodes}` +
        ' nodes.' +
        '\n' +
        `High priority cpu utilization percent: ${metadata.autoscalingConfig.autoscalingTargets.highPriorityCpuUtilizationPercent}.` +
        '\n' +
        `Storage utilization percent: ${metadata.autoscalingConfig.autoscalingTargets.storageUtilizationPercent}.`
    );
  } catch (err) {
    console.error('ERROR:', err);
  }
}

// createInstanceWithAutoscalingConfig("alka-autogen-instance-20", "span-cloud-testing");
module.exports.createInstanceWithAutoscalingConfig = createInstanceWithAutoscalingConfig;