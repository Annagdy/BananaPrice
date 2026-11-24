import re
import subprocess
from pathlib import Path

SAIDA = Path("..") / "codigo_BananaPrice.txt"

# Pastas ignoradas (em qualquer nível do caminho)
PASTAS_IGNORADAS = {
    "node_modules", ".next", ".git", ".vercel", ".vscode",
    "test-results", "playwright-report", "coverage",
    "tests", "test", "e2e", "__tests__", "__mocks__",
}

# Arquivos ignorados pelo nome exato
ARQUIVOS_IGNORADOS = {
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "playwright.config.ts", "playwright.config.js",
    "vitest.config.ts", "vitest.config.js", "vitest.setup.ts",
}

# *.test.ts, *.spec.tsx etc.
REGEX_TESTE = re.compile(r"\.(test|spec)\.[cm]?[jt]sx?$", re.IGNORECASE)

# Extensões binárias / sem utilidade em texto
EXT_IGNORADAS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
    ".pdf", ".zip", ".mp4", ".woff", ".woff2", ".ttf", ".eot",
}


def deve_ignorar(caminho: str) -> bool:
    p = Path(caminho)
    nome = p.name
    if any(parte in PASTAS_IGNORADAS for parte in p.parts[:-1]):
        return True
    if nome in ARQUIVOS_IGNORADOS or REGEX_TESTE.search(nome):
        return True
    if nome.startswith(".env"):  # evita vazar chaves do Supabase
        return True
    if p.suffix.lower() in EXT_IGNORADAS:
        return True
    return False


def listar_arquivos() -> list[str]:
    resultado = subprocess.run(
        ["git", "ls-files", "-z"], capture_output=True, check=True
    )
    return [c for c in resultado.stdout.decode("utf-8").split("\0") if c]


def main() -> None:
    incluidos, pulados = 0, 0
    with open(SAIDA, "w", encoding="utf-8", newline="\n") as saida:
        for caminho in listar_arquivos():
            if deve_ignorar(caminho):
                pulados += 1
                continue
            arq = Path(caminho)
            if not arq.is_file():
                continue
            dados = arq.read_bytes()
            if b"\0" in dados[:8000]:  # binário
                pulados += 1
                continue
            texto = dados.decode("utf-8", errors="replace")
            saida.write(f"===== {caminho} =====\n{texto}\n\n")
            incluidos += 1
    print(f"Pronto: {incluidos} arquivos incluídos, {pulados} ignorados.")
    print(f"Saída: {SAIDA.resolve()}")


if __name__ == "__main__":
    main()