import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export abstract class Crawler {
    headless: boolean = false;
    page!: Page;
    tmpDir: string = "";
    downloadDir: string = "";
    hasError: boolean = false;

    constructor(headless: boolean, downloadDir: string) {
        Object.assign(this, { headless, downloadDir });
    }

    async run(): Promise<void> {
        const browser = await puppeteer.launch(
            {
                headless: this.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            }
        );

        this.page = (await browser.pages())[0]
        // this.page = await browser.newPage();

        this.tmpDir = path.join(os.tmpdir(), Math.random().toString(32).substring(2));
        fs.mkdirSync(this.tmpDir)

        const client = await this.page.target().createCDPSession()
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: this.tmpDir,
        })

        try {
            await this.crawl(browser, this.page);
        }
        catch (e) {
            throw e;
        }
        finally {
            await browser.close();
        }
    }

    async waitForNavigation(): Promise<void> {
        await this.page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    }

    async exists(selector: string): Promise<boolean> {
        try {
            await this.page.waitForSelector(selector, { timeout: 2000 })
            return true;
        } catch (e) {
            return false;
        }
    };

    async waitForSelector(selector: string): Promise<ElementHandle> {
        return await this.page.waitForSelector(selector, { timeout: 2000 })
    }

    async waitAndClick(selector: string): Promise<void> {
        await this.page.waitForSelector(selector, { timeout: 2000 })
        await this.page.evaluate(s => document.querySelector(s).click(), selector)
    }

    async waitForDownload(timeout: number = 5000): Promise<string | undefined> {
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

    protected abstract crawl(browser: Browser, page: Page): any;
}
