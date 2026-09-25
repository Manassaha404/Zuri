import AuthServices from "@repo/services/auth";
import OauthService from "@repo/services/oAuth";
import EmailService from "@repo/services/email";

export const emailServices = new EmailService();
export const authService = new AuthServices();
export const oAuthService = new OauthService();


