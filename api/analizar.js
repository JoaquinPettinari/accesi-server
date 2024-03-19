import { StatusCodes } from "http-status-codes";
import { successResponse, errorResponse } from "../utils/pa11y.js";
import pa11y from "pa11y";
import edgeChromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

const defaultIncludes = {
  includeWarnings: true,
  includeNotices: true,
  timeout: 30000,
};

export const maxDuration = 300;

async function getBrowser() {
  return puppeteer.launch({
    args: [...edgeChromium.args, "--hide-scrollbars", "--disable-web-security"],
    defaultViewport: edgeChromium.defaultViewport,
    executablePath: await edgeChromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v116.0.0/chromium-v119.0.2-pack.tar`
    ),
    headless: edgeChromium.headless,
    ignoreHTTPSErrors: true,
  });
}

export default async (request, response) => {
  if (request.method !== "POST") {
    return response.status(StatusCodes.BAD_REQUEST).send("");
  }

  const url = request?.body?.url;
  const host = request?.hostname || process.env.VERCEL_URL || "localhost";
  let successResponseData, browser, page;
  try {
    if (!url) {
      response.status(404).json({
        error: "Sin url",
      });
    }
    console.log("🧑‍🏭 Fetching...");
    if (host.includes("localhost")) {
      const pa11yResponse = await pa11y(url, {
        ...defaultIncludes,
        chromeLaunchConfig: {
          headless: "new",
        },
      });
      successResponseData = successResponse(pa11yResponse, url);
    } else {
      browser = await getBrowser();
      console.log("🧑‍🏭 Get browser");
      page = await browser.newPage();
      console.log("🧑‍🏭 New page");
      await page.goto(url);
      console.log("🧑‍🏭 Go to new page");

      const pa11yResponse = await pa11y(url, {
        ignoreUrl: true,
        ...defaultIncludes,
        browser: browser,
        page: page,
      });
      console.log("🧑‍🏭 Success pa11y");
      successResponseData = successResponse(pa11yResponse, url);
    }
    console.log("✅ Fetch success ");
    response.status(StatusCodes.OK).json(successResponseData);
  } catch (error) {
    const errorData = errorResponse(error, url);
    response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorData);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
};
