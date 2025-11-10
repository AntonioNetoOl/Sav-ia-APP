export const onlyDigits  = (s = "") => s.replace(/\D+/g, "");
export const normSpaces  = (s = "") => s.replace(/\s+/g, " ").trim();

const RE_EMAIL   = /^\S+@\S+\.\S+$/;
const RE_CPF_G   = /^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/;
const RE_PHONE_G = /^(\d{0,2})(\d{0,5})(\d{0,4})$/;

export const formatCPF = (v = "") => {
  const d = onlyDigits(v).slice(0, 11);
  const m = d.match(RE_CPF_G);
  if (!m) return d;
  const [, a, b, c, d4] = m;
  return [a, b && `.${b}`, c && `.${c}`, d4 && `-${d4}`].filter(Boolean).join("");
};

export const formatPhone = (v = "") => {
  const d = onlyDigits(v).slice(0, 11);
  const m = d.match(RE_PHONE_G);
  if (!m) return d;
  const [, ddd, meio, fim] = m;
  return [
    ddd && `(${ddd}`,
    ddd && ddd.length === 2 ? ")" : "",
    meio ? ` ${meio}` : "",
    fim ? `-${fim}` : "",
  ].join("");
};

export const isValidEmail = (s = "") => RE_EMAIL.test((s || "").toLowerCase().trim());

export const isValidPhoneBR = (v = "") => {
  const d = onlyDigits(v);
  if (d.length !== 10 && d.length !== 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  return true;
};

export const isValidCPF = (v = "") => {
  const d = onlyDigits(v);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += (d.charCodeAt(i) - 48) * (len + 1 - i);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  return dv(9) === (d.charCodeAt(9) - 48) && dv(10) === (d.charCodeAt(10) - 48);
};

export const isStrongPassword = (s = "") => typeof s === "string" && s.length >= 6;

export const sanitizeName = (s = "") =>
  normSpaces(
    (s || "")
      .replace(/[0-9_]+/g, "")
      .replace(/[^\p{L}\s'.-]/gu, "")
  );

export const sanitizeNameLive = (s = "") => {

  let out = (s || "")
    .replace(/[0-9_]+/g, "")
    .replace(/[^\p{L}\s'.-]/gu, "");

  const hadTrailingSpace = /\s$/.test(out);


  out = out.replace(/\s{2,}/g, " ").replace(/^\s+/, "");

  if (hadTrailingSpace && !/\s$/.test(out)) out += " ";

  return out;
};

export const isValidFullName = (s = "") => {
  const n = sanitizeName(s);
  if (!n) return false;
  const parts = n.split(" ");
  if (parts.length < 2) return false;
  return parts.every((p) => p.length >= 2 && /[\p{L}]/u.test(p));
};
