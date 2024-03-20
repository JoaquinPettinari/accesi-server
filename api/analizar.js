import { StatusCodes } from "http-status-codes";
import { successResponse, errorResponse } from "../utils/pa11y.js";
import pa11y from "pa11y";
import chromium from "chrome-aws-lambda";

const defaultIncludes = {
  includeWarnings: true,
  includeNotices: true,
  timeout: 30000,
};

export const maxDuration = 300;

export default async (request, response) => {
  response.setHeader("Access-Control-Allow-Credentials", true);
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  response.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (request.method !== "POST") {
    return response.status(StatusCodes.BAD_REQUEST).send("");
  }

  const url = request?.body?.url;
  let successResponseData, browser, page;
  try {
    if (!url) {
      response.status(404).json({
        error: "Sin url",
      });
    }
    console.log("🧑‍🏭 Fetching...");
    const browser = await chromium.puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: "new",
      ignoreHTTPSErrors: true,
    });
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
    successResponseData = successResponse(pa11yResponse, url);

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
