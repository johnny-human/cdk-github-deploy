import * as core from '@actions/core'
import { parseTags, parseString, parseNumber, parseARNs } from './utils'

// we don't use core.getMultilineInput() because it filters out empty lines
function parseMultiline(str: string): string[] {
    if (str === undefined) {
        // some tests pass undefined instead of an empty string as core.getInput() would do
        return ['']
    }
    return str.split('\n')
}

export function getConfiguration(): any {
    const options: any = {}

    options.template = parseMultiline(
        core.getInput('template', { required: false })
    )

    options.stackName = parseMultiline(
        core.getInput('name', { required: true })
    )

    // if (options.template.length != options.stackName.length) {
    //     throw new Error('number of input lemplate lines must match name lines')
    // }

    options.capabilities = parseMultiline(
        core.getInput('capabilities', {
            required: false
        })
    )

    if (
        options.capabilities.length !== 1 &&
        options.capabilities.length != options.stackName.length
    ) {
        throw new Error(
            'number input capabilities lines must match name lines or must be a single line'
        )
    }

    options.parameterOverrides = parseMultiline(
        core.getInput('parameter-overrides', {
            required: false
        })
    )

    if (
        options.parameterOverrides.length !== 1 &&
        options.parameterOverrides.length != options.stackName.length
    ) {
        throw new Error(
            'number input parameter-overrides lines must match name lines or must be a single line'
        )
    }

    options.noEmptyChangeSet = parseMultiline(
        core.getInput('no-fail-on-empty-changeset', {
            required: false
        })
    ).map(x => !!+x)

    if (
        options.noEmptyChangeSet.length !== 1 &&
        options.noEmptyChangeSet.length != options.stackName.length
    ) {
        throw new Error(
            'number input no-fail-on-empty-changeset lines must match name lines or must be a single line'
        )
    }

    options.noExecuteChangeSet = parseMultiline(
        core.getInput('no-execute-changeset', {
            required: false
        })
    ).map(x => !!+x)

    if (
        options.noExecuteChangeSet.length !== 1 &&
        options.noExecuteChangeSet.length != options.stackName.length
    ) {
        throw new Error(
            'number input no-execute-changeset lines must match name lines or must be a single line'
        )
    }

    options.noDeleteFailedChangeSet = parseMultiline(
        core.getInput('no-delete-failed-changeset', {
            required: false
        })
    ).map(x => !!+x)

    if (
        options.noDeleteFailedChangeSet.length !== 1 &&
        options.noDeleteFailedChangeSet.length != options.stackName.length
    ) {
        throw new Error(
            'number input no-delete-failed-changeset lines must match name lines or must be a single line'
        )
    }

    options.disableRollback = parseMultiline(
        core.getInput('disable-rollback', {
            required: false
        })
    ).map(x => !!+x)

    if (
        options.disableRollback.length !== 1 &&
        options.disableRollback.length != options.stackName.length
    ) {
        throw new Error(
            'number input disable-rollback lines must match name lines or must be a single line'
        )
    }

    options.timeoutInMinutes = parseMultiline(
        core.getInput('timeout-in-minutes', {
            required: false
        })
    ).map(parseNumber)

    if (
        options.timeoutInMinutes.length !== 1 &&
        options.timeoutInMinutes.length != options.stackName.length
    ) {
        throw new Error(
            'number input timeout-in-minutes lines must match name lines or must be a single line'
        )
    }

    options.notificationARNs = parseMultiline(
        core.getInput('notification-arns', {
            required: false
        })
    ).map(parseARNs)

    if (
        options.notificationARNs.length !== 1 &&
        options.notificationARNs.length != options.stackName.length
    ) {
        throw new Error(
            'number input notification-arns lines must match name lines or must be a single line'
        )
    }

    options.roleARN = parseMultiline(
        core.getInput('role-arn', {
            required: false
        })
    ).map(parseString)

    if (
        options.roleARN.length !== 1 &&
        options.roleARN.length != options.stackName.length
    ) {
        throw new Error(
            'number input role-arn lines must match name lines or must be a single line'
        )
    }

    options.tags = parseMultiline(
        core.getInput('tags', {
            required: false
        })
    ).map(parseTags)

    if (
        options.tags.length !== 1 &&
        options.tags.length != options.stackName.length
    ) {
        throw new Error(
            'number input tags lines must match name lines or must be a single line'
        )
    }

    options.terminationProtection = parseMultiline(
        core.getInput('termination-protection', {
            required: false
        })
    ).map(x => !!+x)

    if (
        options.terminationProtection.length !== 1 &&
        options.terminationProtection.length != options.stackName.length
    ) {
        throw new Error(
            'number input termination-protection lines must match name lines or must be a single line'
        )
    }

    options.environment = core.getInput('environment', {
        required: true
    })

    const AWS_ACCESS_KEY_ID = core.getInput('aws-access-key-id')
    const AWS_SECRET_ACCESS_KEY = core.getInput('aws-secret-access-key')
    const AWS_REGION = core.getInput('aws-region')
    process.env['AWS_ACCESS_KEY_ID'] = AWS_ACCESS_KEY_ID
    process.env['AWS_SECRET_ACCESS_KEY'] = AWS_SECRET_ACCESS_KEY
    process.env['AWS_REGION'] = AWS_REGION

    return options
}
