
import sys
import json
import re
import subprocess
import time
import os


sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")


MODELO = "qwen2.5:7b"
TEMPO_LIMITE = 300

OLLAMA_EXE = os.path.expandvars(
    r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
)


def log(mensagem):
    print(mensagem, file=sys.stderr, flush=True)


def limpar_resposta(texto):
    if not texto:
        return ""

    texto = texto.strip()

    texto = re.sub(
        r"^\s*(?:####\s*)?(?:O\s+)?ChatGPT\s+disse\s*:\s*",
        "",
        texto,
        flags=re.IGNORECASE
    )

    texto = re.sub(
        r"^\s*(?:Resposta|Resultado)\s*:\s*",
        "",
        texto,
        flags=re.IGNORECASE
    )

    return texto.strip()


def normalizar_nome(nome):
    nome = re.sub(r"\s+", " ", nome).strip()
    nome = re.sub(r"[.!?]+$", "", nome).strip()
    return nome.casefold()


def extrair_jogos(texto):
    if not texto:
        return []

    texto = limpar_resposta(texto)

    partes = re.split(r",|\n", texto)

    jogos = []
    encontrados = set()

    for parte in partes:
        nome = parte.strip()

        nome = re.sub(
            r"^\s*\d+[\.\)\-]\s*",
            "",
            nome
        )

        nome = re.sub(
            r"^\s*[-*•]\s*",
            "",
            nome
        )

        nome = nome.strip(" \t\r\n\"'`*#")

        if not nome:
            continue

        chave = normalizar_nome(nome)

        # Nunca aceitar NOT JOGO.
        if chave == "not jogo":
            continue

        # Ignorar respostas inválidas.
        if chave in [
            "jogo",
            "jogos",
            "nenhum",
            "nenhum jogo",
            "não",
            "nao",
            "sim",
            "resultado",
            "resposta"
        ]:
            continue

        if len(nome) < 3:
            continue

        # Eliminar títulos repetidos dentro da mesma resposta.
        if chave not in encontrados:
            encontrados.add(chave)
            jogos.append(nome)

    return jogos


def consultar_ollama(pergunta):

    comando = [
        OLLAMA_EXE,
        "run",
        MODELO
    ]

    processo = subprocess.run(
        comando,
        input=pergunta,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=TEMPO_LIMITE,
        check=False
    )

    if processo.returncode != 0:
        erro = processo.stderr.strip()

        raise Exception(
            erro if erro else
            f"O Ollama terminou com código {processo.returncode}."
        )

    resposta = processo.stdout.strip()

    if not resposta:
        raise Exception("O Ollama retornou uma resposta vazia.")

    return resposta


