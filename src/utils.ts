import * as aws from 'aws-sdk'
import * as fs from 'fs'
import { Parameter } from 'aws-sdk/clients/cloudformation'
import * as child_process from 'child_process'

export function isUrl(s: string): boolean {
    let url

    try {
        url = new URL(s)
    } catch (_) {
        return false
    }

    return url.protocol === 'https:'
}

export function pickOption<T>(arr: T[], i: number): T | undefined {
    if (arr.length === 0) {
        return undefined
    }
    if (arr.length === 1) {
        return arr[0]
    }
    return arr[i]
}

/**
 * Parse multiline
 * We don't use core.getMultilineInput() because it filters out empty lines
 */
export function parseMultiline(str: string): string[] {
    if (str === undefined) {
        // some tests pass undefined instead of an empty string as core.getInput() would do
        return ['']
    }
    return str.split('\n')
}

export function parseTags(s: string): aws.CloudFormation.Tags | undefined {
    let json

    try {
        json = JSON.parse(s)
    } catch (_) {}

    return json
}

export function parseARNs(s: string): string[] | undefined {
    return s?.length > 0 ? s.split(',') : undefined
}

export function parseString(s: string): string | undefined {
    return s?.length > 0 ? s : undefined
}

export function parseNumber(s: string): number | undefined {
    return parseInt(s) || undefined
}

export function parseParameters(parameterOverrides: string): Parameter[] {
    if (parameterOverrides.startsWith('file://')) {
        const path = new URL(parameterOverrides)
        const rawParameters = fs.readFileSync(path, 'utf-8')
        return JSON.parse(rawParameters)
    } else {
        const parameters = new Map<string, string>()
        parameterOverrides.split(',').forEach(parameter => {
            const [key, value] = parameter.trim().split('=')
            let param = parameters.get(key)
            param = !param ? value : [param, value].join(',')
            parameters.set(key, param)
        })

        return [...parameters.keys()].map(key => {
            return {
                ParameterKey: key,
                ParameterValue: parameters.get(key)
            }
        })
    }
}

export async function runCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                resolve(stdout)
            }
        })
    })
}
