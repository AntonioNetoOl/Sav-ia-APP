// src/api/menuClient.js
import api from "./client";
import { API_PATHS } from "../constants/config";

export const getMe = () => api.get(API_PATHS.me);
export const getMePayments = () => api.get(API_PATHS.mePayments);
export const getMePaymentCards = () => api.get(API_PATHS.mePaymentCards);
export const getMeBenefits = () => api.get(API_PATHS.meBenefits);
