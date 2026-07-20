import { useCallback, useEffect, useState } from "react";
import { normalizeArray } from "./normalize";
const useApiResource = (loader, deps = []) => {
  const [state, setState] = useState({
    data: [],
    loading: true,
    error: ""
  });
  const refresh = useCallback(() => {
    let mounted = true;
    setState((current) => ({ ...current, loading: true, error: "" }));
    loader().then((response) => {
      if (!mounted) return;
      setState({ data: normalizeArray(response), loading: false, error: "" });
    }).catch((error) => {
      if (!mounted) return;
      setState({ data: [], loading: false, error: error.message || "Unable to load data" });
    });
    return () => {
      mounted = false;
    };
  }, deps);
  useEffect(() => {
    const cleanup = refresh();
    return cleanup;
  }, [refresh]);
  return { ...state, refresh };
};
export {
  useApiResource
};
