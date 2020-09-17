#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { CdkEc2Stack } from "../lib/cdk-ec2-stack";

const app = new cdk.App();
new CdkEc2Stack(app, "CdkEc2Stack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
