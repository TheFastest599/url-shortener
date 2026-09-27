/**
 * Centralized Route Paths definition
 */
export const ROUTES = {
	HOME: "/",
	LOGIN: "/login",
	SIGNUP: "/signup",
	DASHBOARD: "/dashboard",
	REDIRECT_LINKS: "/redirect-links",
	LINKS: "/redirect-links", // alias
	REDIRECT_LINK_DETAIL: "/redirect-links/:id",
	ANALYTICS: "/analytics",
	ANALYTICS_DETAIL: "/analytics/:shortCode",
	CAMPAIGNS: "/campaigns",
	CAMPAIGN_DETAIL: "/campaigns/:id",
	AB_TESTING: "/ab-testing",
	AB_TEST_DETAIL: "/ab-testing/:id",
	PROFILE: "/profile",
	DOCS: "/docs",
	OAUTH_CALLBACK: "/oauth2/callback",
};

export default ROUTES;
