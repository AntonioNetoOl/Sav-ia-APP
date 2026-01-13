 //src/hooks/useAuthAssets.js
import { Asset } from "expo-asset";
import { useEffect } from "react";

let logoPromise;
let crossPromise;

/**
 * Preload de assets usados nas telas de autenticação, com cache global
 * para evitar múltiplos downloads e reduzir “sumir” intermitente.
 */
export default function useAuthAssets() {
  useEffect(() => {
    try {
      if (!logoPromise) {
        logoPromise = Asset.fromModule(require("../../assets/Logo-savoia.png")).downloadAsync();
      }
      if (!crossPromise) {
        crossPromise = Asset.fromModule(require("../../assets/savoia-cruz.png")).downloadAsync();
      }
      Promise.all([logoPromise, crossPromise]).catch(() => {});
    } catch {
      // fallback silencioso
    }
  }, []);
}
