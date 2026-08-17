import { useCallback, useState } from "react";
import { Toast } from "./Toast";

export function useToast() {
  const [state, setState] = useState({ msg: "", visible: false });
  const show = useCallback((msg: string) => {
    setState({ msg, visible: true });
    setTimeout(() => setState((s) => ({ ...s, visible: false })), 2200);
  }, []);
  return { toast: <Toast msg={state.msg} visible={state.visible} />, show };
}
