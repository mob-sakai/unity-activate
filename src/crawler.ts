import puppeteer, { Page, ElementHandle, ClickOptions, Response } from 'puppeteer';
import { getLogger } from "log4js";
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const logger = getLogger();

export abstract class Crawler {
    headless: boolean = false;
    page!: Page;
    tmpDir: string = "";
    downloadDir: string = "";
    hasError: boolean = false;

    constructor(headless: boolean, downloadDir: string) {
        Object.assign(this, { headless, downloadDir });
        logger.level = headless ? "off" : "debug";
    }

    async run(): Promise<void> {
        logger.debug(`Run crawler: headless=${this.headless}`);

        const browser = await puppeteer.launch(
            {
                headless: this.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }
        );

        this.page = (await browser.pages())[0];
        this.tmpDir = path.join(os.tmpdir(), Math.random().toString(32).substring(2));
        fs.mkdirSync(this.tmpDir);

        const client = await this.page.target().createCDPSession()
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: this.tmpDir,
        });

        try {
            logger.debug(`Start crawl`);
            await this.crawl();
        }
        catch (e) {
            throw e;
        }
        finally {
            await browser.close();
        }
    }

    debug(message: any, ...args: any[]): void {
        logger.debug(message, ...args);
    }

    async goto(url: string): Promise<Response | null> {
        logger.debug(`goto: ${url}`);

        return await this.page.goto(url);
    }

    async waitForNavigation(): Promise<void> {
        logger.debug(`waitForNavigation`);

        await this.page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    }

    async exists(selector: string): Promise<boolean> {
        logger.debug(`exists: ${selector}`);

        try {
            await this.page.waitForSelector(selector, { timeout: 2000 });
            logger.debug(`  -> true`);
            return true;
        } catch (e) {
            logger.debug(`  -> false`);
            return false;
        }
    };

    async click(selector: string, options?: ClickOptions): Promise<void> {
        logger.debug(`click: ${selector}`);

        return await this.page.click(selector, options);
    }

    async type(selector: string, text: string, options?: { delay: number }): Promise<void> {
        logger.debug(`type: ${selector} => ${text}`);

        return await this.page.type(selector, text, options);
    }

    readUserInput(question: string, password: boolean = false, timeout: number = 5 * 60 * 1000): Promise<string> {
        logger.debug(`readUserInput: ${question}, password=${password}, timeout=${timeout}`);

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

    async waitForTimeout(milliseconds: number): Promise<void> {
        logger.debug(`waitForTimeout: ${milliseconds}`);

        return await this.page.waitForTimeout(milliseconds);
    }

    async waitForSelector(selector: string): Promise<ElementHandle> {
        logger.debug(`waitForSelector: ${selector}`);

        return await this.page.waitForSelector(selector, { timeout: 2000 });
    }

    async waitAndClick(selector: string): Promise<void> {
        logger.debug(`waitAndClick: ${selector}`);

        await this.page.waitForSelector(selector, { timeout: 2000 });
        await this.page.evaluate(s => document.querySelector(s).click(), selector);
    }

    async waitForDownload(timeout: number = 5000): Promise<string | undefined> {
        logger.debug(`waitForDownload: timeout=${timeout}`);

        let elapsed = 0;
        let downloadFile: string;
        do {
            await new Promise(r => setTimeout(r, 100));
            elapsed += 100;
            downloadFile = fs.readdirSync(this.tmpDir)[0]
        } while (elapsed < timeout && (!downloadFile || downloadFile.endsWith('.crdownload')))

        if (!downloadFile) return undefined;

        // create download dir
        if (!fs.existsSync(this.downloadDir) || !fs.statSync(this.downloadDir).isDirectory())
            fs.mkdirSync(this.downloadDir, { recursive: true });

        // move to download path
        const downloadPath = path.resolve(this.downloadDir, downloadFile);
        fs.copyFileSync(
            path.resolve(this.tmpDir, downloadFile),
            downloadPath
        );
        return downloadPath;
    }

    protected abstract crawl(): any;
}
