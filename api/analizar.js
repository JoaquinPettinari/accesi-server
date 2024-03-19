import { StatusCodes } from "http-status-codes";
import { successResponse, errorResponse } from "../utils/pa11y.js";
import pa11y from "pa11y";

const defaultIncludes = {
  includeWarnings: true,
  includeNotices: true,
  timeout: 30000,
};

export const maxDuration = 300;

export default async (request, response) => {
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
    const pa11yResponse = await pa11y(url, {
      ...defaultIncludes,
      chromeLaunchConfig: {
        headless: "new",
      },
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
