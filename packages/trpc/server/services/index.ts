import AuthServices from "@repo/services/auth";
import OauthService from "@repo/services/oAuth";
import EmailService from "@repo/services/email";
import AgentService, { ToolService } from "@repo/services/agent";
export const emailServices = new EmailService();
export const authService = new AuthServices();
export const oAuthService = new OauthService();
export const agentService = new AgentService();
export const toolService = new ToolService();