def pesquisar_jogos(busca):


    prompts = [
        f"""
Sua tarefa é identificar nomes de jogos eletrônicos relacionados ao termo "{busca}", priorizando títulos que existam no catálogo do IsThereAnyDeal (ITAD).

O objetivo é encontrar os nomes utilizados como títulos de jogos no catálogo do ITAD, e não simplesmente listar jogos conhecidos de uma franquia.

PRIMEIRA ETAPA - CORRESPONDÊNCIA DE TÍTULOS:
- Identifique jogos cujo nome oficial contenha o termo "{busca}".
- Considere títulos com palavras adicionais antes ou depois do termo pesquisado.
- Considere números, anos, subtítulos e identificadores de versões.
- Preserve os nomes completos utilizados nos cadastros dos jogos.
- Considere variações de grafia e nomenclatura internacional.

SEGUNDA ETAPA - FRANQUIAS:
- Identifique outros jogos da mesma franquia que possam estar cadastrados no ITAD.
- Inclua sequências, prequelas, spin-offs e jogos derivados.
- Considere que os títulos podem não conter a palavra "{busca}".
- Procure os nomes oficiais completos desses jogos.

REGRAS OBRIGATÓRIAS:
- Priorize títulos de jogos comerciais para PC que possam fazer parte do catálogo do IsThereAnyDeal.
- Não retorne nomes de franquias sem identificar jogos específicos.
- Não retorne DLCs, expansões, pacotes ou conteúdos adicionais como jogos independentes.
- Não invente títulos.
- Não repita nomes.
- Preserve números, subtítulos, pontuação e caracteres especiais.
- Não substitua nomes oficiais por nomes abreviados.
- Não afirme que verificou o catálogo do ITAD se não tiver acesso efetivo a ele.

FORMATO DA RESPOSTA:
Retorne exclusivamente os nomes completos dos jogos, separados por vírgulas.
Não inclua explicações, categorias, links ou comentários.
Se não identificar nenhum jogo, responda exatamente:
NOT JOGO
""",

        f"""
Faça uma segunda pesquisa aprofundada por jogos relacionados a "{busca}", priorizando os títulos e a nomenclatura utilizados em catálogos de jogos para PC, especialmente o IsThereAnyDeal (ITAD).

Procure jogos que possam estar cadastrados individualmente no ITAD, mesmo quando seus nomes não contenham diretamente o termo pesquisado.

INVESTIGUE:
- Todos os jogos da mesma franquia.
- Sequências numeradas e não numeradas.
- Prequelas e continuações.
- Spin-offs e jogos derivados.
- Remakes e remasters comercializados como jogos independentes.
- Jogos antigos da franquia que ainda possam constar no catálogo.
- Jogos com títulos internacionais ou subtítulos diferentes.

ATENÇÃO:
O resultado deve conter nomes de jogos específicos, e não nomes de franquias, desenvolvedoras ou distribuidoras.

Priorize a nomenclatura completa utilizada nos cadastros comerciais dos jogos.
Não simplifique títulos como "Nome do Jogo 2" para apenas "Nome do Jogo".
Não descarte números, subtítulos ou identificadores de edição.

REGRAS:
- Priorize jogos para PC potencialmente presentes no catálogo do ITAD.
- Não invente nomes.
- Não inclua DLCs ou expansões como jogos independentes.
- Não repita títulos.
- Não inclua jogos apenas porque compartilham características ou gênero.
- Não afirme que consultou o ITAD sem ter acesso efetivo ao catálogo.

FORMATO DA RESPOSTA:
Retorne somente os nomes completos dos jogos separados por vírgulas.
Não inclua explicações ou comentários.
Se não encontrar jogos relacionados, responda exatamente:
NOT JOGO
""",

        f"""
Faça uma terceira pesquisa, desta vez concentrada exclusivamente na correspondência textual entre "{busca}" e os títulos de jogos que podem estar cadastrados no IsThereAnyDeal (ITAD).

Procure jogos para PC cujos nomes contenham o termo "{busca}" em qualquer posição.

Considere todas estas possibilidades:

1. Títulos que começam com "{busca}".
2. Títulos que terminam com "{busca}".
3. Títulos que possuem "{busca}" no meio do nome.
4. Títulos que combinam "{busca}" com números, anos ou subtítulos.
5. Títulos que possuem palavras adicionais antes ou depois de "{busca}".
6. Títulos de franquias diferentes que utilizam a mesma palavra.
7. Variações de escrita, pontuação e nomenclatura internacional.

Não restrinja a busca a uma franquia específica.

O objetivo é identificar nomes completos de jogos comerciais para PC que possam corresponder aos registros individuais do catálogo do ITAD.

REGRAS OBRIGATÓRIAS:
- Priorize títulos que possam existir no catálogo do IsThereAnyDeal.
- Não invente jogos.
- Não retorne nomes de franquias sem títulos específicos.
- Não inclua DLCs, expansões ou pacotes como jogos independentes.
- Elimine nomes duplicados.
- Preserve a grafia oficial dos títulos.
- Não afirme que verificou o catálogo do ITAD sem acesso efetivo a ele.

FORMATO DA RESPOSTA:
Retorne exclusivamente os nomes completos dos jogos separados por vírgulas.
Não inclua explicações, categorias, links ou qualquer texto adicional.
Se não encontrar nenhum jogo, responda exatamente:
NOT JOGO
"""
    ]


    jogos_encontrados = []
    titulos_processados = set()

    for tentativa, pergunta in enumerate(prompts, start=1):

        try:
            log("=" * 40)

            log(
                f"Enviando pergunta {tentativa}/3 "
                f"para o Ollama ({MODELO})..."
            )

            inicio = time.time()

            resposta_bruta = consultar_ollama(pergunta)

            duracao = round(time.time() - inicio, 2)

            log(f"Resposta recebida em {duracao} segundos.")
            log("Resposta bruta:")
            log(resposta_bruta)

            jogos = extrair_jogos(resposta_bruta)

            if not jogos:
                log(
                    f"Nenhum título válido na tentativa {tentativa}."
                )
                continue

            # Acumular somente jogos distintos entre as três pesquisas.
            for jogo in jogos:

                chave = normalizar_nome(jogo)

                if chave == "not jogo":
                    continue

                if chave not in titulos_processados:
                    titulos_processados.add(chave)
                    jogos_encontrados.append(jogo)

            log(
                f"Total de jogos distintos acumulados: "
                f"{len(jogos_encontrados)}"
            )

        except subprocess.TimeoutExpired:
            log(
                f"A tentativa {tentativa} excedeu "
                f"o limite de {TEMPO_LIMITE} segundos."
            )

        except FileNotFoundError:
            raise Exception(
                f"O executável do Ollama não foi encontrado: {OLLAMA_EXE}"
            )

        except Exception as erro:
            log(f"Erro na tentativa {tentativa}: {erro}")

    log("=" * 40)

    # Se nenhuma das três pesquisas encontrou jogos válidos.
    if not jogos_encontrados:
        log("As três pesquisas foram concluídas sem encontrar jogos válidos.")
        return "NOT JOGO"

    resultado = ", ".join(jogos_encontrados)

    log(
        f"Total final de jogos distintos: "
        f"{len(jogos_encontrados)}"
    )

    log(f"Resultado final: {resultado}")

    return resultado


if __name__ == "__main__":

    try:
        if len(sys.argv) < 2:
            raise Exception(
                "Informe o nome do jogo para pesquisar."
            )

        busca = " ".join(sys.argv[1:]).strip()

        log("======================================")
        log(f"Busca original via Ollama: {busca}")

        resultado = pesquisar_jogos(busca)

        print(
            json.dumps(
                {"nome": resultado},
                ensure_ascii=False
            ),
            flush=True
        )

    except Exception as erro:
        log(f"Erro durante a pesquisa: {erro}")

        print(
            json.dumps(
                {"erro": str(erro)},
                ensure_ascii=False
            ),
            flush=True
        )
