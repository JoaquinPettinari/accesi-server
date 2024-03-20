import { StatusCodes } from "http-status-codes";
import { successResponse, errorResponse } from "../utils/pa11y.js";
import pa11y from "pa11y";
import edgeChromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const defaultIncludes = {
  includeWarnings: true,
  includeNotices: true,
  timeout: 30000,
};

export const maxDuration = 300;

export default async (request, response) => {
  console.log(request.headers?.origin);
  const host = request?.hostname || process.env.VERCEL_URL || "localhost";
  response.setHeader("Access-Control-Allow-Credentials", true);
  response.setHeader("Access-Control-Allow-Origin", host);
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
  let successResponseData, browser, page, pa11yResponse;
  try {
    if (!url) {
      response.status(404).json({
        error: "Sin url",
      });
    }
    console.log("🧑‍🏭 Fetching...");
    if (host.includes("localhost")) {
      pa11yResponse = await pa11y(url, {
        ...defaultIncludes,
        chromeLaunchConfig: {
          headless: "new",
        },
      });
    } else {
      const executablePath = await edgeChromium.executablePath();
      browser = await puppeteer.launch({
        executablePath,
        args: [...edgeChromium.args, "--disable-extensions"],
        headless: true,
      });
      page = await browser.newPage();
      await page.goto(url);

      pa11yResponse = await pa11y(url, {
        ignoreUrl: true,
        ...defaultIncludes,
        browser: browser,
        page: page,
      });
    }
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
