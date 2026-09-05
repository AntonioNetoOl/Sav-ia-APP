// src/constants/config.js
export const TOKEN_FIELD = "token";

export const API_PATHS = {
  login: "/api/usuarios/login",

  registerStart:   "/api/usuarios/confirmacao/enviar",
  registerConfirm: "/api/usuarios/confirmacao/validar",

  registerLegacy: "/api/usuarios/cadastro",

  emailSendCode:  "/api/usuarios/confirmacao/enviar",
  emailVerifyCode:"/api/usuarios/confirmacao/validar",

  forgotStart:  "/api/usuarios/auth/forgot/start",
  forgotVerify: "/api/usuarios/auth/forgot/verify",
  forgotReset:  "/api/usuarios/auth/forgot/reset",

  me: "/api/me",
  mePayments: "/api/me/payments",
  mePaymentCards: "/api/me/payment-cards",
  meBenefits: "/api/me/benefits",
  memberSummary: "/api/member/summary",
  memberPlans: "/api/member/plans",
};