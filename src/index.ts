#!/usr/bin/env node

import { ActivatorOptions, Activator } from './activator';
import { CAC } from 'cac';
import getPackageVersion from '@jsbits/get-package-version'

const cli = new CAC();
cli.command('[opts] <file>', 'Activate Unity activation license file (*.alf).\nNOTE: If two-factor authentication is enabled, the verify code will be requested.')
    .option('-o, --out <dir>', 'Output ulf file to the specified directory', { default: '.' })
    .option('-u, --username <username>', 'Username (email) to login Unity (default: $UNITY_USERNAME)')
    .option('-p, --password <password>', 'Password to login Unity (default: $UNITY_PASSWORD)')
    .option('-k, --key <key>', 'The authenticator key to login (default: $UNITY_KEY). For details, see https://github.com/mob-sakai/unity-activate#option-activate-with-authenticator-key')
    .option('-s, --serial <serial>', 'Serial key to activate (default: $UNITY_SERIAL). If empty, activate as personal license.\nNOTE: Unity Personal Edition is not available to companies or organizations that earned more than USD100,000 in the previous fiscal year.\n')
    .option('-d, --debug', 'Display additional log and dump content to \'error.html\' on error', { default: false })
    .option('--headful', 'Run "headful" puppeteer', { default: false })
    .action((file: string, __, options: ActivatorOptions) => (async () => {
        options.username ||= process.env.UNITY_USERNAME || '';
        options.password ||= process.env.UNITY_PASSWORD || '';
        options.key ||= process.env.UNITY_KEY || '';
        options.serial ||= process.env.UNITY_SERIAL || '';
        options.file = file;

        // [[CHECK]] input file name
        if (!/(Unity_v.*.alf|\.ilf)/.test(file))
        {
            console.error(`Input activation license file should be named Unity_vX.alf or .ilf`);
            process.exit(1);
        }

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
} catch (e: any) {
    console.error(e.message)
    console.error('Run `unity-activate --help` to show help.')
    process.exit(1);
}
