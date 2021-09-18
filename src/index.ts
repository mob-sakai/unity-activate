#!/usr/bin/env node

import { ActivatorOptions, Activator } from './activator';
import cac from 'cac';
import getPackageVersion from '@jsbits/get-package-version'

const cli = cac();
cli.command('[opts] <file>', 'Activate Unity activation license file (*.alf).\nNOTE: If two-factor authentication is enabled, the verify code will be requested.')
    .option('-o, --out <dir>', 'Output ulf file to the specified directory', { default: '.' })
    .option('-u, --username <username>', 'Username (email) to login Unity (default: $UNITY_USERNAME)')
    .option('-p, --password <password>', 'Password to login Unity (default: $UNITY_PASSWORD)')
    .option('-k, --key <key>', 'The authenticator key to login (default: $UNITY_KEY).')
    .option('-s, --serial <serial>', 'Serial key to activate. If empty, activate as personal license.\nNOTE: Unity Personal Edition is not available to companies or organizations that earned more than USD100,000 in the previous fiscal year.\n')
    .option('-d, --debug', 'Run "headful" puppeteer', { default: false })
    .action((file: string, __, options: ActivatorOptions) => (async () => {
        options.username ||= process.env.UNITY_USERNAME || '';
        options.password ||= process.env.UNITY_PASSWORD || '';
        options.key ||= process.env.UNITY_KEY || '';
        options.serial ||= process.env.UNITY_SERIAL || '';
        options.file = file;

        await new Activator(options).run()
            .then(_ => process.exit(0))
            .catch(e => {
                console.error(e.message);
                console.error('Run `unity-activate --help` to show help.');
                process.exit(1);
            });
    })());

cli.help()
    .version(getPackageVersion());

try {
    cli.parse();
} catch (e) {
    console.error(e.message)
    console.error('Run `unity-activate --help` to show help.')
    process.exit(1);
}
