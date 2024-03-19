const baseUrl = "https://www.w3.org/WAI/WCAG21/Techniques/";
const defaultGuideLink = "https://www.w3.org/TR/WCAG20/";

const techniqueTypeFull = {
  ARIA: "aria",
  SCR: "client-side-script",
  C: "css",
  F: "failures",
  G: "general",
  H: "html",
  PDF: "pdf",
  SVR: "server-side-script",
  SL: "silverlight",
  SM: "smil",
  T: "text",
};

function mapIssuesWithGuideLink(issues) {
  return issues.map((issue) => {
    const parts = issue.code.split("_").pop();
    const secondPards = parts.split(".");
    secondPards.shift();
    const codes = secondPards.join(".").split(",");
    let guideLinks = [];
    if (!codes[0]) {
      return { ...issue, guideLinks: [defaultGuideLink] };
    }
    guideLinks = codes.map((code) => {
      const techniqueType = code.match(/[A-Z]+/)[0];
      const techniqueNumber = code.match(/[0-9]+/)[0];
      return `${baseUrl}${techniqueTypeFull[techniqueType]}/${techniqueType}${techniqueNumber}`;
    });
    return { ...issue, guideLinks };
  });
}

function countIssuesByType(issues) {
  const count = {
    error: 0,
    warning: 0,
    notice: 0,
  };
  issues.forEach((issue) => {
    count[issue.type]++;
  });
  return count;
}

function isAccessible(issues) {
  const uniqueCodes = new Set(issues.map((issue) => issue.code));
  return {
    accessible: uniqueCodes.size <= 8,
    countAprovedIssues: 38 - uniqueCodes.size,
  };
}

const defaultErrorResponse = (textError, url) => {
  return {
    data: { documentTitle: "", pageUrl: url, issues: [] },
    ok: false,
    issueCountByType: { error: 0, warning: 0, notice: 0 },
    accessible: false,
    countAprovedIssues: 0,
    error: textError,
  };
};

const successResponse = (pa11yResponse, url) => {
  const issues = pa11yResponse.issues;
  const mappedIssues = mapIssuesWithGuideLink(issues);
  const issueCountByType = countIssuesByType(issues);
  const errorIssues = issues.filter((issue) => issue.typeCode === 1);
  const { countAprovedIssues, accessible } = isAccessible(errorIssues);

  return {
    data: { ...pa11yResponse, issues: mappedIssues, pageUrl: url },
    ok: true,
    issueCountByType,
    accessible,
    countAprovedIssues,
  };
};

const errorResponse = (error, url) => {
  console.log(error);
  if (error.message.includes("timed out")) {
    return {
      ...defaultErrorResponse(
        "El análisis de la página ha tardado demasiado tiempo. Por favor, intente mas tarde.",
        url
      ),
    };
  } else if (error.name === "TypeError") {
    return {
      ...defaultErrorResponse(
        `Error al parsear la URL ${url}, pruebe escribiendo http:// adelante`,
        url
      ),
    };
  } else if (error.message.includes("net::ERR_NAME_NOT_RESOLVED")) {
    return {
      ...defaultErrorResponse(`No se encuentra la URL: ${url}`, url),
    };
  } else {
    return {
      ...defaultErrorResponse(
        "Error durante el análisis de la página. Por favor, intente mas tarde",
        url
      ),
    };
  }
};

export { successResponse, errorResponse };
