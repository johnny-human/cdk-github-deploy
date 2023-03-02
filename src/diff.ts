import * as core from '@actions/core'
import { runCommand } from './utils'

export type DiffConfiguration = {
    /**
     * REQUIRED WHEN RUNNING APP: command-line for executing
     * your app or a cloud assembly directory (e.g. "node
     * bin/my-app.js"). Can also be specified in cdk.json or
     * ~/.cdk.json
     */
    app?: string
    /**
     * Define an environment that the CDK Stacks will use
     * Will set the `ENVIRONMENT` so it will be available in typescript cdk by `process.env.ENVIRONMENT`
     */
    environment?: string
}

export const diff = async (config: DiffConfiguration) => {
    let stackNames: string[] = [];
    const stackStatus: any = {};
    const environment = config.environment
        ? `ENVIRONMENT=${config.environment}`
        : ''

        const checkStack= async (name: string): Promise<boolean> => {
            try {
              await runCommand(`${environment} npx cdk diff ${name} --quiet`);
              return false; // No changes
            } catch (error: any) {
              if (error.message.includes('The CloudFormation template is invalid')) {
                // Ignore errors related to invalid CloudFormation templates
                return false; // No changes
              } else {
                // Assume changes if an error occurs
                return true; // Changes
              }
            }
          }

    try {
        const listResult = await runCommand(`${environment} npx cdk list`)
        stackNames = listResult.trim().split('\n');
        console.log(stackNames);
    } catch (error) {
        core.error(error as string)
    }

    for (const stackName of stackNames) {
        const changes = await checkStack(stackName)
        stackStatus[stackName] = changes;
    };
    
    console.log(stackStatus)
}
