// src/api/client.js
import axios from "axios";
import { API_PATHS } from "../constants/config";
import { getToken, removeToken } from "../utils/storage";

/**
 * IMPORTANTÍSSIMO:
 * Defina EXPO_PUBLIC_API_URL no .env do app, ex:
 *   EXPO_PUBLIC_API_URL=https://xxxxx.trycloudflare.com
 * Isso evita localhost/IP de LAN quando o tester está fora da sua rede.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  // Ajuda a detectar configuração ausente em dev
  console.warn(
    "[API] EXPO_PUBLIC_API_URL não definido. Configure no .env do app (ex: https://xxxxx.trycloudflare.com)"
  );
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error?.response?.status === 401) {
      try { await removeToken(); } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;

const onlyDigits = (s = "") => String(s).replace(/\D+/g, "");

export function loginRequest(userInput, senha) {
  const isEmail = /\S+@\S+\.\S+/.test(userInput);
  const identificador = isEmail
    ? String(userInput).trim().toLowerCase()
    : onlyDigits(userInput);
  return api.post(API_PATHS.login, { identificador, senha });
}

//  Cadastro com verificação (envio e validação)
export function sendEmailCode(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const { nome, cpf, email, senha, numero } = data;
    const body = {
      ...(nome ? { nome: String(nome).trim() } : {}),
      ...(cpf ? { cpf: onlyDigits(cpf) } : {}),
      email: String(email).trim().toLowerCase(),
      ...(senha ? { senha: String(senha) } : {}),
      ...(numero ? { numero: onlyDigits(numero) } : {}),
    };
    return api.post(API_PATHS.registerStart, body);
  }
  const email = String(data || "").trim().toLowerCase();
  return api.post(API_PATHS.registerStart, { email });
}

export function verifyEmailCode(email, codigo) {
  return api.post(API_PATHS.registerConfirm, {
    email: String(email).trim().toLowerCase(),
    codigo: String(codigo).replace(/\D/g, "").slice(0, 6),
  });
}

export function registerLegacy({ nome, cpf, email, senha, numero }) {
  return api.post(API_PATHS.registerLegacy, {
    nome: String(nome).trim(),
    cpf: onlyDigits(cpf),
    email: String(email).trim().toLowerCase(),
    senha: String(senha),
    numero: onlyDigits(numero),
  });
}

export const forgotStart  = (email) => api.post(API_PATHS.forgotStart,  { email: String(email).trim().toLowerCase() });
export const forgotVerify = (email, codigo) => api.post(API_PATHS.forgotVerify, { email: String(email).trim().toLowerCase(), codigo: String(codigo).replace(/\D/g, "").slice(0, 6) });
export const forgotReset  = (token, novaSenha) => api.post(API_PATHS.forgotReset, { token, nova_senha: String(novaSenha) });
