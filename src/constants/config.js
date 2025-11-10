// src/constants/config.js
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
};
