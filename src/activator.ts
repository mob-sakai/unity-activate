import { authenticator } from 'otplib';
import { Crawler } from './crawler';
import fs from 'fs';
import { ElementHandle } from 'puppeteer';

export interface ActivatorOptions {
    debug: boolean;
    headful: boolean;
    username: string;
    password: string;
    key: string;
    serial: string;
    file: string;
    out: string;
}

export class Activator extends Crawler {
    options: ActivatorOptions;

    constructor(options: ActivatorOptions) {
        super(options.debug, !options.headful, options.out);
        this.options = options;
        this.debug(`options:`, JSON.stringify(this.options));
    }

    protected async crawl() {
        console.log(`Start activating '${this.options.file}'`);

        // [[ CHECK ]] Input file is not found.
        if (!fs.existsSync(this.options.file))
            throw new Error(`Input file '${this.options.file}' is not found.`);

        // Step: goto manual activation page
        console.log("  > goto manual activation page")
        await this.goto('https://license.unity3d.com/manual')
        await this.waitForSelector('#new_conversations_create_session_form #conversations_create_session_form_password')

        // Step: enter the username and password
        const username = this.options.username || await this.readUserInput("username: ");
        const password = this.options.password || await this.readUserInput("password: ", true);

        // [[ CHECK ]] The username (email) is incorrect
        console.log("  > valid the username and password")
        if (!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(username))
            throw new Error(`The username (email) is incorrect: ${username}`);

        // Step: close cookie dialog
        console.log("  > close cookie dialog")
        if (await this.exists('#onetrust-close-btn-container > button'))
            await this.waitAndClick('#onetrust-close-btn-container > button');

        // Step: type the username and password
        console.log("  > enter the username and password")
        await this.type('input[type=email]', username);
        await this.type('input[type=password]', password);

        // Step: login
        console.log("  > login")
        await this.click('input[name="commit"]');

        // [[ CHECK ]] The email address has not been confirmed yet
        if (await this.exists('input[value="Re-send confirmation email"]')) {
            throw new Error(`The email address has not been confirmed yet: ${username}`);
        }

        // [[ CHECK ]] The username and/or password are incorrect
        if (await this.exists('div[class="error-msg"]'))
            throw new Error(`The username and/or password are incorrect: ${username}`);

        // Step: enter two-factor authentication code if requested
        if (await this.exists('input[class=verify_code]')) {
            console.log("  > verify (two-factor authentication)")
            const code = this.options.key
                ? authenticator.generate(this.options.key.replace(/ /g, ''))
                : await this.readUserInput("verify code (Check your authenticator app): ");

            await this.type('input[class=verify_code]', code)
            await this.click('input[value="Verify"]')

            // [[ CHECK ]] Verify code is invalid
            if (await this.exists('div[class="error-msg"]'))
                throw new Error('Verify code is invalid');
        }

        // Step: enter email verify code if requested
        if (await this.exists('input[class=req]')) {
            console.log("  > verify (email)")
            const code = await this.readUserInput(`verify code (Check your email: ${this.options.username}): `);

            await this.type('input[class=req]', code)
            await this.click('input[value="Verify"]')

            // [[ CHECK ]] Verify code is invalid
            if (await this.exists('div[class="error-msg"]'))
                throw new Error('Verify code is invalid');
        }

        // Step: close update dialog
        console.log("  > close update dialog")
        if (await this.exists('#new_conversations_accept_updated_tos_form button.novalidation.accept')) {
            await this.waitAndClick('#new_conversations_accept_updated_tos_form button.novalidation.accept');
        }

        // Step: upload alf file.
        console.log("  > upload alf file")
        const licenseFile = await this.waitForSelector('input[name="licenseFile"]');
        if (licenseFile === null)
            throw new Error(`'input[name="licenseFile"]' is not found`);

        const licenseElement = licenseFile as ElementHandle<HTMLInputElement>;
        await licenseElement.uploadFile(this.options.file)
        await this.click('input[name="commit"]')

        // [[ CHECK ]] Not valid for Unity activation license file
        if (! await this.exists('input[id="type_personal"][value="personal"]'))
            throw new Error(`'${this.options.file}' is not valid for Unity activation license file (*.alf)`);

        // Step: select license options
        console.log("  > select license options")
        if (0 < this.options.serial.length) {
            await this.waitAndClick('input[id="type_serial"][value="serial"]');
            await this.type('input[id="serial"][name="serial"]', this.options.serial);
            await this.waitAndClick('input[value="Next"][name="commit"][class="btn"]')

            // [[ CHECK ]] Invalid serial
            if (await this.exists('div[class="notification notification-alert"]'))
                throw new Error('Invalid serial');
        } else {
            await this.waitAndClick('input[id="type_personal"][value="personal"]');
            await this.waitAndClick('input[id="option3"][name="personal_capacity"]');
            await this.waitAndClick('input[name="commit"][class="btn mb10"][value="Next"]')
        }

        // Step: download ulf
        console.log("  > download ulf")
        await this.waitAndClick('input[name="commit"][class="btn mb10"][value="Download license file"]');
        const ulf = await this.waitForDownload(30000);

        // [[ CHECK ]] Download failed
        if (!ulf)
            throw new Error("Download failed");

        console.log(`  > saved at '${ulf}'`);
    }
}
