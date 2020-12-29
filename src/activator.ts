import { Browser, Page } from 'puppeteer';
import { Crawler } from './crawler';
import fs from 'fs';

export interface ActivatorOptions {
    debug: boolean;
    username: string;
    password: string;
    serial: string;
    file: string;
    out: string;
}

export class Activator extends Crawler {
    options: ActivatorOptions;

    constructor(options: ActivatorOptions) {
        super(!options.debug, options.out);
        this.options = options;
    }

    readUserInput(question: string, password: boolean = false, timeout: number = 5 * 60 * 1000): Promise<string> {
        return new Promise<string>(resolve => {
            // Timeout (5 minutes)
            setTimeout(_ => {
                console.log("timeout");
                resolve("");
            }, timeout);

            const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
            readline.stdoutMuted = password;
            readline.question(question, (answer: string) => {
                resolve(answer);
                readline.close();
            });

            readline._writeToOutput = (s: string) => readline.output.write(password && /\w/.test(s) ? "*" : s);
        });
    }

    protected async crawl(_: Browser, page: Page) {
        console.log(`Start activating '${this.options.file}'`);

        // [[ CHECK ]] Input file is not found.
        if (!fs.existsSync(this.options.file))
            throw new Error(`Input file '${this.options.file}' is not found.`);

        // Step: goto manual activation page
        console.log("  > goto manual activation page")
        await page.goto('https://license.unity3d.com/manual')
        await this.waitForNavigation();
        await page.waitForSelector('#new_conversations_create_session_form #conversations_create_session_form_password')

        // Step: enter the username and password
        console.log("  > enter the username and password")
        const username = this.options.username || await this.readUserInput("username: ");
        const password = this.options.password || await this.readUserInput("password: ", true);

        // [[ CHECK ]] The username is incorrect
        if (!/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(username))
            throw new Error(`The email is incorrect: ${username}`);

        // Step: type the username and password
        await page.type('input[type=email]', username);
        await page.type('input[type=password]', password);

        // Step: login
        console.log("  > login")
        await page.click('input[name="commit"]');
        await this.waitForNavigation();

        // [[ CHECK ]] The username and/or password are incorrect
        if (await this.exists('div[class="error-msg"]'))
            throw new Error(`The username and/or password are incorrect: ${username}`);

        // Step: enter two-factor authentication code if requested
        if (await this.exists('input[class=verify_code]')) {
            console.log("  > verify (two-factor authentication)")
            const code = await this.readUserInput("verify code: ");

            await page.type('input[class=verify_code]', code)
            await page.click('input[value="Verify"]')
            await this.waitForNavigation();

            // [[ CHECK ]] Verify code is invalid
            if (await this.exists('div[class="error-msg"]'))
                throw new Error('Verify code is invalid');
        }

        // Step: enter email verify code if requested
        if (await this.exists('input[class=req]')) {
            console.log("  > verify (email)")
            const code = await this.readUserInput("verify code: ");

            await page.type('input[class=req]', code)
            await page.click('input[value="Verify"]')
            await this.waitForNavigation();

            // [[ CHECK ]] Verify code is invalid
            if (await this.exists('div[class="error-msg"]'))
                throw new Error('Verify code is invalid');
        }

        // Step: upload alf file.
        console.log("  > upload alf file")
        await (await this.waitForSelector('input[name="licenseFile"]')).uploadFile(this.options.file)
        await page.click('input[name="commit"]')
        await this.waitForNavigation();

        // [[ CHECK ]] Not valid for Unity activation license file
        if (! await this.exists('input[id="type_personal"][value="personal"]'))
            throw new Error(`'${this.options.file}' is not valid for Unity activation license file (*.alf)`);

        // Step: select license options
        console.log("  > select license options")
        if (0 < this.options.serial.length) {
            await this.waitAndClick('input[id="type_serial"][value="serial"]');
            await page.type('input[id="serial"][name="serial"]', this.options.serial);
            await this.waitAndClick('input[value="Next"][name="commit"][class="btn"]')

            // [[ CHECK ]] Invalid serial
            if (await this.exists('div[class="notification notification-alert"]'))
                throw new Error('Invalid serial');
        } else {
            await this.waitAndClick('input[id="type_personal"][value="personal"]');
            await this.waitAndClick('input[id="option3"][name="personal_capacity"]');
            await this.waitAndClick('input[class="btn mb10"]')
        }

        // Step: download ulf
        console.log("  > download ulf")
        await page.waitForTimeout(500);
        await this.waitAndClick('input[name="commit"]');
        const ulf = await this.waitForDownload();

        // [[ CHECK ]] Download failed
        if (!ulf)
            throw new Error("Download failed");

        console.log(`  > saved at '${ulf}'`);
    }
}