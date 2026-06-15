// src/api/memberClient.js
import { api } from "./client";
import { API_PATHS } from "../constants/config";

export function getMemberSummary() {
  return api.get(API_PATHS.memberSummary);
}
