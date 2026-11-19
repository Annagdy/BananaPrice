const COOKIE = "bp_adulto";

/**
 * SERVIDOR: Verifica se o usuário optou por visualizar conteúdo adulto através do cookie da requisição HTTP.
 *
 * @param request Objeto da requisição recebida na rota ou middleware.
 * @returns Verdadeiro caso o cookie `bp_adulto=1` esteja presente.
 */
export function adultoPermitido(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return new RegExp(`(?:^|;\\s*)${COOKIE}=1(?:;|$)`).test(cookie);
}

/**
 * NAVEGADOR: Lê a preferência de conteúdo adulto gravada nos cookies locais do cliente.
 * @returns Verdadeiro se o cookie estiver ativo.
 */
export function adultoAtivoNoNavegador(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").includes(`${COOKIE}=1`);
}

/**
 * NAVEGADOR: Atualiza o cookie de preferência de conteúdo adulto com validade de 1 ano.
 * @param ativo Se verdadeiro ativa a exibição de conteúdo adulto; caso contrário expira o cookie.
 */
export function definirAdultoNoNavegador(ativo: boolean): void {
  document.cookie = ativo
    ? `${COOKIE}=1; max-age=31536000; path=/; SameSite=Lax`
    : `${COOKIE}=; max-age=0; path=/; SameSite=Lax`;
}